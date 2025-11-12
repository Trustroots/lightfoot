import { mkdir, copyFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceDir = join(
  rootDir,
  'node_modules/@nostr-dev-kit/cache-sqlite-wasm/dist'
);
const destDir = join(rootDir, 'static/wasm');

async function copyWasmFiles() {
  try {
    // Create destination directory
    await mkdir(destDir, { recursive: true });

    // Copy worker.js
    const workerSource = join(sourceDir, 'worker.js');
    const workerDest = join(destDir, 'worker.js');
    await copyFile(workerSource, workerDest);
    console.log('✓ Copied worker.js');

    // Copy all .wasm files
    const files = await readdir(sourceDir);
    const wasmFiles = files.filter((file) => file.endsWith('.wasm'));

    for (const file of wasmFiles) {
      const source = join(sourceDir, file);
      const dest = join(destDir, file);
      await copyFile(source, dest);
      console.log(`✓ Copied ${file}`);
    }

    console.log('✓ All WASM files copied successfully');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(
        '✗ Error: node_modules/@nostr-dev-kit/cache-sqlite-wasm/dist not found.'
      );
      console.error('✗ Make sure to run pnpm install first.');
      process.exit(1);
    } else {
      console.error('✗ Error copying WASM files:', error);
      process.exit(1);
    }
  }
}

copyWasmFiles();
