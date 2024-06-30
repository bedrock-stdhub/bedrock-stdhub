import express from 'express';
import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import fileApiRouter from '@/api/file';
import configRouter from '@/api/config';
import dataRouter from '@/api/data';
import commandRouter from '@/api/command';
import logRouter from '@/api/log';
import PropertiesReader from 'properties-reader';
import JSZip from 'jszip';
import commandLineArgs from 'command-line-args';
import portFinder from 'portfinder';
import { $initialize } from '@/terminal';

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

const options = commandLineArgs([
  { name: 'debug-mode', type: Boolean }
]);

if (options['debug-mode']) {
  console.log('====== ATTENTION ======');
  console.log('The application is running under DEBUG MODE.');
  console.log('It will listen to every existent file in `plugins` folder.');
  console.log('When any file changes, it will copy new plugin files to the world folder and delete the old.');
  console.log('However, it won\'t listen to newly added files, nor will it copy it to the world folder.');
  console.log('So if you want to have a test on new plugins, please restart the application.');
  console.log();
}

// Initialization begin
export const pluginsRoot = path.resolve('plugins');
fsExtra.ensureDirSync(pluginsRoot);

const permissionsJsonPath = path.join('config', 'default', 'permissions.json');
const permissionsJson = JSON.parse(
  fs.readFileSync(permissionsJsonPath).toString()
) as { allowed_modules: string[] };
if (!permissionsJson.allowed_modules.includes('@minecraft/server-net')) {
  permissionsJson.allowed_modules.push('@minecraft/server-net');
  fs.copyFileSync(permissionsJsonPath, `${permissionsJsonPath}.bak`);
  fs.writeFileSync(permissionsJsonPath, JSON.stringify(permissionsJson, null, 2));
  console.log(`Successfully patched \`${permissionsJsonPath}\`.`);
}

const serverProperties = PropertiesReader('server.properties');
const levelRoot = path.join('worlds', serverProperties.get('level-name')!.toString());

/*
  const levelDatPath = path.join(levelRoot, 'level.dat');
  fs.copyFileSync(levelDatPath, `${levelDatPath}_old`);
  const { parsed: levelDat, type: levelDatType } = await nbt.parse(fs.readFileSync(levelDatPath));
  console.log(1, levelDat.value['experiments']);
  levelDat.value['experiments'] = nbt.comp({
    experiments_ever_used: nbt.byte(1),
    gametest: nbt.byte(1),
    saved_with_toggled_experiments: nbt.byte(1),
  });
  console.log(2, levelDat.value['experiments']);
  fs.writeFileSync(levelDatPath, nbt.writeUncompressed(levelDat, levelDatType));
  console.log(3, (await nbt.parse(fs.readFileSync(levelDatPath))).parsed.value['experiments']);
  console.log('Successfully patched `level.dat`.');
 */
// A weird issue: `level.dat` is patched through this segment of code.
// However, when the BDS instance launches, the newly patched `level.dat` just returns to what it had been like.
// This issue only happens when I patch this file with such code.
// When I manually enable experimental APIs in Minecraft client, it just works.

// Initialization end

// Plugin loading start
async function extractMCAddon(pluginName: string, addon: JSZip) {
  const behaviorPack = await JSZip.loadAsync(addon.file(`${pluginName}_bp.mcpack`)!.async('nodebuffer'));
  const resourcePack = await JSZip.loadAsync(addon.file(`${pluginName}_rp.mcpack`)!.async('nodebuffer'));

  const bpRoot = path.join(levelRoot, 'behavior_packs', pluginName);
  const rpRoot = path.join(levelRoot, 'resource_packs', pluginName);
  await extractAll(behaviorPack, bpRoot);
  await extractAll(resourcePack, rpRoot);
}

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
  await extractMCAddon(pluginName, addon);
  const bpManifest = JSON.parse(fs.readFileSync(
    path.join(levelRoot, 'behavior_packs', pluginName, 'manifest.json')).toString());
  const rpManifest = JSON.parse(fs.readFileSync(
    path.join(levelRoot, 'behavior_packs', pluginName, 'manifest.json')).toString());
  worldBehaviorPacks.push({ pack_id: bpManifest.header.uuid, version: bpManifest.header.version });
  worldResourcePacks.push({ pack_id: rpManifest.header.uuid, version: rpManifest.header.version });

  if (options['debug-mode']) {
    fs.watchFile(path.join(pluginsRoot, pluginFileName), async () => {
      const addon = await JSZip.loadAsync(fs.readFileSync(path.join(pluginsRoot, pluginFileName)));
      await extractMCAddon(pluginName, addon);
      console.log(`Plugin ${pluginFileName} changed. Please execute \`/reload\` to see changes.`);
    });
  }

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
console.log(`Successfully created \`${levelRoot}${path.sep}world_*_json\`s.`);
// Plugin loading end

const app = express();
app.use(express.json());
app.use('/file', fileApiRouter);
app.use('/config', configRouter);
app.use('/data', dataRouter);
app.use('/command', commandRouter);
app.use('/log', logRouter);

portFinder.getPort((err, port) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  fs.writeFileSync(path.join('config', 'default', 'variables.json'), JSON.stringify({
    backendAddress: `http://localhost:${port}`
  }));

  app.listen(port, () => {
    console.log(`Backend server started on *:${port}`);
    console.log('Starting BDS process...');
    console.log();

    const bdsProcess = $initialize(bdsCommand);
    bdsProcess.on('close', (code) => {
      console.log('\x1b[0m');
      console.log('BDS process exited with code', code ?? 0);
      process.exit(code);
    });
  });
});