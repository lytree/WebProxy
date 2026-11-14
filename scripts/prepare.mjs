/**
 * 准备 extension 目录：复制静态资源、解压 UI 依赖库并生成 manifest.json。
 * 参考 vitesse-webext 的 scripts/prepare 方案。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const extensionDir = path.join(rootDir, "extension");

/** 页面未引用的库文件，解压时直接丢弃以减小包体 */
const uiLibExcludes = new Set(["datatables.js", "intro.min.js", "bootstrap.bundle.min.js.map"]);

/** 记录每个目标目录已复制的文件，watch 模式下用于清理被删除或重命名的文件 */
const copiedFiles = new Map();
let extractedZipSignature = null;

/** 仅在内容变化时复制，并保留源文件时间戳以便下次比较 */
function copyIfChanged(src, dest) {
	const sourceStat = fs.statSync(src);
	let destStat = null;
	try {
		destStat = fs.statSync(dest);
	} catch {
		// 目标不存在，直接复制
	}
	if (
		destStat &&
		destStat.size === sourceStat.size &&
		Math.abs(destStat.mtimeMs - sourceStat.mtimeMs) < 1
	) {
		return;
	}
	fs.copyFileSync(src, dest);
	fs.utimesSync(dest, sourceStat.atime, sourceStat.mtime);
}

function copyTree(src, dest, filter) {
	if (!fs.existsSync(src)) {
		console.warn(`[prepare] skip missing path: ${path.relative(rootDir, src)}`);
		return;
	}
	const seen = new Set();
	const walk = (from, to) => {
		fs.mkdirSync(to, { recursive: true });
		for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
			const sourcePath = path.join(from, entry.name);
			if (filter && !filter(sourcePath)) continue;
			const destPath = path.join(to, entry.name);
			if (entry.isDirectory()) {
				walk(sourcePath, destPath);
			} else if (entry.isFile()) {
				copyIfChanged(sourcePath, destPath);
				seen.add(destPath);
			}
		}
	};
	walk(src, dest);

	const previous = copiedFiles.get(dest);
	if (previous) {
		for (const stale of previous) {
			if (!seen.has(stale)) fs.rmSync(stale, { force: true });
		}
	}
	copiedFiles.set(dest, seen);
}

async function extractUiLibs({ force = false } = {}) {
	const zipPath = path.join(rootDir, "src/ui/js/libs-unzip-before-build.zip");
	if (!fs.existsSync(zipPath)) {
		return;
	}
	const stat = fs.statSync(zipPath);
	const signature = `${stat.mtimeMs}:${stat.size}`;
	const targetDir = path.join(extensionDir, "ui/js");
	if (!force && signature === extractedZipSignature && fs.existsSync(targetDir)) {
		return;
	}
	fs.mkdirSync(targetDir, { recursive: true });
	const decompress = (await import("@xhmikosr/decompress")).default;
	await decompress(zipPath, targetDir, {
		filter: (entry) => !uiLibExcludes.has(path.basename(entry.path)),
	});
	extractedZipSignature = signature;
}

export async function prepare({ clean = false, extension = "chrome" } = {}) {
	if (clean) {
		fs.rmSync(extensionDir, { recursive: true, force: true });
		copiedFiles.clear();
		extractedZipSignature = null;
	}
	fs.mkdirSync(extensionDir, { recursive: true });

	// UI 页面与静态资源（编译产物在 extension/ui/code，由 vite 输出）
	copyTree(path.join(rootDir, "src/ui"), path.join(extensionDir, "ui"), (src) => {
		const relative = path.relative(path.join(rootDir, "src/ui"), src);
		if (relative.startsWith("code")) return false;
		if (relative.endsWith(".zip")) return false;
		return true;
	});

	copyTree(path.join(rootDir, "src/icons"), path.join(extensionDir, "icons"));
	copyTree(path.join(rootDir, "src/assets"), path.join(extensionDir, "assets"));
	copyTree(path.join(rootDir, "src/_locales"), path.join(extensionDir, "_locales"), (src) => {
		return path.basename(src) !== "default-messages.json";
	});

	await extractUiLibs({ force: clean });

	// watch 模式下重新加载，确保 manifest.mjs 的修改立即生效
	const { getManifest } = await import(`./manifest.mjs?t=${Date.now()}`);
	const manifestPath = path.join(extensionDir, "manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(getManifest(extension), null, "\t") + "\n");
	console.log(`[prepare] extension "${extension}" ready at ${path.relative(rootDir, extensionDir)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const extension = process.env.EXTENSION || "chrome";
	await prepare({ clean: true, extension });
}
