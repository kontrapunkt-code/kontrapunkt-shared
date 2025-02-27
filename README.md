# @kontrapunkt/shared

A collection of shared configuration files, directories, and utilities for Kontrapunkt projects. Built with cross-platform JavaScript APIs for maximum compatibility.

## Installation

### npm

```bash
npm install @kontrapunkt/shared
```

### Bun

```bash
bun add @kontrapunkt/shared
```

### Deno

```ts
import { copySharedFiles } from "https://deno.land/x/kontrapunkt_shared/index.ts";
```

## Usage

### Copying shared files and directories

You can copy shared configuration files and directories to your project in several ways:

#### Option 1: Using the CLI

```bash
# Copy all shared files and directories
npx kp-shared

# Copy specific files or directories
npx kp-shared .prettierrc components
```

#### Option 2: Using the API in your scripts

```typescript
// ES Modules
import { copySharedFiles } from "@kontrapunkt/shared";

// Copy all shared files and directories
await copySharedFiles();

// Copy specific files or directories
await copySharedFiles([".prettierrc", "components"]);

// Copy to a specific directory
await copySharedFiles([], "/path/to/your/project");

// Copy without interactive prompts
await copySharedFiles([], "/path/to/your/project", false);
```

### Available shared resources

The following configuration files and directories are available in this package:

- Configuration files:
  - `.prettierrc` - Prettier configuration
  - `.eslintrc` - ESLint configuration
  - `.cursorrules` - Cursor editor configuration
  - `tsconfig.json` - TypeScript configuration
  - `.nvmrc` - Node version configuration
  - `biome.json` - Biome configuration

- Directories:
  - Any directories uploaded to the `shared` folder will be copied with their entire structure

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build
```

## Technical Details

This package is built using cross-platform JavaScript APIs:

- Uses Node.js fs module for file operations
- Uses Node.js path module for path manipulations
- Compatible with Node.js, Bun, and Deno runtimes

## Publishing

The package is automatically published to npm and Deno via GitHub Actions when a new release is created.

## License

MIT
