#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Get the directory where this script is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Read package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Read deno.json
const denoJsonPath = path.join(rootDir, "deno.json");
const denoJson = JSON.parse(fs.readFileSync(denoJsonPath, "utf8"));

// Update deno.json version
if (packageJson.version !== denoJson.version) {
	console.log(
		`Updating deno.json version from ${denoJson.version} to ${packageJson.version}`,
	);
	denoJson.version = packageJson.version;

	// Write back to deno.json
	fs.writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, "\t") + "\n");
	console.log("✅ Version synchronized successfully!");
} else {
	console.log("✅ Versions already in sync!");
}
