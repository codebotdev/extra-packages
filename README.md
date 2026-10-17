# Extra Packages

## Packages

| Package | Description |
| :--- | :--- |
| `frpc-multi` | FRP client with multi-instance configuration support |
| `luci-app-frpc-multi` | LuCI web interface for `frpc-multi` |
| `internet-check` | Network connectivity checker via Ping or HTTP with LED and command control |
| `luci-app-internet-check` | LuCI web interface for `internet-check` |
| `extra-repo` | Extra software repositories matching firmware version, target platform, and kernel ABI |
| `luci-app-openclash` | OpenClash rules-based proxy client (via `OpenClash` submodule) |
| `rtp2httpd` | RTP/UDP to HTTP streaming proxy (via `rtp2httpd` submodule) |
| `luci-app-rtp2httpd` | LuCI web interface for `rtp2httpd` (via `rtp2httpd` submodule) |
| `tproxy-lan` | LAN TProxy routing (via `tproxy-lan` submodule) |
| `luci-app-tproxy-lan` | LuCI web interface for `tproxy-lan` (via `tproxy-lan` submodule) |
| `adguardhome` | AdGuard Home (copied from OpenWrt packages) |
| `luci-app-adguardhome` | LuCI web interface for AdGuard Home (copied from OpenWrt LuCI) |
| `natmap` | NAT port mapping tool (copied from OpenWrt packages) |
| `luci-app-natmap` | LuCI web interface for NATMap (copied from OpenWrt LuCI) |

## Upstream updates

The workflow updates submodules and copies configured packages on every branch
push, on manual dispatch, and daily at 04:00 Asia/Shanghai (20:00 UTC). Changes
are committed back to the triggering branch. GitHub runs scheduled workflows
only from the repository's default branch; the workflow must exist there to
enable the daily run, which updates that default branch.

`package-sources.json` lists repositories, branches, and package directories.
Add multiple entries to a repository's `packages` array to copy several packages
with one checkout. `source` is relative to the upstream repository;
`destination` is a package directory at this feed's root. Synced directories
are replaced completely, including removal of files deleted upstream. Make
local changes upstream because the next sync overwrites these directories.
Optional `replacements` entries (`file`, `old`, `new`) adapt copied files; the
AdGuard Home entries use them to resolve LuCI and Go build includes from the
`luci` and `packages` feeds. Sync fails if neither the old nor the new text is
found, so upstream changes to these lines need review.

To sync copied packages locally without committing or staging:

```sh
python3 scripts/sync-packages.py
```
