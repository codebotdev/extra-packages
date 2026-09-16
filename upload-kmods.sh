#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(CDPATH= cd -- "$PROJECT_DIR/../.." && pwd)"


usage() {
	cat <<'EOF'
Usage: ./package/extra-packages/upload-kmods.sh [--dry-run]

Required environment variables:
  R2_BUCKET             Cloudflare R2 bucket name
  R2_ACCOUNT_ID         Cloudflare account ID (not needed with R2_ENDPOINT_URL)
  R2_ACCESS_KEY_ID      R2 access key ID (or AWS_ACCESS_KEY_ID)
  R2_SECRET_ACCESS_KEY  R2 secret access key (or AWS_SECRET_ACCESS_KEY)

Optional environment variables:
  R2_ENDPOINT_URL       Custom S3 endpoint URL
  R2_PREFIX             Bucket prefix, defaults to immortalwrt
  KMOD_DIR              Local directory to upload; defaults to the target packages directory
EOF
}

dry_run=false
case "${1:-}" in
	"") ;;
	--dry-run) dry_run=true ;;
	-h|--help)
		usage
		exit 0
		;;
	*)
		usage >&2
		exit 2
		;;
esac

if ! command -v aws >/dev/null 2>&1; then
	echo "error: AWS CLI is required" >&2
	exit 1
fi

if ! git -C "$SOURCE_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "error: ImmortalWrt repository not found: $SOURCE_DIR" >&2
	exit 1
fi

: "${R2_BUCKET:?R2_BUCKET is required}"

endpoint_url="${R2_ENDPOINT_URL:-}"
if [[ -z "$endpoint_url" ]]; then
	: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID or R2_ENDPOINT_URL is required}"
	endpoint_url="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

access_key="${R2_ACCESS_KEY_ID:-${AWS_ACCESS_KEY_ID:-}}"
secret_key="${R2_SECRET_ACCESS_KEY:-${AWS_SECRET_ACCESS_KEY:-}}"
if [[ -z "$access_key" || -z "$secret_key" ]]; then
	echo "error: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required" >&2
	exit 1
fi

build_values="$(make -C "$SOURCE_DIR" --no-print-directory -s \
	val.BOARD val.SUBTARGET val.STAGING_DIR)"
mapfile -t values <<< "$build_values"
if (( ${#values[@]} != 3 )); then
	echo "error: failed to read BOARD, SUBTARGET, and STAGING_DIR" >&2
	exit 1
fi
board="${values[0]}"
subtarget="${values[1]}"
staging_dir="${values[2]}"

version_number="$(make --no-print-directory -s -f /dev/null \
	--eval "TOPDIR:=$SOURCE_DIR" \
	--eval 'include $(TOPDIR)/rules.mk' \
	--eval 'include $(INCLUDE_DIR)/version.mk' \
	--eval 'print-version:;@printf "%s\n" "$(VERSION_NUMBER)"' \
	print-version)"

kernel_version_file="$staging_dir/kernel.version"
if [[ ! -f "$kernel_version_file" ]]; then
	echo "error: kernel version file not found: $kernel_version_file" >&2
	exit 1
fi
kernel_package_version="$(<"$kernel_version_file")"
if [[ ! "$kernel_package_version" =~ ^([^~]+)~(.+)-r([0-9]+)$ ]]; then
	echo "error: unsupported kernel version format: $kernel_package_version" >&2
	exit 1
fi
linux_version="${BASH_REMATCH[1]}"
linux_vermagic="${BASH_REMATCH[2]}"
linux_release="${BASH_REMATCH[3]}"
kernel_abi="${linux_version}-${linux_release}-${linux_vermagic}"

kmod_dir="${KMOD_DIR:-$SOURCE_DIR/bin/targets/$board/$subtarget/packages}"
if [[ ! -d "$kmod_dir" ]]; then
	echo "error: kmod directory not found: $kmod_dir" >&2
	exit 1
fi
if [[ ! -f "$kmod_dir/packages.adb" ]]; then
	echo "error: packages.adb not found; finish the build before uploading: $kmod_dir" >&2
	exit 1
fi

r2_prefix="${R2_PREFIX:-immortalwrt}"
r2_prefix="${r2_prefix#/}"
r2_prefix="${r2_prefix%/}"
object_prefix="$r2_prefix/$version_number/targets/$board/$subtarget/kmods/$kernel_abi"
destination="s3://$R2_BUCKET/$object_prefix/"

echo "Source:      $kmod_dir/"
echo "Destination: $destination"
echo "Public URL:  https://repo.kamino.eu.org/$object_prefix/packages.adb"

aws_args=(
	s3 sync "$kmod_dir/" "$destination"
	--endpoint-url "$endpoint_url"
	--only-show-errors
	--no-progress
)
if [[ "$dry_run" == true ]]; then
	aws_args+=(--dryrun)
fi

AWS_ACCESS_KEY_ID="$access_key" \
AWS_SECRET_ACCESS_KEY="$secret_key" \
AWS_DEFAULT_REGION=auto \
	aws "${aws_args[@]}"
