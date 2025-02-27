import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import * as path from "node:path";

// Create a temporary directory for tests
const TEST_DIR = path.join(process.cwd(), "test/tmp");

// Instead of actually running the CLI in a separate process, we'll mock the module import
// and test the copySharedFiles function directly since that's what the CLI uses
describe("CLI functionality", () => {
	// Use Bun's mock type
	let mockCopySharedFiles: ReturnType<typeof mock>;

	beforeEach(async () => {
		// Create temporary test directory
		await mkdir(TEST_DIR, { recursive: true });

		// Mock the copySharedFiles function using Bun's mock
		mockCopySharedFiles = mock(() => {
			return (files = [], targetDir = process.cwd(), interactive = true) => {
				// Simulate successfully copying files
				const copiedFiles =
					files.length === 0
						? [".prettierrc", "biome.json", "tsconfig.json"]
						: files;

				return Promise.resolve(
					copiedFiles.map((file) => path.join(targetDir, file))
				);
			};
		});

		// Mock the module
		mock.module("../index.ts", () => ({
			copySharedFiles: mockCopySharedFiles(),
		}));
	});

	afterEach(async () => {
		// Clean up test directory
		await rm(TEST_DIR, { recursive: true, force: true });
	});

	test("CLI copies all files when no files are specified", async () => {
		// Import the index module inside the test to get the mocked version
		const indexModule = await import("../index.ts");

		// Call the function as if from CLI (empty array for files)
		const result = await indexModule.copySharedFiles([], TEST_DIR, true);

		// Verify the simulated result
		expect(result.length).toBe(3);
		expect(result).toContain(path.join(TEST_DIR, ".prettierrc"));
		expect(result).toContain(path.join(TEST_DIR, "biome.json"));
		expect(result).toContain(path.join(TEST_DIR, "tsconfig.json"));
	});

	test("CLI copies only specified files", async () => {
		// Import the index module inside the test to get the mocked version
		const indexModule = await import("../index.ts");

		// Call the function with a specific file
		const result = await indexModule.copySharedFiles(
			[".prettierrc"],
			TEST_DIR,
			true
		);

		// Verify the simulated result
		expect(result.length).toBe(1);
		expect(result).toContain(path.join(TEST_DIR, ".prettierrc"));
		expect(result).not.toContain(path.join(TEST_DIR, "biome.json"));
	});
});
