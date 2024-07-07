import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import { cmdLineOptions } from '@/index';
import { logSelf } from '@/service/log';

export type Permission = string;

export type Group = {
  extends?: string,
  permissions: Permission[]
}

const permissionKeys = new Set<Permission>();

const groups = new Map<string, Group>();
const groupPermissionCache = new Map<string, Set<Permission>>();
const playerGroupingInfo = new Map<string, string[]>();

const permissionDataPath = 'permissions';
const playersJsonPath = path.join(permissionDataPath, 'players.json');
fsExtra.ensureDirSync(permissionDataPath);

if (!fs.existsSync(path.join(permissionDataPath, 'default.group.json'))) {
  writeGroup('default', { permissions: [] });
}

fs.readdirSync(permissionDataPath).filter(fileName => fileName.endsWith('.group.json'))
.forEach(fileName => {
  const groupName = fileName.substring(0, fileName.length - 11);
  const groupData = <Group> JSON.parse(fs.readFileSync(path.join(permissionDataPath, fileName)).toString());
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
  for (const xuid in parsedPlayersJson) {
    playerGroupingInfo.set(xuid, parsedPlayersJson[xuid]);
  }
}

function writeGroup(groupName: string, groupData: Group) {
  if (cmdLineOptions['debug-mode']) {
    return;
  }
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
    extends: extendsFrom ?? 'default',
    permissions: [],
  };
  groups.set(groupName, groupData);
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
  writeGroup(groupName, groupData);
}

export function deleteGroup(groupName: string) {
  groups.delete(groupName);
  groupPermissionCache.delete(groupName);
  playerGroupingInfo.forEach((groups, xuid) => {
    if (groups.includes(groupName)) {
      playerGroupingInfo.set(xuid, groups.filter(group => group !== groupName));
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
  recursivelyUpdateGroupPermissionCache(groupName);
  writeGroup(groupName, groupData);
}

export function revokePermissionFromGroup(groupName: string, permission: Permission) {
  const groupData = groups.get(groupName)!;
  groupData.permissions = groupData.permissions.filter(p => p !== permission);
  recursivelyUpdateGroupPermissionCache(groupName);
  writeGroup(groupName, groupData);
}

function recursivelyUpdateGroupPermissionCache(groupName: string) {
  groupPermissionCache.set(groupName, findPermissionsOfGroup(groupName));
  playerGroupingInfo.forEach((groups, xuid) => {
    if (groups.includes(groupName)) {
      playerGroupingInfo.set(xuid, groups.filter(group => group !== groupName).concat(groupName));
    }
  });
  groups.forEach((groupData, name) => {
    if (groupData.extends === groupName) {
      recursivelyUpdateGroupPermissionCache(name);
    }
  });
}

export function testPermission(xuid: string, permission: Permission) {
  const groupsOfPlayer = (playerGroupingInfo.get(xuid) ?? []).concat('default');
  return groupsOfPlayer.some(group => permissionExistsInGroup(group, permission));
}

export function getGroupsOfPlayer(xuid: string) {
  return playerGroupingInfo.get(xuid) ?? [];
}

export function getPlayersInGroup(groupName: string) {
  return Array.from(playerGroupingInfo.entries())
  .filter(([ , groups ]) => groups.includes(groupName))
  .map(([ xuid ]) => xuid);
}

export function playerExistsInGroup(xuid: string, groupName: string) {
  return playerGroupingInfo.get(xuid)?.includes(groupName) ?? false;
}

export function addPlayerToGroup(xuid: string, groupName: string) {
  const groupsOfPlayer = (playerGroupingInfo.get(xuid) ?? []).concat('default');
  if (!groupsOfPlayer.includes(groupName)) {
    playerGroupingInfo.set(xuid, groupsOfPlayer.concat(groupName));
    writePlayerGroupingInfo();
  }
}

export function removePlayerFromGroup(xuid: string, groupName: string) {
  const groupsOfPlayer = (playerGroupingInfo.get(xuid) ?? []).concat('default');
  playerGroupingInfo.set(xuid, groupsOfPlayer.filter(group => group !== groupName));
  writePlayerGroupingInfo();
}

export function $clearPermissionSettings() {
  if (!cmdLineOptions['debug-mode']) {
    throw 'Illegal operation';
  }
  groups.clear();
  groupPermissionCache.clear();
  playerGroupingInfo.clear();
  groups.set('default', { permissions: [] });
  groupPermissionCache.set('default', findPermissionsOfGroup('default'));
  logSelf('Permission settings cleared.');
}