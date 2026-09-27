# ImmortalWrt 自定义 Packages

本仓库用于放在 ImmortalWrt 源码的 `package/extra-packages/` 目录下。

## Packages

- `frpc-multi`：支持多实例配置的 frp 客户端；`luci-app-frpc-multi` 提供 LuCI 管理页面。
- `internet-check`：通过 Ping 或 HTTP 检测网络连通性，可按状态控制 LED 或执行命令；`luci-app-internet-check` 提供 LuCI 管理页面。
- `extra-repo`：添加与固件版本、目标平台和内核 ABI 对应的额外软件源。
- `luci-app-openclash`：以 Git 子模块引入的 OpenClash。

## 克隆及初始化子模块

在 ImmortalWrt 源码根目录执行：

```sh
git clone --recurse-submodules https://github.com/codebotdev/extra-packages.git package/extra-packages
```

如果已经克隆了仓库，在 `package/extra-packages/` 目录下初始化子模块：

```sh
git submodule update --init --recursive
```
