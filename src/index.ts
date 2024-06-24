import express from 'express';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import os from 'node:os';
import fileApiRouter from '@/api/file';
import configRouter from '@/api/config';

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
if (!fs.existsSync(pluginsRoot)) {
  fs.mkdirSync(pluginsRoot);
}

// Initialization end

const app = express();
app.use(express.json());
app.use('/file', fileApiRouter);
app.use('/config', configRouter);

const STDHUB_PORT = 29202;
app.listen(STDHUB_PORT, () => {
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