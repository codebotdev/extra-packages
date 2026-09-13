include $(TOPDIR)/rules.mk

PKG_NAME:=internet-check
PKG_RELEASE:=6
PKGARCH:=all

PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=Kamino

include $(INCLUDE_DIR)/package.mk

define Package/internet-check
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Network connectivity monitor
  DEPENDS:=+curl
endef

define Package/internet-check/description
  Monitor Internet connectivity using ICMP ping or HTTP GET, with configurable
  LED mappings and commands for connectivity state changes.
endef

define Build/Compile
endef

define Package/internet-check/conffiles
/etc/config/internet-check
endef

define Package/internet-check/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/internet-check.config $(1)/etc/config/internet-check
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/internet-check.init $(1)/etc/init.d/internet-check
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/internet-check.sh $(1)/usr/sbin/internet-check

endef

$(eval $(call BuildPackage,internet-check))
