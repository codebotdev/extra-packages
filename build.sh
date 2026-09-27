#!/bin/sh
# Usage: ./package/extra-packages/build.sh [full|mini] [make arguments, e.g. -j1 V=s]
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH= cd -- "$script_dir/../.." && pwd)

profile=full
case ${1:-} in
	full|mini)
		profile=$1
		shift
		;;
	--config)
		if [ "$#" -lt 2 ]; then
			echo 'error: --config requires full or mini' >&2
			exit 2
		fi
		profile=$2
		shift 2
		;;
	--config=*)
		profile=${1#--config=}
		shift
		;;
	-h|--help)
		echo 'Usage: build.sh [full|mini] [make arguments]'
		echo '       build.sh --config full|mini [make arguments]'
		exit 0
		;;
esac
case $profile in
	full|mini) ;;
	*) echo "error: unknown config: $profile (expected full or mini)" >&2; exit 2 ;;
esac

cd "$root"
for config in jdc-nss.config package/extra-packages/kmod.config "package/extra-packages/$profile.config"; do
	if [ ! -f "$config" ]; then
		echo "error: config file not found: $config" >&2
		exit 1
	fi
done
for script in scripts/feeds scripts/apply-nss-feed-patches.sh; do
	if [ ! -x "$script" ]; then
		echo "error: executable script not found: $script" >&2
		exit 1
	fi
done

# A previous build leaves feed patches applied. Reset them before refreshing
# feed indexes, including untracked files created by patches.
for feed in nss_packages packages luci; do
	feed_dir="feeds/$feed"
	if [ -e "$feed_dir" ]; then
		if [ ! -d "$feed_dir/.git" ] && [ ! -f "$feed_dir/.git" ]; then
			echo "error: feed is not a Git checkout: $feed_dir" >&2
			exit 1
		fi
		git -C "$feed_dir" restore --source=HEAD --staged --worktree .
		git -C "$feed_dir" clean -fd
	fi
done

./scripts/feeds update -a
./scripts/apply-nss-feed-patches.sh
./scripts/feeds install -a

# Replace .config only after the feeds and patches are ready.
merged=$(mktemp "$root/.config.merge.XXXXXX")
trap 'rm -f "$merged"' EXIT
trap 'exit 1' HUP INT TERM
for config in jdc-nss.config package/extra-packages/kmod.config "package/extra-packages/$profile.config"; do
	cat "$config" >> "$merged"
	printf '\n' >> "$merged"
done
mv "$merged" .config

make defconfig
make download -j"$(nproc)"
make -j"$(nproc)" "$@"

commit=$(git -C "$root" rev-parse --short HEAD)
staging_dir=$(make --no-print-directory -s val.STAGING_DIR)
kernel_version_file=$staging_dir/kernel.version
if [ ! -f "$kernel_version_file" ]; then
	echo "error: kernel version file not found: $kernel_version_file" >&2
	exit 1
fi
kernel_package_version=$(cat "$kernel_version_file")
case $kernel_package_version in
	*~*-r[0-9]*) ;;
	*) echo "error: unsupported kernel version format: $kernel_package_version" >&2; exit 1 ;;
esac
linux_version=${kernel_package_version%%~*}
linux_vermagic=${kernel_package_version#*~}
linux_vermagic=${linux_vermagic%-r*}
linux_release=${kernel_package_version##*-r}
if [ -z "$linux_version" ] || [ -z "$linux_vermagic" ]; then
	echo "error: unsupported kernel version format: $kernel_package_version" >&2
	exit 1
fi
case $linux_release in
	''|*[!0-9]*) echo "error: unsupported kernel version format: $kernel_package_version" >&2; exit 1 ;;
esac

printf 'Git commit: %s\nKernel ABI: %s-%s-%s\n' \
	"$commit" "$linux_version" "$linux_release" "$linux_vermagic"
