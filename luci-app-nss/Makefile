# SPDX-License-Identifier: GPL-2.0-only
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-nss
PKG_RELEASE:=23
PKG_LICENSE:=GPL-2.0-only
PKG_BUILD_DEPENDS:=luci-base/host
PKG_FILE_DEPENDS:=$(CURDIR)/po

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-nss
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LuCI status page for NSS offloading
  DEPENDS:=+luci-base +TARGET_qualcommax_ipq50xx:nss-tools-dwmac \
	+!TARGET_qualcommax_ipq50xx:nss-tools
  PKGARCH:=all
endef

define Package/luci-app-nss/description
 Status -> NSS Offload: renders 'nss-status -j' (firmware state, cores,
 ports, ECM acceleration counts, SQM/fast-lane health) in LuCI, and adds
 the NSS core load and the ECM-accelerated connections to Status ->
 Overview.
endef

define Build/Compile
	$(STAGING_DIR_HOSTPKG)/bin/po2lmo ./po/zh_Hans/nss.po $(PKG_BUILD_DIR)/nss.zh-cn.lmo
endef

define Package/luci-app-nss/install
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/i18n
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/nss.zh-cn.lmo $(1)/usr/lib/lua/luci/i18n/nss.zh-cn.lmo
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/nss
	$(INSTALL_DATA) ./files/luci-nss-status.js $(1)/www/luci-static/resources/view/nss/status.js
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status/include
	$(INSTALL_DATA) ./files/luci-nss-overview.js $(1)/www/luci-static/resources/view/status/include/16_nss_offload.js
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/luci-app-nss.menu.json $(1)/usr/share/luci/menu.d/luci-app-nss.json
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/luci-app-nss.acl.json $(1)/usr/share/rpcd/acl.d/luci-app-nss.json
endef

$(eval $(call BuildPackage,luci-app-nss))
