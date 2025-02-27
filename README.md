# @kontrapunkt/shared

A collection of shared configuration files and utilities for Kontrapunkt projects. Built with pure Bun APIs for maximum performance.

## Requirements

This package requires [Bun](https://bun.sh) as a runtime.

```bash
# Install Bun if you don't have it
curl -fsSL https://bun.sh/install | bash
```

## Installation

### Bun (recommended)

```bash
bun add @kontrapunkt/shared
```

### npm

```bash
npm install @kontrapunkt/shared
```

### Deno

```ts
import { copySharedFiles } from "https://deno.land/x/kontrapunkt_shared/index.ts";
```

## Usage

### Copying configuration files

You can copy shared configuration files to your project in several ways:

#### Option 1: Using the CLI

```bash
# Copy all shared files
bunx kp-shared

# Copy specific files
bunx kp-shared .prettierrc .eslintrc
```

#### Option 2: Using the API in your scripts

```typescript
// ES Modules
import { copySharedFiles } from "@kontrapunkt/shared";

// Copy all shared files
await copySharedFiles();

// Copy specific files
await copySharedFiles([".prettierrc", ".eslintrc"]);

// Copy to a specific directory
await copySharedFiles([], "/path/to/your/project");
```

### Available configuration files

The following configuration files are available in this package:

- `.prettierrc` - Prettier configuration
- `.eslintrc` - ESLint configuration
- `.cursorrules` - Cursor editor configuration
- `tsconfig.json` - TypeScript configuration

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build
```

## Technical Details

This package is built using 100% Bun APIs:

- Uses Bun's Glob API for directory listing
- Uses Bun's file API for reading and writing files
- Optimized for performance with Bun's runtime

## Publishing

The package is automatically published to npm and Deno via GitHub Actions when a new release is created.

## License

MIT
