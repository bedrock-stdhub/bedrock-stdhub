const commands: Set<string> = new Set();
const defaultCommandNames: Map<string, string> = new Map();

export function registerCommand(namespace: string, commandName: string): boolean {
  const cmdNameWithNs = `${namespace}:${commandName}`;
  if (commands.has(cmdNameWithNs)) {
    return false;
  }
  const presentCommandOrNull = defaultCommandNames.get(commandName);
  if (!presentCommandOrNull) {
    defaultCommandNames.set(commandName, cmdNameWithNs);
  } else {
    console.log(`Command naming conflict: '${presentCommandOrNull}' & '${cmdNameWithNs}'.`);
    console.log(`Consider removing one of the plugins, or call the latter with prefix '${namespace}:'.`);
  }
  commands.add(cmdNameWithNs);
  return true;
}

export function resolveCommand(commandString: string): { namespace: string, resolvedText: string } | null {
  const [ commandName ] = commandString.split(' ', 1);
  if (commandName.includes(':')) {
    if (!commands.has(commandName)) {
      return null;
    } else {
      const [ namespace ] = commandName.split(':');
      return {
        namespace,
        resolvedText: commandString.slice(namespace.length + 1),
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
      };
    }
  }
}