/**
 * 按目标浏览器生成 manifest.json（Manifest V3）。
 * 参考 vitesse-webext 的动态 manifest 方案，集中维护各平台差异。
 */

const icons = {
	"16": "icons/smartproxy-16.png",
	"24": "icons/smartproxy-24.png",
	"48": "icons/smartproxy-48.png",
	"96": "icons/smartproxy-96.png",
	"128": "icons/smartproxy-128.png",
};

const chromiumCommands = {
	"next-proxy-server": {
		suggested_key: {
			"default": "Ctrl+Shift+Period",
			"mac": "Command+Shift+Period",
		},
		description: "Switch to next proxy server as the active proxy",
	},
	"proxy-mode-none": {
		suggested_key: {
			"default": "Ctrl+Shift+1",
			"mac": "Command+Shift+1",
		},
		description: "Switch to 'No Proxy' mode",
	},
	"proxy-mode-smart": {
		suggested_key: {
			"default": "Ctrl+Shift+2",
			"mac": "Command+Shift+2",
		},
		description: "Switch to 'Smart Proxy' mode",
	},
	"proxy-mode-always": {
		suggested_key: {
			"default": "Ctrl+Shift+3",
			"mac": "Command+Shift+0",
		},
		description: "Switch to 'Always Enabled' mode",
	},
};

const geckoCommands = {
	"next-proxy-server": {
		suggested_key: {
			"default": "Ctrl+Shift+Period",
		},
		description: "Switch to next proxy server as the active proxy",
	},
	"previous-proxy-server": {
		suggested_key: {
			"default": "Ctrl+Shift+Comma",
		},
		description: "Switch to the next previous server as the active proxy",
	},
	"proxy-mode-none": {
		suggested_key: {
			"default": "Ctrl+Shift+1",
		},
		description: "Switch to 'No Proxy' mode",
	},
	"proxy-mode-smart": {
		suggested_key: {
			"default": "Ctrl+Shift+2",
		},
		description: "Switch to 'Smart Proxy' mode",
	},
	"proxy-mode-always": {
		suggested_key: {
			"default": "Ctrl+Shift+3",
			"mac": "Command+Shift+9",
		},
		description: "Switch to 'Always Enabled' mode",
	},
	"proxy-mode-system": {
		suggested_key: {
			"default": "Ctrl+Shift+4",
			"mac": "Command+Shift+0",
		},
		description: "Switch to 'System' mode",
	},
};

const chromiumPermissions = [
	"activeTab",
	"tabs",
	"webNavigation",
	"proxy",
	"webRequest",
	"webRequestAuthProvider",
	"storage",
	"unlimitedStorage",
	"notifications",
	"alarms",
];

const geckoPermissions = [
	"activeTab",
	"tabs",
	"webNavigation",
	"proxy",
	"webRequest",
	"webRequestBlocking",
	"webRequestAuthProvider",
	"storage",
	"unlimitedStorage",
	"notifications",
	"dns",
	"alarms",
];

function baseManifest(overrides) {
	return {
		name: "__MSG_extensionName__",
		version: "2.4.3",
		manifest_version: 3,
		author: "Salar Khalilzadeh",
		description: "__MSG_extensionDescription__",
		homepage_url: "https://github.com/salarcode/SmartProxy",
		default_locale: "en",
		icons,
		host_permissions: ["<all_urls>"],
		action: {
			default_title: "__MSG_extensionName__",
			default_popup: "ui/popup.html",
			default_icon: icons,
		},
		options_ui: {
			page: "ui/settings.html",
			open_in_tab: true,
		},
		...overrides,
	};
}

const manifests = {
	chrome: baseManifest({
		permissions: chromiumPermissions,
		background: { service_worker: "core.js" },
		commands: chromiumCommands,
		minimum_chrome_version: "108",
	}),

	edge: baseManifest({
		permissions: chromiumPermissions,
		background: { service_worker: "core.js" },
		commands: chromiumCommands,
		minimum_chrome_version: "108",
	}),

	opera: baseManifest({
		permissions: [...chromiumPermissions, "clipboardRead", "clipboardWrite", "management"],
		background: { service_worker: "core.js" },
		commands: chromiumCommands,
		minimum_opera_version: "79",
	}),

	firefox: baseManifest({
		permissions: geckoPermissions,
		background: { scripts: ["core.js"] },
		commands: geckoCommands,
		browser_specific_settings: {
			gecko: {
				id: "smartproxy@salarcode.com",
				strict_min_version: "126.0",
			},
			gecko_android: {
				strict_min_version: "126.0",
			},
		},
	}),

	"firefox-unlisted": baseManifest({
		permissions: geckoPermissions,
		background: { scripts: ["core.js"] },
		commands: geckoCommands,
		browser_specific_settings: {
			gecko: {
				id: "smartproxy-unlisted@salarcode.com",
				strict_min_version: "126.0",
			},
			gecko_android: {
				strict_min_version: "126.0",
			},
		},
	}),

	"firefox-android": baseManifest({
		permissions: geckoPermissions,
		background: { scripts: ["core.js"] },
		browser_specific_settings: {
			gecko: {
				id: "smartproxy@salarcode.com",
				strict_min_version: "126.0",
			},
			gecko_android: {
				strict_min_version: "126.0",
			},
		},
	}),

	thunderbird: baseManifest({
		permissions: [
			"activeTab",
			"tabs",
			"webNavigation",
			"proxy",
			"webRequest",
			"webRequestBlocking",
			"webRequestAuthProvider",
			"storage",
			"unlimitedStorage",
			"notifications",
		],
		background: { scripts: ["core.js"] },
		commands: geckoCommands,
		browser_specific_settings: {
			gecko: {
				id: "smartproxy@salarcode.com",
				strict_min_version: "128.0",
			},
		},
	}),
};

export const supportedExtensions = Object.keys(manifests);

export function getManifest(extension) {
	const manifest = manifests[extension];
	if (!manifest) {
		throw new Error(
			`Unknown EXTENSION "${extension}". Supported values: ${supportedExtensions.join(", ")}`,
		);
	}
	return manifest;
}

/** 浏览器对应的环境配置文件（打包进 core 与各 UI 入口） */
export const browserConfigModule = (extension) => `src/core/browsers/${extension}.ts`;

/** Chromium 系使用 service worker，Gecko 系使用后台脚本 */
export const usesServiceWorker = (extension) =>
	manifests[extension]?.background?.service_worker !== undefined;
