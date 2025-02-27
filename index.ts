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
			const dir = Bun.file(sharedDir);

			if (!(await dir.exists())) {
				throw new Error(`Shared directory not found: ${sharedDir}`);
			}

			// Use Glob to find all files in the directory
			const glob = new Glob("*");
			// scanSync returns full paths
			foundFiles = Array.from(glob.scanSync(sharedDir));
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
		const fileName = fullPath.split("/").pop() as string;

		// Ask if user wants to copy this file when in interactive mode
		let shouldCopy = true;
		if (interactive) {
			const copyResponse = await prompt(`Copy "${fileName}"? (y/n): `);
			shouldCopy =
				copyResponse.toLowerCase() === "y"
				|| copyResponse.toLowerCase() === "yes";

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
			finalPath = customPath.trim() || defaultPath;
		}

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
			copiedFiles.push(finalPath);
		} catch (error) {
			console.error(`Error copying ${fileName}:`, error);
		}
	}

	return copiedFiles;
}

// Main script execution
const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("-"));
const targetDir = process.cwd();

// Process each file interactively
(async () => {
	if (import.meta.main) {
		await copySharedFiles(files, targetDir, true);
	}
})();
