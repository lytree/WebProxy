/** 将 extension 目录打包为可上传商店的 zip */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "extension");
const outputFile = path.join(rootDir, "extension.zip");

if (!fs.existsSync(path.join(sourceDir, "manifest.json"))) {
	console.error("extension/ is not built yet. Run a build script first.");
	process.exit(1);
}

const zip = new JSZip();

function addDirectory(dir, base) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		const archivePath = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			addDirectory(entryPath, archivePath);
		} else {
			zip.file(archivePath, fs.readFileSync(entryPath));
		}
	}
}

addDirectory(sourceDir, "");

const content = await zip.generateAsync({
	type: "nodebuffer",
	compression: "DEFLATE",
	compressionOptions: { level: 9 },
});
fs.writeFileSync(outputFile, content);
console.log(`[pack] ${path.relative(rootDir, outputFile)} (${(content.length / 1024).toFixed(1)} KiB)`);
