# Tests for @kontrapunkt/shared

This directory contains tests for the @kontrapunkt/shared package using Bun's built-in test runner.

## Running Tests

To run all tests:

```bash
bun test
```

To run a specific test file:

```bash
bun test test/index.test.ts
```

## Test Structure

- `index.test.ts` - Tests for the main functionality of `copySharedFiles`
- `error-handling.test.ts` - Tests for error handling in `copySharedFiles`
- `cli.test.ts` - Tests for the command-line interface functionality

## Test Coverage

These tests cover:

1. Basic functionality:
   - Copying all shared files when no specific files are requested
   - Copying only specified files
   - Copying directories recursively
   - Interactive mode behavior (with mocked prompts)
   - Custom destination paths

2. Error handling:
   - Handling missing shared directory
   - Handling file system errors during file operations (read/write)
   - Skipping non-existent files

3. CLI functionality:
   - Importing and using the copySharedFiles function
   - Handling different file arguments

## Testing Approach

These tests use mocking to isolate the tests from actual file system operations where necessary:

1. All tests use a temporary directory (`test/tmp`) that is created before each test and cleaned up afterward
2. Interactive prompts are mocked to avoid hanging tests
3. File system operations are mocked where needed to simulate error conditions
4. The CLI functionality is tested by mocking the module import rather than spawning actual processes

## Adding New Tests

When adding new tests, make sure to:

1. Clean up after each test using the `afterEach` hook
2. Mock any user prompts to prevent tests from hanging
3. Consider using the temporary directory pattern (TEST_DIR) to isolate tests
4. Use proper mocking patterns to simulate edge cases and error conditions 