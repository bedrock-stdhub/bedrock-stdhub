import { ChildProcessWithoutNullStreams } from 'child_process';
import { spawn } from 'node:child_process';
import process from 'node:process';

let bdsProcess: ChildProcessWithoutNullStreams| null = null;

export function $accessBdsProcess() {
  if (!bdsProcess) {
    throw 'Child process not initialized';
  } else {
    return bdsProcess;
  }
}

export function $initialize(bdsCommand: string) {
  bdsProcess = spawn(bdsCommand, { stdio: 'pipe' });

  bdsProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  bdsProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  process.stdin.on('data', (data) => {
    if (data.toString().startsWith('.')) {
      console.log(data.toString());
    }
    bdsProcess!.stdin.write(data);
  });

  return bdsProcess;
}