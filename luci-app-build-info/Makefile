# SPDX-License-Identifier: GPL-2.0-only
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-build-info
PKG_VERSION:=1.0.0
PKG_RELEASE:=7
PKG_LICENSE:=GPL-2.0-only
PKG_BUILD_DEPENDS:=luci-base/host
PKG_FILE_DEPENDS:=$(CURDIR)/po

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-build-info
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Firmware build information in the LuCI overview
  DEPENDS:=+luci-base
  PKGARCH:=all
endef

define Build/Compile
	$(STAGING_DIR_HOSTPKG)/bin/po2lmo ./po/zh_Hans/build-info.po $(PKG_BUILD_DIR)/build-info.zh-cn.lmo
endef

define Package/luci-app-build-info/install
	$(INSTALL_DIR) $(1)/usr/share/build-info
	python3 -c 'exec("import json, os, re, subprocess, sys, time\nfrom pathlib import Path\nfrom urllib.parse import urlsplit\n\ndef git(*args):\n    source = os.environ.get(\"IMMORTALWRT_DIR\") or sys.argv[1]\n    result = subprocess.run([\"git\", \"-C\", source, *args], capture_output=True, text=True)\n    return (result.stdout.strip() or None) if result.returncode == 0 else None\n\ndef repository_url(raw):\n    if not raw:\n        return None\n    # Discard credentials, query parameters and fragments before serialization.\n    raw = raw.strip()\n    if \"://\" not in raw:\n        match = re.fullmatch(r\"(?:[^/@\\s]+@)?([^/:\\s]+):(.+)\", raw)\n        if not match:\n            return None\n        raw = \"ssh://\" + match[1] + \"/\" + match[2]\n    try:\n        url = urlsplit(raw)\n        if url.scheme not in (\"http\", \"https\", \"ssh\", \"git\") or not url.hostname:\n            return None\n        host = url.hostname\n        if not re.fullmatch(r\"[A-Za-z0-9.-]+\", host):\n            return None\n        port = url.port\n        if url.scheme in (\"http\", \"https\") and port not in (None, 80, 443):\n            host += \":\" + str(port)\n        path = url.path.strip(\"/\")\n        if path.endswith(\".git\"):\n            path = path[:-4]\n        parts = path.split(\"/\")\n        if len(parts) < 2 or any(part in (\"\", \".\", \"..\") or not re.fullmatch(r\"[A-Za-z0-9_.~-]+\", part) for part in parts):\n            return None\n        return \"https://\" + host + \"/\" + path\n    except ValueError:\n        return None\n\n\ndef config_value(name):\n    config = Path(sys.argv[1]) / \".config\"\n    if not config.exists():\n        return None\n    match = re.search(r\"^\" + re.escape(name) + r\"=\\\"([^\\\"]*)\\\"\", config.read_text(), re.M)\n    return match[1] if match else None\n\ndef device_info():\n    profile = config_value(\"CONFIG_TARGET_PROFILE\") or \"\"\n    device = profile.removeprefix(\"DEVICE_\")\n    board = config_value(\"CONFIG_TARGET_BOARD\")\n    subtarget = config_value(\"CONFIG_TARGET_SUBTARGET\")\n    brand = model = None\n    if board and subtarget and device:\n        metadata = Path(sys.argv[1]) / \"bin/targets\" / board / subtarget / \"profiles.json\"\n        try:\n            titles = json.loads(metadata.read_text()).get(\"profiles\", {}).get(device, {}).get(\"titles\", [])\n            if titles:\n                brand, model = titles[0].get(\"vendor\"), titles[0].get(\"model\")\n        except (OSError, ValueError, AttributeError):\n            pass\n    if not brand or not model:\n        metadata = Path(sys.argv[1]) / \"tmp/.targetinfo\"\n        if metadata.exists():\n            for block in metadata.read_text().split(\"Target-Profile: \")[1:]:\n                if block.splitlines()[0].strip() == profile:\n                    match = re.search(r\"^Target-Profile-Name: (.+)\", block, re.M)\n                    if match:\n                        parts = match[1].split(None, 1)\n                        if len(parts) == 2:\n                            brand, model = parts\n                    break\n    distrib = config_value(\"CONFIG_VERSION_DIST\")\n    release = Path(sys.argv[3])\n    if not distrib and release.exists():\n        match = re.search(r\"^DISTRIB_ID=[\\\"\\x27]?([^\\\"\\x27\\n]+)\", release.read_text(), re.M)\n        distrib = match[1] if match else None\n    distrib = distrib or \"OpenWrt\"\n    slug = lambda value: re.sub(r\"[^a-z0-9]+\", \"_\", value.lower()).strip(\"_\")\n    author = \"https://u.kamino.eu.org\"\n    if brand and model:\n        author += \"/\" + slug(distrib).capitalize() + \"_\" + slug(brand + \" \" + model)\n    return {\"brand\": brand, \"model\": model, \"distrib_id\": distrib, \"author_url\": author}\n\nrun_id = os.environ.get(\"GITHUB_RUN_ID\") or None\nrun_id = run_id if run_id and run_id.isascii() and run_id.isdigit() else None\ninfo = {\n    \"timestamp\": int(time.time()),\n    \"branch\": git(\"rev-parse\", \"--abbrev-ref\", \"HEAD\"),\n    \"commit\": git(\"rev-parse\", \"HEAD\"),\n    \"short_commit\": git(\"rev-parse\", \"--short\", \"HEAD\"),\n    \"run_id\": run_id,\n    \"source_url\": repository_url(git(\"remote\", \"get-url\", \"origin\")),\n    \"run_url\": \"https://github.com/codebotdev/build/actions/runs/\" + run_id if run_id else None,\n}\ninfo.update(device_info())\nPath(sys.argv[2]).write_text(json.dumps(info) + \"\\n\", encoding=\"utf-8\")\n")' "$(TOPDIR)" "$(1)/usr/share/build-info/build-info.json" "$(STAGING_DIR_ROOT)/etc/openwrt_release"
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status/include
	$(INSTALL_DATA) ./files/11_build_info.js $(1)/www/luci-static/resources/view/status/include/11_build_info.js
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/luci-app-build-info.json $(1)/usr/share/rpcd/acl.d/luci-app-build-info.json
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/i18n
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/build-info.zh-cn.lmo $(1)/usr/lib/lua/luci/i18n/build-info.zh-cn.lmo
endef

$(eval $(call BuildPackage,luci-app-build-info))
