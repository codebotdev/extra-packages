include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/kernel.mk
include $(INCLUDE_DIR)/version.mk

PKG_NAME:=extra-repo
PKG_RELEASE:=2

PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=Kamino

include $(INCLUDE_DIR)/package.mk

EXTRA_REPO_HOST:=repo.kamino.eu.org
EXTRA_REPO_EXTRA_URL:=https://$(EXTRA_REPO_HOST)/immortalwrt/$(VERSION_NUMBER)/packages/$(ARCH_PACKAGES)/extra/packages.adb
EXTRA_REPO_KMODS_URL:=https://$(EXTRA_REPO_HOST)/immortalwrt/$(VERSION_NUMBER)/targets/$(BOARD)/$(SUBTARGET)/kmods/$(LINUX_VERSION)-$(LINUX_RELEASE)-$(LINUX_VERMAGIC)/packages.adb

define Package/extra-repo
  SECTION:=base
  CATEGORY:=Base system
  TITLE:=Extra package repositories
endef

define Package/extra-repo/description
  Install extra package repositories matching the firmware version, architecture,
  target, subtarget, and kernel ABI of the current build.
endef

define Build/Compile
endef

define Package/extra-repo/install
	$(INSTALL_DIR) $(1)/etc/apk/repositories.d
	printf '%s\n%s\n' \
		'$(EXTRA_REPO_EXTRA_URL)' \
		'$(EXTRA_REPO_KMODS_URL)' \
		> $(1)/etc/apk/repositories.d/extra.list
endef

$(eval $(call BuildPackage,extra-repo))
