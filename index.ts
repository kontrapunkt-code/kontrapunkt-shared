#!/usr/bin/env node
import * as fs from "node:fs";
import { cp, mkdir } from "node:fs/promises";
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
 * @param files Optional array of specific files or directories to copy. If empty, all files and directories will be copied.
 * @param targetDirectory Optional target directory. Defaults to current working directory.
 * @param interactive Whether to prompt for confirmation before copying each file. Defaults to true.
 * @returns Array of copied file paths
 */
export async function copySharedFiles(
	files: string[] = [],
	targetDirectory: string = process.cwd(),
	interactive: boolean = true,
): Promise<string[]> {
	// Find files and directories to process
	let foundItems: string[] = [];

	// If no files specified, copy all files from shared directory
	if (files.length === 0) {
		try {
			// Check if the shared directory exists
			if (!fs.existsSync(sharedDir)) {
				throw new Error(`Shared directory not found: ${sharedDir}`);
			}

			// Find all files and directories
			foundItems = fs
				.readdirSync(sharedDir)
				.map((item) => join(sharedDir, item));
		} catch (error) {
			console.error("Error reading shared directory:", error);
			throw error;
		}
	} else {
		// When specific files/directories are provided, construct full paths
		foundItems = files.map((file) => join(sharedDir, file));
	}

	const copiedItems: string[] = [];

	// Process each file or directory
	for (const fullPath of foundItems) {
		const itemName = basename(fullPath);
		const isDirectory =
			fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();

		// Ask if user wants to copy this item when in interactive mode
		let shouldCopy = true;
		if (interactive) {
			const itemType = isDirectory ? "directory" : "file";
			const copyResponse = await prompt(
				`Copy ${itemType} "${itemName}"? (y/n): `,
			);
			shouldCopy = copyResponse.toLowerCase().startsWith("y");

			if (!shouldCopy) {
				console.log(`Skipped ${itemName}`);
				continue;
			}
		}

		// Ask where to copy the item when in interactive mode
		let finalPath = join(targetDirectory, itemName);
		if (interactive) {
			const defaultPath = finalPath;
			const customPath = await prompt(
				`Destination (default: ${defaultPath}): `,
			);
			finalPath = customPath || defaultPath;
		}

		try {
			// Check if item exists
			if (!fs.existsSync(fullPath)) {
				console.warn(`Item not found: ${fullPath}`);
				continue;
			}

			if (isDirectory) {
				// For directories, use recursive copy
				await mkdir(finalPath, { recursive: true });
				await cp(fullPath, finalPath, { recursive: true });
				console.log(`Copied directory ${itemName} to ${finalPath}`);
			} else {
				// Read the file content
				const content = fs.readFileSync(fullPath);

				// Create directory if it doesn't exist
				const destDir = dirname(finalPath);
				await mkdir(destDir, { recursive: true });

				// Write to the target location
				fs.writeFileSync(finalPath, content);
				console.log(`Copied file ${itemName} to ${finalPath}`);
			}

			copiedItems.push(finalPath);
		} catch (error) {
			console.error(`Error copying ${itemName}:`, error);
		}
	}

	return copiedItems;
}

// Main script execution
if (import.meta.main) {
	const args = process.argv.slice(2);
	const files = args.filter((arg) => !arg.startsWith("-"));
	const targetDir = process.cwd();

	await copySharedFiles(files, targetDir, true);
}
