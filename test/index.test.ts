import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as fs from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import * as path from "node:path";
import { copySharedFiles } from "../index";

// Create a temporary directory for tests
const TEST_DIR = path.join(process.cwd(), "test/tmp");

// Mock process.cwd to return our test directory
const originalCwd = process.cwd;

// Mock console.log and console.error for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe("copySharedFiles", () => {
	beforeEach(async () => {
		// Create temporary test directory
		await mkdir(TEST_DIR, { recursive: true });

		// Mock process.cwd
		process.cwd = () => TEST_DIR;

		// Silence console output during tests
		console.log = () => {};
		console.error = () => {};
	});

	afterEach(async () => {
		// Clean up test directory
		await rm(TEST_DIR, { recursive: true, force: true });

		// Restore original functions
		process.cwd = originalCwd;
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	});

	test("copies all shared files when no files are specified", async () => {
		// Mock readline to avoid interactive prompts
		mock.module("node:readline", () => ({
			createInterface: () => ({
				question: (_, callback) => callback("y"),
				close: () => {},
			}),
		}));

		const result = await copySharedFiles([], TEST_DIR, false);

		// Check that files were copied
		expect(result.length).toBeGreaterThan(0);

		// Verify some common files exist
		expect(fs.existsSync(path.join(TEST_DIR, ".prettierrc"))).toBeTrue();
		expect(fs.existsSync(path.join(TEST_DIR, "biome.json"))).toBeTrue();
		expect(fs.existsSync(path.join(TEST_DIR, "tsconfig.json"))).toBeTrue();
	});

	test("copies only specified files", async () => {
		const result = await copySharedFiles([".prettierrc"], TEST_DIR, false);

		// Check that only the specified file was copied
		expect(result.length).toBe(1);
		expect(fs.existsSync(path.join(TEST_DIR, ".prettierrc"))).toBeTrue();
		expect(fs.existsSync(path.join(TEST_DIR, "biome.json"))).toBeFalse();
	});

	test("skips files that don't exist", async () => {
		const result = await copySharedFiles(
			["non-existent-file.txt"],
			TEST_DIR,
			false
		);

		// Check that no files were copied
		expect(result.length).toBe(0);
	});

	test("copies directories recursively", async () => {
		// Test with a directory that exists in shared, like .cursor
		const result = await copySharedFiles([".cursor"], TEST_DIR, false);

		// Check that the directory was copied
		expect(fs.existsSync(path.join(TEST_DIR, ".cursor"))).toBeTrue();
		expect(
			fs.statSync(path.join(TEST_DIR, ".cursor")).isDirectory()
		).toBeTrue();
	});

	test("respects interactive mode when set to true", async () => {
		// Mock readline for interactive mode testing
		let promptCount = 0;

		mock.module("node:readline", () => ({
			createInterface: () => ({
				question: (question, callback) => {
					promptCount++;
					// Say yes to copy, no custom path
					if (question.includes("Copy")) {
						callback("y");
					} else {
						callback("");
					}
				},
				close: () => {},
			}),
		}));

		const result = await copySharedFiles([".prettierrc"], TEST_DIR, true);

		// Verify we were prompted (2 prompts per file - copy? and destination)
		expect(promptCount).toBe(2);
		expect(result.length).toBe(1);
		expect(fs.existsSync(path.join(TEST_DIR, ".prettierrc"))).toBeTrue();
	});

	test("handles custom destination paths in interactive mode", async () => {
		const customDestDir = path.join(TEST_DIR, "custom");
		await mkdir(customDestDir, { recursive: true });

		// Mock readline to provide a custom destination
		mock.module("node:readline", () => ({
			createInterface: () => ({
				question: (question, callback) => {
					if (question.includes("Copy")) {
						callback("y");
					} else if (question.includes("Destination")) {
						callback(path.join(customDestDir, ".prettierrc"));
					}
				},
				close: () => {},
			}),
		}));

		const result = await copySharedFiles([".prettierrc"], TEST_DIR, true);

		// Verify file was copied to the custom location
		expect(fs.existsSync(path.join(customDestDir, ".prettierrc"))).toBeTrue();
	});
});
