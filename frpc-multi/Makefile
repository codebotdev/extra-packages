include $(TOPDIR)/rules.mk

PKG_NAME:=frpc-multi
PKG_VERSION:=0.71.0
PKG_RELEASE:=1

FRP_ARCH:=$(ARCH)
FRP_HASH:=skip

ifeq ($(ARCH),aarch64)
  FRP_ARCH:=arm64
  FRP_HASH:=f33c293c275d8fc68c654b6fba8f10b2551d6463d09a9fc9cffb7227eae82266
endif
ifeq ($(ARCH),x86_64)
  FRP_ARCH:=amd64
  FRP_HASH:=84f27e39f11169f7adcef8e8b70c9329de17747b1f14dad9fb95eef5682ea716
endif
ifeq ($(ARCH),arm)
  FRP_ARCH:=arm
  FRP_HASH:=f40a984f83e8d34a9241b0be4a9d5fbcfe513a4a5c022b84a02637ff6d36833b
endif
ifeq ($(ARCH),mips)
  FRP_HASH:=dd3fb404b546f215848db466c5707f501bcc2e24f605228f52e2a1546904a29d
endif
ifeq ($(ARCH),mipsel)
  FRP_ARCH:=mipsle
  FRP_HASH:=14498e36554a275a9d41a61aa29680616a34c7c9d8914e2173a46dada4928c70
endif
ifeq ($(ARCH),mips64)
  FRP_HASH:=3d336925e8bbba313d956b04d59e2dcf301f169304bbc105340133bc3e524451
endif
ifeq ($(ARCH),mips64el)
  FRP_ARCH:=mips64le
  FRP_HASH:=adcd256a6fa5c96985a1ddd02e0e759fc054fa3e858748055d7e49e80f51c68f
endif
ifeq ($(ARCH),riscv64)
  FRP_HASH:=92b48d5e4d44d2f1415fde24489d3dfff5badbd52ddf7e816467cdcaa973aa5c
endif
ifeq ($(ARCH),loongarch64)
  FRP_ARCH:=loong64
  FRP_HASH:=e5f4d7e25b677cca885f3db5cc958441bfa12e7214e05304601331ac3d84cebc
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
	$(INSTALL_DIR) $(1)/lib/upgrade/keep.d
	$(INSTALL_DATA) ./files/frpc-multi.keep $(1)/lib/upgrade/keep.d/frpc-multi
endef

$(eval $(call BuildPackage,frpc-multi))
