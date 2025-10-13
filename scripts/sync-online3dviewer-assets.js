const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(rootDir, 'public', '3dviewer');

const assetEntries = [
  {
    module: 'occt-import-js',
    source: ['dist', 'occt-import-js-worker.js'],
    target: 'occt-import-js-worker.js'
  },
  {
    module: 'occt-import-js',
    source: ['dist', 'occt-import-js.js'],
    target: 'occt-import-js.js'
  },
  {
    module: 'occt-import-js',
    source: ['dist', 'occt-import-js.wasm'],
    target: 'occt-import-js.wasm'
  },
  {
    module: 'rhino3dm',
    source: ['rhino3dm.min.js'],
    target: 'rhino3dm.min.js'
  },
  {
    module: 'rhino3dm',
    source: ['rhino3dm.wasm'],
    target: 'rhino3dm.wasm'
  },
  {
    module: 'web-ifc',
    source: ['web-ifc-api-iife.js'],
    target: 'web-ifc-api-iife.js'
  },
  {
    module: 'web-ifc',
    source: ['web-ifc.wasm'],
    target: 'web-ifc.wasm'
  },
  {
    module: 'web-ifc',
    source: ['web-ifc-mt.wasm'],
    target: 'web-ifc-mt.wasm'
  },
  {
    module: 'web-ifc',
    source: ['web-ifc-mt.worker.js'],
    target: 'web-ifc-mt.worker.js'
  },
  {
    module: 'draco3d',
    source: ['draco_decoder_nodejs.js'],
    target: 'draco_decoder_nodejs.min.js'
  },
  {
    module: 'draco3d',
    source: ['draco_decoder.wasm'],
    target: 'draco_decoder.wasm'
  }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveModulePath(entry) {
  return path.join(rootDir, 'node_modules', entry.module, ...entry.source);
}

function copyAsset(entry) {
  const srcPath = resolveModulePath(entry);
  const destPath = path.join(targetDir, entry.target);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[sync:3dviewer] 跳过缺失文件: ${srcPath}`);
    return false;
  }
  fs.copyFileSync(srcPath, destPath);
  return true;
}

function copyEnvMaps() {
  const source = path.join(rootDir, 'node_modules', 'online-3d-viewer', 'website', 'assets', 'envmaps');
  const dest = path.join(targetDir, 'envmaps');
  if (!fs.existsSync(source)) {
    console.warn('[sync:3dviewer] 未找到 envmaps 资源目录');
    return;
  }
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDirectory(source, dest);
}

function copyDirectory(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanTarget() {
  if (!fs.existsSync(targetDir)) return;
  for (const entry of fs.readdirSync(targetDir)) {
    const entryPath = path.join(targetDir, entry);
    fs.rmSync(entryPath, { recursive: true, force: true });
  }
}

function main() {
  ensureDir(targetDir);
  cleanTarget();

  let copiedCount = 0;
  for (const entry of assetEntries) {
    if (copyAsset(entry)) copiedCount += 1;
  }

  copyEnvMaps();

  console.log(`[sync:3dviewer] 已同步 ${copiedCount} 个核心资源至 public/3dviewer`);
}

main();
