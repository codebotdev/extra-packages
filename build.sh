#!/bin/sh
# Usage: ./package/extra-packages/build.sh [make arguments, e.g. -j1 V=s]
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
cd "$root"

# Write atomically so a failed merge does not truncate the current configuration.
merged=$(mktemp "$root/.config.merge.XXXXXX")
trap 'rm -f "$merged"' EXIT
trap 'exit 1' HUP INT TERM
found=0
for config in jdc-nss.config package/extra-packages/kmod.config package/extra-packages/packages.config; do
	[ -f "$config" ] || continue
	cat "$config" >> "$merged"
	printf '\n' >> "$merged"
	found=1
done
if [ "$found" -eq 1 ]; then
	mv "$merged" .config
else
	rm -f "$merged"
fi

make defconfig
exec make -j"$(nproc)" "$@"
