# ImmortalWrt extra packages

## 项目结构

- `frpc-multi/`、`internet-check/`：服务程序及启动脚本。
- `luci-app-frpc-multi/`、`luci-app-internet-check/`：LuCI 页面和翻译。
- `luci-app-openclash/`：上游 OpenClash 子模块。
- `extra-repo/`：与固件内核版本匹配的软件源配置。
- `build.sh`、`kmod.config`、`packages.config`：构建入口和配置片段。
- `config`：供外部构建流程使用的包选择片段，保留兼容。
- `upload-kmods.sh`：上传内核软件包到 R2。

## 构建

将本仓库放在 ImmortalWrt 源码的 `package/extra-packages/` 下，执行：

```sh
./build.sh
```

脚本合并源码根目录的 `jdc-nss.config`（如果存在）、本仓库的
`kmod.config` 和 `packages.config`，覆盖源码根目录的 `.config`，
然后执行 `make defconfig` 和编译。

## 本地凭据与文件

上传脚本通过环境变量读取凭据，不会自动加载 `.env`。首次使用：

```sh
cp .env.example .env
chmod 600 .env
# 在本地编辑 .env，填写凭据后再执行：
set -a
. ./.env
set +a
./upload-kmods.sh --dry-run
```

`.env`、私钥、证书、备份和编译产物已列入 `.gitignore`。
设备导出的 TOML、日志和其他私有文件请放到 `local/` 或 `backups/`，
不要放进包的 `files/` 或 `root/` 源码目录。
`.env.example` 只允许保留空值和说明，不要填写真实凭据。

提交前检查 `git status --short` 和 `git diff --cached`。
忽略规则不影响已跟踪文件，也不会清除历史中的敏感信息；
OpenClash 子模块有独立的 Git 状态和忽略规则，需要单独检查。

## 子模块

Clone this repository and initialize submodules at the latest commit of their
configured branches:

```sh
git clone --recurse-submodules --remote-submodules <repository-url>
```

Update all submodules to the latest commit later:

```sh
./update-submodules.sh
```

OpenClash tracks its upstream `master` branch. Git still records the resolved
submodule commit in this repository so builds can be reproduced.
