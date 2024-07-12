import esbuild from 'esbuild';
import pkg from 'pkg';
import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { exec } from 'child_process';
import * as util from 'node:util';

const outputPath = 'dist';
const esbuildOutput = path.join(outputPath, 'bedrock-stdhub.js');

console.log('Cleaning up output directory...');
fs.readdirSync(outputPath).forEach(file => fs.rmSync(path.join(outputPath, file)));

// esbuild .\src\index.ts --bundle --outfile=dist\bedrock-stdhub.js --platform=node --format=cjs
async function bundleJs() {
  console.log('Bundling source code into a single JS file...');
  await esbuild.build({
    entryPoints: [ 'src/index.ts' ],
    bundle: true,
    outfile: esbuildOutput,
    platform: 'node',
    format: 'cjs',
  });
}

async function buildPlugins() {
  for (const plugin of fs.readdirSync('bundled-plugins')) {
    const pluginPath = path.join('bundled-plugins', plugin, 'build.js');
    if (fs.existsSync(pluginPath)) {
      console.log(`Building plugin ${plugin}...`);
      await (util.promisify(exec))(
        `cd bundled-plugins${path.sep}${plugin} && npm run build && cd ..${path.sep}..`
      );
    }
  }
}

async function toSingleExecutable() {
  console.log('Executing pkg...');
  await pkg.exec([
    esbuildOutput,
    '--target', 'node18-win-x64,node18-linux-x64',
    '--out-path', outputPath,
  ]);
}

async function copyBuiltJs() {
  const dest = process.env.debugCopyDest;
  if (!dest) {
    console.log('No destination is specified.');
    process.exit(1);
  }
  console.log(`Copying built JS to destination ${dest}...`);
  fs.copyFileSync(esbuildOutput, dest);
}

async function bundleToZip() {
  for (const binary of fs.readdirSync(outputPath)) {
    // skip the raw js file
    if (binary.endsWith('.js')) continue;

    const binaryName = binary.includes('.') ? binary.slice(0, binary.lastIndexOf('.')) : binary;
    const binaryPath = path.join(outputPath, binary);
    const zipPath = path.join(outputPath, `${binaryName}.zip`);
    const zipFile = new JSZip();
    console.log(`Zipping ${binary}...`);
    zipFile.file(binary, fs.readFileSync(binaryPath));
    for (const plugin of fs.readdirSync('bundled-plugins')) {
      zipFile.file(
        path.join('plugins', `${plugin}.stdplugin`),
        fs.readFileSync(path.join('bundled-plugins', plugin, 'dist', `${plugin}.stdplugin`))
      );
    }
    fs.writeFileSync(zipPath, await zipFile.generateAsync({ type: 'nodebuffer' }));
    fs.rmSync(binaryPath);
  }
}

const task = process.argv[2];
switch (task) {
  case 'build-js': {
    bundleJs();
    break;
  }
  case 'build': {
    bundleJs().then(buildPlugins).then(toSingleExecutable).then(bundleToZip);
    break;
  }
  case 'debug': {
    bundleJs().then(copyBuiltJs);
    break;
  }
  default: {
    console.log('Unknown task.');
    process.exit(1);
  }
}