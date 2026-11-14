/**
 * Vite 构建入口：为指定浏览器生成 core 与三个 UI 代码包（IIFE，兼容现有静态页面）。
 *
 * 用法：
 *   EXTENSION=chrome node scripts/build.mjs
 *   EXTENSION=firefox node scripts/build.mjs --watch
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { prepare, extensionDir } from "./prepare.mjs";
import { browserConfigModule, usesServiceWorker } from "./manifest.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extension = process.env.EXTENSION || "chrome";
const watch = process.argv.includes("--watch");
const isDev = watch || process.env.NODE_ENV === "development";

const browserModule = browserConfigModule(extension);

const entries = [
	{
		id: "core",
		output: "core.js",
		files: [
			browserModule,
			usesServiceWorker(extension)
				? "src/core/ServiceWorker/CoreServiceWorker.ts"
				: "src/core/Core.ts",
		],
	},
	{
		id: "popup",
		output: "ui/code/popup.js",
		files: ["src/ui/code/popup.ts", browserModule],
	},
	{
		id: "proxyable",
		output: "ui/code/proxyable.js",
		files: ["src/ui/code/proxyable.ts", browserModule],
	},
	{
		id: "settingsPage",
		output: "ui/code/settingsPage.js",
		files: ["src/ui/code/settingsPage.ts", browserModule],
	},
];

/** 用虚拟模块把 “浏览器配置 + 业务入口” 合成单入口，保持与旧 webpack entry 数组一致 */
function virtualEntry(files) {
	const virtualId = "\0smartproxy-entry";
	const absoluteFiles = files.map((file) => path.join(rootDir, file));
	return {
		name: "smartproxy-virtual-entry",
		enforce: "pre",
		resolveId(source) {
			if (source === "virtual:smartproxy-entry") return virtualId;
		},
		load(id) {
			if (id === virtualId) {
				return absoluteFiles.map((file) => `import ${JSON.stringify(file)};`).join("\n");
			}
		},
	};
}

function buildEntry(entry) {
	return build({
		configFile: false,
		root: rootDir,
		mode: isDev ? "development" : "production",
		plugins: [virtualEntry(entry.files)],
		build: {
			outDir: extensionDir,
			emptyOutDir: false,
			target: "es2021",
			minify: !isDev,
			sourcemap: isDev,
			// src/lib 下保留了 CommonJS 形式的第三方脚本，需要交给 commonjs 插件转换
			commonjsOptions: {
				include: [/\.js$/],
			},
			watch: watch ? {} : null,
			rollupOptions: {
				input: "virtual:smartproxy-entry",
				output: {
					format: "iife",
					name: `WebProxy_${entry.id}`,
					entryFileNames: entry.output,
				},
			},
		},
	});
}

/**
 * fs.watch 的 recursive 选项在 Linux 上不受支持，
 * 这里手动遍历目录并为每个目录建立非递归监听。
 */
function watchDirectoryRecursive(target, callback) {
	const watchers = new Map();
	walk(target);
	return () => {
		for (const watcher of watchers.values()) watcher.close();
	};

	function walk(dir) {
		if (watchers.has(dir)) return;
		try {
			// 目录发生变化时重新遍历，为新创建的子目录补上监听
			watchers.set(
				dir,
				fs.watch(dir, (...args) => {
					callback(...args);
					walk(dir);
				}),
			);
		} catch (error) {
			console.warn(`[watch] cannot watch ${path.relative(rootDir, dir)}:`, error.message);
			return;
		}
		let entries;
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			if (entry.isDirectory()) walk(path.join(dir, entry.name));
		}
	}
}

function watchStaticFiles() {
	const targets = [
		path.join(rootDir, "src/ui"),
		path.join(rootDir, "src/icons"),
		path.join(rootDir, "src/_locales"),
		path.join(rootDir, "src/assets"),
		path.join(rootDir, "scripts/manifest.mjs"),
	];
	let timer = null;
	const refresh = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			prepare({ clean: false, extension }).catch((error) => {
				console.error("[watch] prepare failed:", error);
			});
		}, 300);
	};
	for (const target of targets) {
		if (!fs.existsSync(target)) continue;
		try {
			fs.watch(target, { recursive: true }, refresh);
		} catch {
			watchDirectoryRecursive(target, refresh);
		}
	}
}

async function main() {
	await prepare({ clean: !watch, extension });
	console.log(
		`[build] extension=${extension}, mode=${isDev ? "development" : "production"}, watch=${watch}`,
	);
	await Promise.all(entries.map(buildEntry));

	if (watch) {
		watchStaticFiles();
		console.log(`[build] watching sources, output: ${path.relative(rootDir, extensionDir)}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
