import fs from 'fs';
import path from 'node:path';
import fsExtra from 'fs-extra';
import axios from 'axios';
import { logSelf } from '@/log';

type Version = number[];

export function compareVersions(arg1: Version, arg2: Version) {
  for (let i = 0; i < 3; i++) {
    if (arg1[i] > arg2[i]) {
      return 1;
    }
    if (arg1[i] < arg2[i]) {
      return -1;
    }
  }
  return 0;
}

export function findMaxVersion(versions: Version[]) {
  if (versions.length === 0) {
    throw 'The array of versions is empty.';
  }

  let maxVersion = versions[0];

  for (let i = 1; i < versions.length; i++) {
    if (compareVersions(versions[i], maxVersion) === 1) {
      maxVersion = versions[i];
    }
  }

  return maxVersion;
}

const vanillaBehaviorPackExp = /^vanilla_\d+\.\d+\.\d+$/;

export function getCurrentBDSVersion() {
  return findMaxVersion(fs.readdirSync('behavior_packs')
    .filter(filename => vanillaBehaviorPackExp.test(filename))
    .map(filename => filename.slice(8).split('.').map(i => parseInt(i))))
    .join('.');
}

const versionExp = /^(\d+\.\d+\.\d+-beta\.\d+\.\d+\.\d+)-stable$/;
const reducedVersionExp = /^(\d+\.\d+\.\d+-beta)\.(\d+\.\d+\.\d+)$/;

export async function fetchVersions(packageName: string) {
  return axios.get(`https://registry.npmjs.org/${packageName}`)
  .then(resp => resp.data)
  .then(data => Object.keys(data.versions));
}

export async function getMinecraftServerApiVersionMapping(useCache: boolean = true) {
  let versionMapping;
  const cachePath = path.join('cache', 'serverApiVersions.json');
  if (!fs.existsSync(cachePath) || !useCache) {
    logSelf('§eCache disabled or not found. Fetching fresh information...');

    fsExtra.ensureFileSync(cachePath);
    const rawVersionList = await fetchVersions('@minecraft/server');
    versionMapping = rawVersionList.filter(version => versionExp.test(version))
    .map(original => {
      const reducedVersion = original.match(versionExp)![1];
      const [ , apiVersion, releaseVersion ] = reducedVersion.match(reducedVersionExp)!;
      return { apiVersion, releaseVersion };
    }).reverse();
    fs.writeFileSync(cachePath, JSON.stringify(versionMapping));
    return { versionMapping, cacheUsed: false };
  } else {
    versionMapping = JSON.parse(fs.readFileSync(cachePath).toString());
    return {
      versionMapping: versionMapping as {
        apiVersion: string,
        releaseVersion: string
      }[],
      cacheUsed: true
    };
  }
}