import esbuild from 'esbuild';
import pkg from 'pkg';
import path from 'node:path';
import fs from 'node:fs';

const outputPath = 'dist';
const esbuildOutput = path.join(outputPath, 'bedrock-stdhub.js');

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

const task = process.argv[2];
switch (task) {
  case 'build-js': {
    bundleJs();
    break;
  }
  case 'build': {
    bundleJs().then(toSingleExecutable);
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