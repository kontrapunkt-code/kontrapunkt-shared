#!/usr/bin/env bun
import { Glob } from "bun";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

// Get the directory where the package is installed
const __dirname = dirname(import.meta.dir);
const sharedDir = join(__dirname, "shared");

/**
 * Simple prompt function for user input
 */
async function prompt(question: string): Promise<string> {
	return new Promise((resolve) => {
		const { stdin, stdout } = process;

		stdout.write(question);

		const onData = (data: Buffer) => {
			const response = data.toString().trim();
			stdin.removeListener("data", onData);
			stdin.pause();
			resolve(response);
		};

		stdin.resume();
		stdin.setEncoding("utf8");
		stdin.on("data", onData);
	});
}

// Main script execution
const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("-"));
const targetDir = process.cwd();

// Find files to process
let foundFiles: string[] = [];

// If no files specified, copy all files from shared directory
if (files.length === 0) {
	try {
		// Check if the shared directory exists
		const dir = Bun.file(sharedDir);

		if (!(await dir.exists())) {
			console.error(`Shared directory not found: ${sharedDir}`);
			process.exit(1);
		}

		// Use Glob to find all files in the directory
		const glob = new Glob("*");
		// scanSync returns full paths
		foundFiles = Array.from(glob.scanSync(sharedDir));
	} catch (error) {
		console.error("Error reading shared directory:", error);
		process.exit(1);
	}
} else {
	// When specific files are provided, construct full paths
	foundFiles = files.map((file) => join(sharedDir, file));
}

// Process each file interactively
(async () => {
	for (const fullPath of foundFiles) {
		const fileName = fullPath.split("/").pop() as string;

		// Ask if user wants to copy this file
		const copyResponse = await prompt(`Copy "${fileName}"? (y/n): `);
		if (
			copyResponse.toLowerCase() !== "y"
			&& copyResponse.toLowerCase() !== "yes"
		) {
			console.log(`Skipped ${fileName}`);
			continue;
		}

		// Ask where to copy the file
		const defaultPath = join(targetDir, fileName);
		const customPath = await prompt(`Destination (default: ${defaultPath}): `);
		const finalPath = customPath.trim() || defaultPath;

		try {
			const sourceFile = Bun.file(fullPath);

			if (!(await sourceFile.exists())) {
				console.warn(`File not found: ${fullPath}`);
				continue;
			}

			// Read the file content
			const content = await sourceFile.arrayBuffer();

			// Create directory if it doesn't exist
			const destDir = dirname(finalPath);
			await mkdir(destDir, { recursive: true });

			// Write to the target location
			await Bun.write(finalPath, content);
			console.log(`Copied ${fileName} to ${finalPath}`);
		} catch (error) {
			console.error(`Error copying ${fileName}:`, error);
		}
	}
})();
