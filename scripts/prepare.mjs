/**
 * 准备 extension 目录：复制静态资源、解压 UI 依赖库并生成 manifest.json。
 * 参考 vitesse-webext 的 scripts/prepare 方案。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getManifest } from "./manifest.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const extensionDir = path.join(rootDir, "extension");

function copy(src, dest, filter) {
	if (!fs.existsSync(src)) {
		console.warn(`[prepare] skip missing path: ${path.relative(rootDir, src)}`);
		return;
	}
	fs.cpSync(src, dest, { recursive: true, filter });
}

async function extractUiLibs() {
	const zipPath = path.join(rootDir, "src/ui/js/libs-unzip-before-build.zip");
	if (!fs.existsSync(zipPath)) {
		return;
	}
	fs.mkdirSync(path.join(extensionDir, "ui/js"), { recursive: true });
	const decompress = (await import("@xhmikosr/decompress")).default;
	await decompress(zipPath, path.join(extensionDir, "ui/js"));
}

export async function prepare({ clean = false, extension = "chrome" } = {}) {
	if (clean) {
		fs.rmSync(extensionDir, { recursive: true, force: true });
	}
	fs.mkdirSync(extensionDir, { recursive: true });

	// UI 页面与静态资源（编译产物在 extension/ui/code，由 vite 输出）
	copy(path.join(rootDir, "src/ui"), path.join(extensionDir, "ui"), (src) => {
		const relative = path.relative(path.join(rootDir, "src/ui"), src);
		if (relative.startsWith("code")) return false;
		if (relative.endsWith(".zip")) return false;
		return true;
	});

	copy(path.join(rootDir, "src/icons"), path.join(extensionDir, "icons"));
	copy(path.join(rootDir, "src/assets"), path.join(extensionDir, "assets"));
	copy(path.join(rootDir, "src/_locales"), path.join(extensionDir, "_locales"), (src) => {
		return path.basename(src) !== "default-messages.json";
	});

	await extractUiLibs();

	const manifestPath = path.join(extensionDir, "manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(getManifest(extension), null, "\t") + "\n");
	console.log(`[prepare] extension "${extension}" ready at ${path.relative(rootDir, extensionDir)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const extension = process.env.EXTENSION || "chrome";
	await prepare({ clean: true, extension });
}
