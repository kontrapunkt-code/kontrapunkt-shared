#!/usr/bin/env node
import * as fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { createInterface } from "node:readline";

// Get the directory where the package is installed
const packageDir = dirname(new URL(import.meta.url).pathname);
const sharedDir = join(packageDir, "shared");

/**
 * Simple prompt function for user input
 */
async function prompt(question: string): Promise<string> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

/**
 * Copy shared configuration files to a target directory
 * @param files Optional array of specific files to copy. If empty, all files will be copied.
 * @param targetDirectory Optional target directory. Defaults to current working directory.
 * @param interactive Whether to prompt for confirmation before copying each file. Defaults to true.
 * @returns Array of copied file paths
 */
export async function copySharedFiles(
	files: string[] = [],
	targetDirectory: string = process.cwd(),
	interactive: boolean = true,
): Promise<string[]> {
	// Find files to process
	let foundFiles: string[] = [];

	// If no files specified, copy all files from shared directory
	if (files.length === 0) {
		try {
			// Check if the shared directory exists
			if (!fs.existsSync(sharedDir)) {
				throw new Error(`Shared directory not found: ${sharedDir}`);
			}

			// Find all files in the directory
			foundFiles = fs
				.readdirSync(sharedDir)
				.map((file) => join(sharedDir, file))
				.filter((path) => fs.statSync(path).isFile());
		} catch (error) {
			console.error("Error reading shared directory:", error);
			throw error;
		}
	} else {
		// When specific files are provided, construct full paths
		foundFiles = files.map((file) => join(sharedDir, file));
	}

	const copiedFiles: string[] = [];

	// Process each file
	for (const fullPath of foundFiles) {
		const fileName = basename(fullPath);

		// Ask if user wants to copy this file when in interactive mode
		let shouldCopy = true;
		if (interactive) {
			const copyResponse = await prompt(`Copy "${fileName}"? (y/n): `);
			shouldCopy = copyResponse.toLowerCase().startsWith("y");

			if (!shouldCopy) {
				console.log(`Skipped ${fileName}`);
				continue;
			}
		}

		// Ask where to copy the file when in interactive mode
		let finalPath = join(targetDirectory, fileName);
		if (interactive) {
			const defaultPath = finalPath;
			const customPath = await prompt(
				`Destination (default: ${defaultPath}): `,
			);
			finalPath = customPath || defaultPath;
		}

		try {
			// Check if file exists
			if (!fs.existsSync(fullPath)) {
				console.warn(`File not found: ${fullPath}`);
				continue;
			}

			// Read the file content
			const content = fs.readFileSync(fullPath);

			// Create directory if it doesn't exist
			const destDir = dirname(finalPath);
			await mkdir(destDir, { recursive: true });

			// Write to the target location
			fs.writeFileSync(finalPath, content);

			console.log(`Copied ${fileName} to ${finalPath}`);
			copiedFiles.push(finalPath);
		} catch (error) {
			console.error(`Error copying ${fileName}:`, error);
		}
	}

	return copiedFiles;
}

// Main script execution
if (import.meta.main) {
	const args = process.argv.slice(2);
	const files = args.filter((arg) => !arg.startsWith("-"));
	const targetDir = process.cwd();

	await copySharedFiles(files, targetDir, true);
}
