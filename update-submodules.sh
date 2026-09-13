#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

git -C "$repo_root" submodule sync --recursive
git -C "$repo_root" submodule update --init --remote --recursive
