import express from 'express';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import fileApiRouter from '@/api/file';
import configRouter from '@/api/config';
import PropertiesReader from 'properties-reader';
import JSZip from 'jszip';

// check for platform
let bdsCommand: string = '';
switch (os.platform()) {
  case 'win32': {
    bdsCommand = '.\\bedrock_server.exe';
    break;
  }
  case 'linux': {
    bdsCommand = './bedrock_server';
    break;
  }
  default: {
    console.log(`The current platform ${os.platform()} is not supported.`);
    process.exit(1);
  }
}

// check for bedrock_server binaries
if (!fs.existsSync('bedrock_server') && !fs.existsSync('bedrock_server.exe')) {
  console.log('BDS binary file not found. Please check your installation.');
  process.exit(1);
}

// Initialization begin
export const pluginsRoot = 'plugins';
fsExtra.ensureDirSync(pluginsRoot);

const permissionsJsonPath = path.join('config', 'default', 'permissions.json');
const permissionsJson = JSON.parse(
  fs.readFileSync(permissionsJsonPath).toString()
) as { allowed_modules: string[] };
if (!permissionsJson.allowed_modules.includes('@minecraft/server-net')) {
  permissionsJson.allowed_modules.push('@minecraft/server-net');
  fs.writeFileSync(permissionsJsonPath, JSON.stringify(permissionsJson, null, 2));
  console.log(`Successfully patched ${permissionsJsonPath}`);
}
// Initialization end

// Plugin loading start
async function extractAll(zip: JSZip, toPath: string) {
  for (const filename of Object.keys(zip.files)) {
    const file = zip.files[filename];
    const outputPath = path.join(toPath, filename);
    if (file.dir) {
      fsExtra.ensureDirSync(outputPath);
    } else {
      const content = await file.async('nodebuffer');
      fsExtra.ensureDirSync(path.dirname(outputPath));
      fs.writeFileSync(outputPath, content);
    }
  }
}

const serverProperties = PropertiesReader('server.properties');
const levelRoot = path.join('worlds', serverProperties.get('level-name')!.toString());

fsExtra.removeSync(path.join(levelRoot, 'behavior_packs'));
fsExtra.removeSync(path.join(levelRoot, 'resource_packs'));
console.log('Removed old `behavior_packs` and `resource_packs`.');

fsExtra.ensureDirSync(path.join(levelRoot, 'behavior_packs'));
fsExtra.ensureDirSync(path.join(levelRoot, 'resource_packs'));

const plugins = fs.readdirSync(pluginsRoot).filter(fileName => fileName.endsWith('.mcaddon'));
const worldBehaviorPacks: { pack_id: string, version: number[] }[] = [];
const worldResourcePacks: { pack_id: string, version: number[] }[] = [];
for (const pluginFileName of plugins) {
  const pluginName = pluginFileName.substring(0, pluginFileName.length - 8);
  const addon = await JSZip.loadAsync(fs.readFileSync(path.join(pluginsRoot, pluginFileName)));
  const behaviorPack = await JSZip.loadAsync(addon.file(`${pluginName}_bp.mcpack`)!.async('nodebuffer'));
  const resourcePack = await JSZip.loadAsync(addon.file(`${pluginName}_rp.mcpack`)!.async('nodebuffer'));

  const bpRoot = path.join(levelRoot, 'behavior_packs', pluginFileName);
  const rpRoot = path.join(levelRoot, 'resource_packs', pluginFileName);
  await extractAll(behaviorPack, bpRoot);
  await extractAll(resourcePack, rpRoot);

  const bpManifest = JSON.parse(fs.readFileSync(path.join(bpRoot, 'manifest.json')).toString());
  const rpManifest = JSON.parse(fs.readFileSync(path.join(rpRoot, 'manifest.json')).toString());
  worldBehaviorPacks.push({ pack_id: bpManifest.header.uuid, version: bpManifest.header.version });
  worldResourcePacks.push({ pack_id: rpManifest.header.uuid, version: rpManifest.header.version });

  console.log(`Loaded plugin \`${pluginFileName}\`.`);
}

fs.writeFileSync(
  path.join(levelRoot, 'world_behavior_packs.json'),
  JSON.stringify(worldBehaviorPacks, null, 2)
);
fs.writeFileSync(
  path.join(levelRoot, 'world_resource_packs.json'),
  JSON.stringify(worldResourcePacks, null, 2)
);
console.log(`Successfully created \`${levelRoot}/world_*_json\`s.`);
// Plugin loading end

const app = express();
app.use(express.json());
app.use('/file', fileApiRouter);
app.use('/config', configRouter);

const stdhubServerPort = 29202;
app.listen(stdhubServerPort, () => {
  // console.log('Server started on *:29202');
  console.log('Starting BDS process...');
  console.log();

  const bdsProcess = spawn(bdsCommand, { stdio: 'inherit' });
  bdsProcess.on('close', (code) => {
    console.log('\x1b[0m');
    console.log('BDS process exited with code', code ?? 0);
    process.exit(code);
  });
});