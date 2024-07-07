import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';

export type Permission = string;

export type Group = {
  extends?: string,
  permissions: Permission[]
}

const permissionKeys = new Set<Permission>();

const groups = new Map<string, Group>();
const groupPermissionCache = new Map<string, Set<Permission>>();
const defaultPermissions = new Set<Permission>();
const playerGroupingInfo = new Map<string, string[]>();

const permissionDataPath = 'permissions';
const playersJsonPath = path.join(permissionDataPath, 'players.json');
fsExtra.ensureDirSync(permissionDataPath);

if (!fs.existsSync('default.group.json')) {
  writeGroup('default', { permissions: [] });
}

fs.readdirSync(permissionDataPath).filter(fileName => fileName.endsWith('.group.json'))
.forEach(fileName => {
  const groupName = fileName.substring(0, fileName.length - 11);
  const groupData = <Group> JSON.parse(fs.readFileSync(path.join(permissionDataPath, fileName)).toString());
  if (groupName === 'default') {
    groupData.permissions.forEach(permission => defaultPermissions.add(permission));
  }
  groups.set(groupName, groupData);
  groupData.permissions.forEach(permission => permissionKeys.add(permission));
});

function findPermissionsOfGroup(groupName: string) {
  function find(groupName: string): Permission[] {
    const groupData = groups.get(groupName)!;
    if (!groupData.extends) return groupData.permissions;
    return groupData.permissions.concat(find(groupData.extends));
  }
  return new Set<Permission>(find(groupName));
}

groups.forEach((_, groupName) => {
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
});

if (!fs.existsSync(playersJsonPath)) {
  fs.writeFileSync(playersJsonPath, '{}');
}

{
  const parsedPlayersJson = <Record<string, string[]>>(JSON.parse(fs.readFileSync(playersJsonPath).toString()));
  for (const playerName in parsedPlayersJson) {
    playerGroupingInfo.set(playerName, parsedPlayersJson[playerName]);
  }
}

function writeGroup(groupName: string, groupData: Group) {
  fs.writeFileSync(path.join(permissionDataPath, `${groupName}.group.json`), JSON.stringify(groupData));
}

function writePlayerGroupingInfo() {
  fs.writeFileSync(playersJsonPath, JSON.stringify(Object.fromEntries(playerGroupingInfo)));
}

export function getGroups() {
  return Array.from(groups.keys());
}

export function groupExists(groupName: string) {
  return groups.has(groupName);
}

export function createGroup(groupName: string, extendsFrom?: string) {
  const groupData: Group = {
    extends: extendsFrom,
    permissions: [],
  };
  groups.set(groupName, groupData);
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
  writeGroup(groupName, groupData);
}

export function deleteGroup(groupName: string) {
  groups.delete(groupName);
  groupPermissionCache.delete(groupName);
  playerGroupingInfo.forEach((groups, playerName) => {
    if (groups.includes(groupName)) {
      playerGroupingInfo.set(playerName, groups.filter(group => group !== groupName));
    }
  });
  fs.unlinkSync(path.join(permissionDataPath, `${groupName}.group.json`));
  writePlayerGroupingInfo();
}

export function getExplicitPermissionsOfGroup(groupName: string) {
  return groups.get(groupName)?.permissions;
}

export function getAllPermissionsOfGroup(groupName: string) {
  return groupPermissionCache.get(groupName);
}

export function permissionExistsInGroup(groupName: string, permission: Permission) {
  return groupPermissionCache.get(groupName)?.has(permission) ?? false;
}

export function grantPermissionToGroup(groupName: string, permission: string) {
  const groupData = groups.get(groupName)!;
  groupData.permissions.push(permission);
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
  writeGroup(groupName, groupData);
}

export function revokePermissionFromGroup(groupName: string, permission: Permission) {
  const groupData = groups.get(groupName)!;
  groupData.permissions = groupData.permissions.filter(p => p !== permission);
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
  writeGroup(groupName, groupData);
}

export function testPermission(playerName: string, permission: Permission) {
  const groupsOfPlayer = playerGroupingInfo.get(playerName) ?? [];
  return groupsOfPlayer.some(group => permissionExistsInGroup(group, permission))
    || defaultPermissions.has(permission);
}

export function getGroupsOfPlayer(playerName: string) {
  return playerGroupingInfo.get(playerName) ?? [];
}

export function getPlayersInGroup(groupName: string) {
  return Array.from(playerGroupingInfo.entries())
  .filter(([ , groups ]) => groups.includes(groupName))
  .map(([ playerName ]) => playerName);
}

export function playerExistsInGroup(playerName: string, groupName: string) {
  return playerGroupingInfo.get(playerName)?.includes(groupName) ?? false;
}

export function addPlayerToGroup(playerName: string, groupName: string) {
  const groupsOfPlayer = playerGroupingInfo.get(playerName) ?? [];
  if (!groupsOfPlayer.includes(groupName)) {
    playerGroupingInfo.set(playerName, groupsOfPlayer.concat(groupName));
    writePlayerGroupingInfo();
  }
}

export function removePlayerFromGroup(playerName: string, groupName: string) {
  const groupsOfPlayer = playerGroupingInfo.get(playerName) ?? [];
  playerGroupingInfo.set(playerName, groupsOfPlayer.filter(group => group !== groupName));
  writePlayerGroupingInfo();
}