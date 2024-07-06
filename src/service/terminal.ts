import { ChildProcessWithoutNullStreams } from 'child_process';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { ScriptEvent } from '@/event/ScriptEvent';
import readConfigAction from '@/api/config/read-config';
import { $clearRegistry, processConsoleCommand } from '@/service/command';
import os from 'node:os';
import { $log, $logBDS } from '@/service/log';
import { handleXuidLogging } from '@/service/xuid';

let bdsProcess: ChildProcessWithoutNullStreams| null = null;

function $accessInstance() {
  if (!bdsProcess) {
    throw 'Child process not initialized';
  } else {
    return bdsProcess;
  }
}

const bdsLogRegex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}) (\w+)] (.*)$/;

export function $initialize(bdsCommand: string) {
  bdsProcess = spawn(bdsCommand, { stdio: 'pipe' });

  const customCommandPrefix = readConfigAction.handler({
    namespace: 'command-core',
    defaults: { commandPrefix: '.' }
  }).data!.commandPrefix as string;

  bdsProcess.stdout.on('data', (data) => {
    const lines = (<string>data.toString()).split(/\r*\n/); // the last element must be ''
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const matchResultOrNull = line.match(bdsLogRegex);
      if (!matchResultOrNull) {
        // log as raw
        $log('bds', line);
      } else {
        const [ , timeString, level, content ] = matchResultOrNull;
        $logBDS(timeString, level, content);

        // Check if the output satisfies any pattern
        handleXuidLogging(content);
      }
    }
  });
  /*
   * Seems that they do not use stderr for error output
    bdsProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
   */
  process.stdin.on('data', (data) => {
    if (data.toString().startsWith(customCommandPrefix)) {
      const dataString = data.toString();
      const commandString = dataString.slice(
        customCommandPrefix.length,
        dataString.length - os.EOL.length
      );
      processConsoleCommand(commandString);
      return;
    }

    if (data.toString() === `reload${os.EOL}`) {
      $clearRegistry();
    }
    $accessInstance().stdin.write(data);
  });

  return bdsProcess;
}

export function sendCommand(command: string) {
  $accessInstance().stdin.write(`${command}\r\n`); // only tested on Windows
}

export function triggerScriptEvent(namespace: string, event: ScriptEvent) {
  sendCommand(`scriptevent ${namespace}:${event.eventName} ${JSON.stringify(event)}`);
}