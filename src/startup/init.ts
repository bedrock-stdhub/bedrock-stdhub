import path from 'node:path';
import fs from 'node:fs';
import { logSelf } from '@/log';
//import nbt, { Tags, TagType } from 'prismarine-nbt';  //Deprecated
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
  //Deprecated,pack prismarine-nbt may cause unexpeted crash on Windows 10 22H2
  /*
  const levelDatPath = path.join(levelRoot, 'level.dat');
  const levelDatBackupPath = path.join(levelRoot, 'level.dat.bak');
  const { parsed: levelDat, type: levelDatType } = await nbt.parse(fs.readFileSync(levelDatPath));
  const experimentDataNode = <Tags[TagType.Compound]> levelDat.value['experiments'];
  if (experimentDataNode.value['gametest']?.value !== 1) {
    experimentDataNode.value['experiments_ever_used'] = nbt.byte(1);
    experimentDataNode.value['gametest'] = nbt.byte(1);
    experimentDataNode.value['saved_with_toggled_experiments'] = nbt.byte(1);
    const patchedLevelDatBody = nbt.writeUncompressed(levelDat, levelDatType);
    //const patchedLevelDatBytes = Buffer.concat([
    //  Buffer.from([ 0x08, 0x00, 0x00, 0x00, 0x2A, 0x0B, 0x00, 0x00 ]),
    //  patchedLevelDatBody
    //]);
    const patchedLevelDatBytes = patchedLevelDatBody;
    
    fs.copyFileSync(levelDatPath, levelDatBackupPath);
    fs.writeFileSync(levelDatPath, patchedLevelDatBytes);
    logSelf('§aSuccessfully patched `§elevel.dat§a`.');
  }
  */
  const levelDatPath = path.join(levelRoot, 'level.dat');
  const levelDatBackupPath = path.join(levelRoot, 'level.dat.bak');
  const patchedExpBytes = Buffer.concat([
    Buffer.from([0x65, 0x78, 0x70, 0x65, 0x72, 0x69, 0x6D, 0x65, 0x6E, 0x74, 0x73, 0x01, 0x15, 0x00]),
    Buffer.from([0x65, 0x78, 0x70, 0x65, 0x72, 0x69, 0x6D, 0x65, 0x6E, 0x74, 0x73, 0x5F, 0x65, 0x76, 0x65, 0x72]),
    Buffer.from([0x5F, 0x75, 0x73, 0x65, 0x64, 0x01, 0x01, 0x08, 0x00, 0x67, 0x61, 0x6D, 0x65, 0x74, 0x65, 0x73]),
    Buffer.from([0x74, 0x01, 0x01, 0x1E, 0x00, 0x73, 0x61, 0x76, 0x65, 0x64, 0x5F, 0x77, 0x69, 0x74, 0x68, 0x5F]),
    Buffer.from([0x74, 0x6F, 0x67, 0x67, 0x6C, 0x65, 0x64, 0x5F, 0x65, 0x78, 0x70, 0x65, 0x72, 0x69, 0x6D, 0x65]),
    Buffer.from([0x06E, 0x74, 0x73, 0x01, 0x00, 0x01, 0x0A, 0x00])
  ])
  const targetBytes = Buffer.from('experiments', 'ascii');
  const LevelDatBytes = fs.readFileSync(levelDatPath);
  const startOffset = LevelDatBytes.indexOf(targetBytes);
  const endOffset = LevelDatBytes.indexOf(Buffer.from('falldamage', 'ascii'));

  const originBytes = LevelDatBytes.slice(startOffset, endOffset);
  if (!originBytes.equals(patchedExpBytes)){
    const frontBytes = LevelDatBytes.slice(8, startOffset);
    const backBytes = LevelDatBytes.slice(endOffset);
    const patchedBodyBytes = Buffer.concat([frontBytes, patchedExpBytes, backBytes]);
    const patchedLengthBytes = new Uint8Array(4);
    new DataView(patchedLengthBytes.buffer).setUint32(0, patchedBodyBytes.length, true);
    const patchedHeaderBytes = Buffer.concat([
      Buffer.from([0x08, 0x00, 0x00, 0x00]),
      patchedLengthBytes
    ])
    const patchedLevelDatBytes = Buffer.concat([patchedHeaderBytes, patchedBodyBytes]);
    fs.copyFileSync(levelDatPath, levelDatBackupPath);
    fs.writeFileSync(levelDatPath, patchedLevelDatBytes);
    logSelf('§aSuccessfully patched `§elevel.dat§a`.');
  }
}