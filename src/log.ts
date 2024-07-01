const colorMap = new Map([
  [ '§0', '\x1b[30m' ], // Black
  [ '§1', '\x1b[34m' ], // Dark Blue
  [ '§2', '\x1b[32m' ], // Dark Green
  [ '§3', '\x1b[36m' ], // Dark Aqua
  [ '§4', '\x1b[31m' ], // Dark Red
  [ '§5', '\x1b[35m' ], // Dark Purple
  [ '§6', '\x1b[33m' ], // Gold
  [ '§7', '\x1b[37m' ], // Gray
  [ '§8', '\x1b[90m' ], // Dark Gray
  [ '§9', '\x1b[94m' ], // Blue
  [ '§a', '\x1b[92m' ], // Green
  [ '§b', '\x1b[96m' ], // Aqua
  [ '§c', '\x1b[91m' ], // Red
  [ '§d', '\x1b[95m' ], // Light Purple
  [ '§e', '\x1b[93m' ], // Yellow
  [ '§f', '\x1b[97m' ], // White
  [ '§r', '\x1b[0m'  ], // return plain text
]);

function formatDate(date: Date) {
  const pad = (number: number, length = 2) => number.toString().padStart(length, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // getMonth() is zero-based
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export function replaceMinecraftColors(input: string) {
  return input.replace(/§[0-9a-fr]/g, match => colorMap.get(match)!) + '\x1b[0m';
}

export default function log(namespace: string, content: string, timeString?: string) {
  if (content.includes('\n')) {
    content.split(/\r*\n/).forEach(line => $log(namespace, line, timeString));
  } else {
    $log(namespace, content, timeString);
  }
}

export function $log(namespace: string, content: string, timeString?: string) {
  console.log(`[${timeString || formatDate(new Date())}] [${namespace}] ${replaceMinecraftColors(content)}`);
}

export function logSelf(content: string) {
  log('stdhub', content);
}

export function logBDS(timeString: string, level: string, content: string) {
  log('bds', `${level}: ${content}`, timeString);
}