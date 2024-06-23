import express from 'express';
import { spawn } from 'node:child_process';
import fs from 'fs';
import * as path from 'node:path';

// Initialization begin

export const pluginsRoot = path.resolve(__dirname, 'plugins');
if (!fs.existsSync(pluginsRoot)) {
  fs.mkdirSync(pluginsRoot);
}

// Initialization end

const app = express();
app.use(express.json());

import fileApiRouter from '@/api/file';
import configRouter from '@/api/config';

app.use('/file', fileApiRouter);
app.use('/config', configRouter);

const STDHUB_PORT = 29202;

app.listen(STDHUB_PORT, () => {
  // console.log('Server started on *:29202');
  console.log('Starting BDS process...');
  console.log();

  const bdsProcess = spawn(
    './bedrock_server', // indicates that the executable should be at the same path with BDS binary
    { stdio: 'inherit' }
  );

  bdsProcess.on('close', (code) => {
    console.log('\x1b[0m');
    console.log('BDS process exited with code', code ?? 0);
    process.exit(code);
  });
});