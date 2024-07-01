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
import commandLineArgs from 'command-line-args';
import portFinder from 'portfinder';
import { $initialize } from '@/terminal';
import loadPlugins from '@/load-plugin';

export const cmdLineOptions = commandLineArgs([
  { name: 'debug-mode', type: Boolean }
]);

export const pluginsRoot = path.resolve('plugins');

const serverProperties = PropertiesReader('server.properties');
export const levelRoot = path.join('worlds', serverProperties.get('level-name')!.toString());

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

if (cmdLineOptions['debug-mode']) {
  console.log('====== ATTENTION ======');
  console.log('The application is running under DEBUG MODE.');
  console.log('It will listen to every existent file in `plugins` folder.');
  console.log('When any file changes, it will copy new plugin files to the world folder and delete the old.');
  console.log('However, it won\'t listen to newly added files, nor will it copy it to the world folder.');
  console.log('So if you want to have a test on new plugins, please restart the application.');
  console.log();
}

// Initialization begin
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

async function main(){
  fsExtra.ensureDirSync(path.join(levelRoot, 'behavior_packs'));

  fs.readdirSync(path.join(levelRoot, 'behavior_packs'))
  .filter(folder => folder.startsWith('__stdhub_plugins'))
  .forEach(folderToDelete => fsExtra.removeSync(path.join(levelRoot, 'behavior_packs', folderToDelete)));
  console.log('Removed old plugins.');
  await loadPlugins();

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
      backendAddress: `http://localhost:${port}`,
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
}

main();