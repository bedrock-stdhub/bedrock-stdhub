import { logSelf } from '@/service/log';
import { triggerScriptEvent } from '@/service/terminal';
import { CommandDispatchEvent } from '@/event/CommandDispatchEvent';
import { addPermissionKey, Permission, testPermission } from '@/service/permission';
import { cmdLineOptions } from '@/index';

const commands = new Map<string, Permission>();
const defaultCommandNames = new Map<string, string>();

export function registerCommand(namespace: string, commandName: string, permission?: Permission): boolean {
  const cmdNameWithNs = `${namespace}:${commandName}`;
  const permissionWithNs = permission ? `${namespace}:${permission}` : '';
  if (commands.has(cmdNameWithNs)) {
    return false;
  }
  const presentCommandOrNull = defaultCommandNames.get(commandName);
  if (!presentCommandOrNull) {
    defaultCommandNames.set(commandName, cmdNameWithNs);
  } else {
    logSelf(`Command naming conflict: '${presentCommandOrNull}' & '${cmdNameWithNs}'.`);
    logSelf(`Consider removing one of the plugins, or call the latter with prefix '${namespace}:'.`);
  }
  commands.set(cmdNameWithNs, permissionWithNs);
  addPermissionKey(permissionWithNs);
  logSelf(`Command registered: §a${cmdNameWithNs}${
    permission ? `§r with permission §b${permissionWithNs}`: ''
  }`);
  return true;
}

export function resolveCommand(commandString: string):
  { namespace: string, resolvedText: string, permission?: Permission } | null {
  const [ commandName ] = commandString.split(' ', 1);
  if (commandName.includes(':')) {
    if (!commands.has(commandName)) {
      return null;
    } else {
      const [ namespace ] = commandName.split(':');
      return {
        namespace,
        resolvedText: commandString.slice(namespace.length + 1),
        permission: commands.get(commandName),
      };
    }
  } else {
    const defaultCommandOrNull = defaultCommandNames.get(commandName);
    if (!defaultCommandOrNull) {
      return null;
    } else {
      const [ namespace ] = defaultCommandOrNull.split(':');
      return {
        namespace,
        resolvedText: commandString,
        permission: commands.get(defaultCommandOrNull),
      };
    }
  }
}

export function triggerCommand(
  commandString: string,
  isOperator?: boolean,
  playerId?: string,
  xuid?: string,
) {
  const resolved = resolveCommand(commandString);
  if (!resolved) {
    return { status: 404 };
  } else {
    if (!isOperator && xuid && resolved.permission) {
      if (!testPermission(xuid, resolved.permission)) {
        return { status: 403 };
      }
    }
    triggerScriptEvent(resolved.namespace, new CommandDispatchEvent(
      resolved.resolvedText,
      playerId,
    ));
    return {};
  }
}

export function processConsoleCommand(commandString: string) {
  const commandName = commandString.split(' ', 1)[0];
  const triggerResult = triggerCommand(commandString, true);
  if (triggerResult.status === 404) {
    logSelf(`§cUnknown command: ${commandName}. Please check that the command exists and you have permission to use it.`);
  }
}

export function $clearRegistry() {
  if (!cmdLineOptions['debug-mode']) {
    throw 'Illegal operation';
  }
  commands.clear();
  defaultCommandNames.clear();
  logSelf('Command registry cleared.');
}