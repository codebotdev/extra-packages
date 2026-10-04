include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/kernel.mk
include $(INCLUDE_DIR)/version.mk

PKG_NAME:=extra-repo
PKG_RELEASE:=1

PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=Kamino

include $(INCLUDE_DIR)/package.mk

EXTRA_REPO_DEFAULT_HOST:=repo.kamino.eu.org
EXTRA_REPO_RESOLVED_HOST:=$(if $(strip $(EXTRA_REPO_HOST)),$(strip $(EXTRA_REPO_HOST)),$(EXTRA_REPO_DEFAULT_HOST))
EXTRA_REPO_DEFAULT_URL:=https://$(EXTRA_REPO_RESOLVED_HOST)/immortalwrt/$(VERSION_NUMBER)/targets/$(BOARD)/$(SUBTARGET)/kmods/$(LINUX_VERSION)-$(LINUX_RELEASE)-$(LINUX_VERMAGIC)/packages.adb
EXTRA_REPO_RESOLVED_URL:=$(if $(strip $(EXTRA_REPO_URL)),$(strip $(EXTRA_REPO_URL)),$(EXTRA_REPO_DEFAULT_URL))

define Package/extra-repo
  SECTION:=base
  CATEGORY:=Base system
  TITLE:=Extra package repository
endef

define Package/extra-repo/description
  Install an extra package repository matching the firmware version, target,
  subtarget, and kernel ABI of the current build.
endef

define Build/Compile
endef

define Package/extra-repo/install
	$(INSTALL_DIR) $(1)/etc/apk/repositories.d
	printf '%s\n' '$(EXTRA_REPO_RESOLVED_URL)' \
		> $(1)/etc/apk/repositories.d/extra.list
endef

$(eval $(call BuildPackage,extra-repo))
