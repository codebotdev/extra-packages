include $(TOPDIR)/rules.mk

PKG_NAME:=frpc-multi
PKG_VERSION:=0.70.1
PKG_RELEASE:=2

FRP_ARCH:=$(ARCH)
FRP_HASH:=skip

ifeq ($(ARCH),aarch64)
  FRP_ARCH:=arm64
  FRP_HASH:=3990f396a9a490ee7f0e5f355287750ed41520064ed999eab443b5e9a78d773d
endif
ifeq ($(ARCH),x86_64)
  FRP_ARCH:=amd64
  FRP_HASH:=333da23d1b9009d7c01638e9ba38cf4600f7d37d393f854e96ee1396adefa9a6
endif
ifeq ($(ARCH),arm)
  FRP_ARCH:=arm
  FRP_HASH:=da53c7211ce3ff7b4654e3018185fdd9b4b12143184f622e85653403862f3d3c
endif
ifeq ($(ARCH),mips)
  FRP_HASH:=23d4d42d868a0a21cc676b3d2fb9f98f067c5416ba135820696c0aeeaca3da50
endif
ifeq ($(ARCH),mipsel)
  FRP_ARCH:=mipsle
  FRP_HASH:=178648e0de01272c758346fde789a97dbf352dfb4744acddc634c629af054b92
endif
ifeq ($(ARCH),mips64)
  FRP_HASH:=1ff7f353667e6643727edd4d6488b1d9e3371cda42d8d7288787b44f8d7875b6
endif
ifeq ($(ARCH),mips64el)
  FRP_ARCH:=mips64le
  FRP_HASH:=1d42b86d51fdf030f901ebe7e7d0cecfc96a0aa690b0eca7dbb86e1963eab543
endif
ifeq ($(ARCH),riscv64)
  FRP_HASH:=e6eb6118b11b087e70cef1a398fbfa239e16a40c67693870dbda9540947e9070
endif
ifeq ($(ARCH),loongarch64)
  FRP_ARCH:=loong64
  FRP_HASH:=4defcc084778a6209a2cf50786a49837bb11ed474b6f185a7c2799775521e150
endif

PKG_SOURCE:=frp_$(PKG_VERSION)_linux_$(FRP_ARCH).tar.gz
PKG_SOURCE_URL:=https://github.com/fatedier/frp/releases/download/v$(PKG_VERSION)/
PKG_HASH:=$(FRP_HASH)
PKG_BUILD_DIR:=$(BUILD_DIR)/frp_$(PKG_VERSION)_linux_$(FRP_ARCH)

PKG_MAINTAINER:=
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/frpc-multi
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=frp client with multi-instance support
  URL:=https://github.com/fatedier/frp
  DEPENDS:=@(aarch64||arm||loongarch64||mips||mips64||mips64el||mipsel||riscv64||x86_64)
endef

define Package/frpc-multi/description
 A current upstream frpc binary packaged with a simple procd multi-instance
 service. Each enabled UCI instance runs one frpc process with its own TOML.
endef

define Package/frpc-multi/conffiles
/etc/config/frpc-multi
endef

define Build/Compile
endef

define Package/frpc-multi/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/frpc $(1)/usr/bin/frpc-multi
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/frpc-multi.init $(1)/etc/init.d/frpc-multi
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/frpc-multi.config $(1)/etc/config/frpc-multi
	$(INSTALL_DIR) $(1)/etc/frp/frpc.d
endef

$(eval $(call BuildPackage,frpc-multi))
