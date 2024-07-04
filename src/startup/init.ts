import path from 'node:path';
import fs from 'node:fs';
import { logSelf } from '@/log';
import nbt, { Tags, TagType } from 'prismarine-nbt';
import { levelRoot } from '@/index';

export default async function init() {

  const permissionsJsonPath = path.join('config', 'default', 'permissions.json');
  const permissionsJson = JSON.parse(
    fs.readFileSync(permissionsJsonPath).toString()
  ) as { allowed_modules: string[] };
  if (!permissionsJson.allowed_modules.includes('@minecraft/server-net')) {
    permissionsJson.allowed_modules.push('@minecraft/server-net');
    fs.copyFileSync(permissionsJsonPath, `${permissionsJsonPath}.bak`);
    fs.writeFileSync(permissionsJsonPath, JSON.stringify(permissionsJson, null, 2));
    logSelf(`§aSuccessfully patched \`§e${permissionsJsonPath}§a\`.`);
  }

  const levelDatPath = path.join(levelRoot, 'level.dat');
  const levelDatBackupPath = path.join(levelRoot, 'level.dat.bak');
  const { parsed: levelDat, type: levelDatType } = await nbt.parse(fs.readFileSync(levelDatPath));
  const experimentDataNode = <Tags[TagType.Compound]> levelDat.value['experiments'];
  if (experimentDataNode.value['gametest']?.value !== 1) {
    experimentDataNode.value['experiments_ever_used'] = nbt.byte(1);
    experimentDataNode.value['gametest'] = nbt.byte(1);
    experimentDataNode.value['saved_with_toggled_experiments'] = nbt.byte(1);
    const patchedLevelDatBody = nbt.writeUncompressed(levelDat, levelDatType);
    const patchedLevelDatBytes = Buffer.concat([
      Buffer.from([ 0x08, 0x00, 0x00, 0x00, 0x2A, 0x0B, 0x00, 0x00 ]),
      patchedLevelDatBody
    ]);
    fs.copyFileSync(levelDatPath, levelDatBackupPath);
    fs.writeFileSync(levelDatPath, patchedLevelDatBytes);
    logSelf('§aSuccessfully patched `§elevel.dat§a`.');
  }
}