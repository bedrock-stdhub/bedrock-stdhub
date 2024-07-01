import esbuild from 'esbuild';
import pkg from 'pkg';
import path from 'node:path';

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

const task = process.argv[2];
switch (task) {
  case 'build:js': {
    bundleJs();
    break;
  }
  case 'build': {
    bundleJs()
      .then(() => toSingleExecutable());
    break;
  }
  default: {
    console.log('Unknown task.');
    process.exit(1);
  }
}