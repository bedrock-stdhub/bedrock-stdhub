import fs from 'fs';

const playerJoinInfoRegex = /^Player connected: (.+), xuid: (\d+)$/;

type XUIDMap = {
  name2xuid: { [p: string]: string | undefined },
  xuid2name: { [p: string]: string | undefined }
};

const userCacheFileName = 'userCache.json';

const xuidMap = fs.existsSync(userCacheFileName) ?
  <XUIDMap> JSON.parse(fs.readFileSync(userCacheFileName).toString()) :
  { name2xuid: {}, xuid2name: {} } satisfies XUIDMap;


export function handleXuidLogging(message: string) {
  const matchOrNull = message.match(playerJoinInfoRegex);
  if (matchOrNull) {
    const [ , playerName, xuid ] = matchOrNull;
    xuidMap.name2xuid[playerName] = xuid;
    xuidMap.xuid2name[xuid] = playerName;
    setTimeout(() => {
      fs.writeFileSync(userCacheFileName, JSON.stringify(xuidMap));
    });
  }
}

export function getXuidByName(name: string) {
  return xuidMap.name2xuid[name];
}

export function getNameByXuid(xuid: string) {
  return xuidMap.xuid2name[xuid];
}