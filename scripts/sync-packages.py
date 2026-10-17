#!/usr/bin/env python3
"""Copy configured package directories from upstream Git branches."""

import argparse
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile


def git(*args, cwd=None):
    subprocess.run(["git", *args], cwd=cwd, check=True)


def sync_packages(config, root, stage=False):
    destinations = set()
    repositories = config["repositories"]
    for repository in repositories:
        if not repository["url"] or not repository["branch"]:
            raise ValueError("Each repository needs a URL and branch")
        for package in repository["packages"]:
            source = PurePosixPath(package["source"])
            destination = package["destination"]
            if source.is_absolute() or ".." in source.parts or not source.parts:
                raise ValueError(f"Invalid source: {source}")
            # Destinations are individual package directories at the feed root.
            if (not destination or destination.startswith(".")
                    or "/" in destination or "\\" in destination
                    or destination in destinations):
                raise ValueError(f"Invalid or duplicate destination: {destination}")
            target = root / destination
            if target.is_symlink() or (target.exists() and not target.is_dir()):
                raise ValueError(f"Destination is not a regular directory: {target}")
            if (target / ".git").exists():
                raise ValueError(f"Cannot overwrite a Git repository: {target}")
            destinations.add(destination)

    with tempfile.TemporaryDirectory(prefix="sync-packages-") as temporary:
        copies = []
        for index, repository in enumerate(repositories):
            packages = repository["packages"]
            if not packages:
                continue
            checkout = Path(temporary) / str(index)
            git("clone", "--depth", "1", "--filter=blob:none", "--sparse",
                "--single-branch", "--branch", repository["branch"],
                "--", repository["url"], str(checkout))
            git("sparse-checkout", "set", "--", *[p["source"] for p in packages],
                cwd=checkout)
            for package in packages:
                source = checkout / package["source"]
                if not source.is_dir() or source.is_symlink() or not (source / "Makefile").is_file():
                    raise ValueError(f"Package directory or Makefile missing: {source}")
                for replacement in package.get("replacements", []):
                    relative = PurePosixPath(replacement["file"])
                    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
                        raise ValueError(f"Invalid replacement file: {relative}")
                    path = source / relative
                    if not path.resolve().is_relative_to(source.resolve()):
                        raise ValueError(f"Replacement file escapes package: {path}")
                    content = path.read_text()
                    old, new = replacement["old"], replacement["new"]
                    if not old or not new:
                        raise ValueError(f"Empty replacement in {path}")
                    if old in content:
                        path.write_text(content.replace(old, new))
                    elif new not in content:
                        raise ValueError(f"Replacement text missing in {path}: {old}")
                copies.append((source, root / package["destination"]))

        # Fetch and validate every source before replacing any local package.
        for source, target in copies:
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(source, target, symlinks=True)
            print(f"Synced {target.name}", flush=True)

    if stage and destinations:
        git("add", "--all", "--", *sorted(destinations), cwd=root)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path("package-sources.json"))
    parser.add_argument("--stage", action="store_true", help="Stage copied package changes")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    config_path = args.config if args.config.is_absolute() else root / args.config
    sync_packages(json.loads(config_path.read_text()), root, stage=args.stage)


if __name__ == "__main__":
    main()
