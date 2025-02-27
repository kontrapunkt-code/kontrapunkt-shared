import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import * as fs from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import * as path from "node:path";
import { copySharedFiles } from "../index";

// Create a temporary directory for tests
const TEST_DIR = path.join(process.cwd(), "test/tmp");

describe("copySharedFiles error handling", () => {
	beforeEach(async () => {
		// Create temporary test directory
		await mkdir(TEST_DIR, { recursive: true });

		// Silence console output during tests
		spyOn(console, "log").mockImplementation(() => {});
		spyOn(console, "error").mockImplementation(() => {});
		spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(async () => {
		// Clean up test directory
		await rm(TEST_DIR, { recursive: true, force: true });
	});

	test("handles fs errors gracefully when reading source directory", async () => {
		// Mock fs module using Bun's mock API
		const existsSyncSpy = spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path.toString().includes("shared")) {
				return false;
			}
			return false; // Just return false for simplicity in the test
		});

		try {
			// This should throw an error but not crash
			await copySharedFiles([], TEST_DIR, false);
			// If we get here, the test should fail
			expect(false).toBe(true);
		} catch (error) {
			expect(error.message).toContain("Shared directory not found");
		} finally {
			// Restore original function
			existsSyncSpy.mockRestore();
		}
	});

	test("handles fs errors gracefully when copying files", async () => {
		// Mock fs.writeFileSync to simulate write error
		const writeFileSpy = spyOn(fs, "writeFileSync").mockImplementation(() => {
			throw new Error("Simulated write error");
		});

		try {
			// Should not throw despite the write error
			const result = await copySharedFiles([".prettierrc"], TEST_DIR, false);
			expect(result.length).toBe(0);
			expect(console.error).toHaveBeenCalled();
		} finally {
			// Restore original function
			writeFileSpy.mockRestore();
		}
	});

	test("handles file read errors gracefully", async () => {
		// Instead of testing mkdir errors, test readFileSync errors
		// which better isolates the test
		const readFileSpy = spyOn(fs, "readFileSync").mockImplementation(() => {
			throw new Error("Simulated read error");
		});

		try {
			// Should not throw despite the read error
			const result = await copySharedFiles([".prettierrc"], TEST_DIR, false);
			expect(result.length).toBe(0);
			expect(console.error).toHaveBeenCalled();
		} finally {
			// Restore original function
			readFileSpy.mockRestore();
		}
	});

	test("skips non-existent files when specific files are requested", async () => {
		// Test with a mix of existing and non-existing files
		const result = await copySharedFiles(
			[".prettierrc", "non-existent-file.txt"],
			TEST_DIR,
			false
		);

		// Should copy the existing file but skip the non-existent one
		expect(result.length).toBe(1);
		expect(fs.existsSync(path.join(TEST_DIR, ".prettierrc"))).toBeTrue();
		expect(console.warn).toHaveBeenCalled();
	});
});
