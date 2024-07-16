import fs from 'node:fs';
import JSZip from 'jszip';
import path from 'node:path';
import { cmdLineOptions, levelRoot, pluginsRoot } from '@/index';
import fsExtra from 'fs-extra';
import { randomUUID } from 'node:crypto';
import { getCurrentBDSVersion, getMinecraftServerApiVersionMapping } from '@/utils/bds-version';
import { logSelf } from '@/service/log';

const entryScriptName = 'main.js';

export default async function loadPlugins() {
  const allPlugins = fs.readdirSync(pluginsRoot);

  const originalWorldBehaviorPacksFilePath = path.join(levelRoot, 'world_behavior_packs.json.original');
  const worldBehaviorPacksFilePath = path.join(levelRoot, 'world_behavior_packs.json');

  if (!fs.existsSync(originalWorldBehaviorPacksFilePath)) {
    if (!fs.existsSync(worldBehaviorPacksFilePath)) {
      fs.writeFileSync(originalWorldBehaviorPacksFilePath, '[]');
    } else {
      fs.copyFileSync(worldBehaviorPacksFilePath, originalWorldBehaviorPacksFilePath);
    }
  }

  const worldBehaviorPacks = JSON.parse(
    fs.readFileSync(originalWorldBehaviorPacksFilePath).toString()
  ) as { pack_id: string, version: number[] }[];

  const plugins = allPlugins.filter(fileName => fileName.endsWith('.stdplugin'));

  const currentBDSVersion = getCurrentBDSVersion();
  logSelf(`Your current BDS version is: ${currentBDSVersion}`);
  logSelf('If this does not match, please report an issue.');

  const currentBDSVersionArray = currentBDSVersion.split('.').map(i => parseInt(i));
  let fetched = await getMinecraftServerApiVersionMapping();
  let apiVersion = fetched.versionMapping.find(({ releaseVersion }) =>
    releaseVersion === currentBDSVersion)?.apiVersion;
  if (!apiVersion) {
    if (fetched.cacheUsed) {
      fetched = await getMinecraftServerApiVersionMapping(false);
    }
    apiVersion = fetched.versionMapping.find(({ releaseVersion }) =>
      releaseVersion === currentBDSVersion)?.apiVersion;
    if (!apiVersion) {
      logSelf('Seems that you are using a newer release of BDS, which is not listed in npm registry.');
      logSelf('Check if you are using a preview version, or wait a moment.');
      throw 'Version not supported';
    }
  }

  let loadedPluginNumber = 0;

  for (const pluginFileName of plugins) {
    try {
      const plugin = await JSZip.loadAsync(fs.readFileSync(path.join('plugins', pluginFileName)));
      const pluginMeta = JSON.parse(
        await plugin.file('plugin.json')!.async('string'),
      ) as {
        plugin: {
          name: string,
          description: string,
          version: `${number}.${number}.${number}`
        },
        targetMinecraftVersion: string
      };

      logSelf(`Loading plugin §b${pluginMeta.plugin.name}§r...`);

      const pluginVersionArray = pluginMeta.plugin.version.split('.').map(i => parseInt(i));
      const pluginUUID = randomUUID();
      const scriptModuleUUID = randomUUID();

      const targetMinecraftVersion = pluginMeta.targetMinecraftVersion;

      if (targetMinecraftVersion !== currentBDSVersion) {
        logSelf([
          `§eThe Minecraft version requirement of plugin §b${pluginMeta.plugin.name}§e (§c${targetMinecraftVersion}§e)`,
          `§edoes not match current version (§a${currentBDSVersion}§e).`,
          '§eWe will still enable this plugin.',
          '§eBut when it does not function as expected, do not report any issue.'
        ].join('\n'));
      }

      const tempPluginName = `__stdhub_plugins_${pluginUUID}`;
      const pluginRoot = path.join(levelRoot, 'behavior_packs', tempPluginName);
      const pluginScriptRoot = path.join(pluginRoot, 'scripts');
      fsExtra.ensureDirSync(pluginScriptRoot);

      fs.writeFileSync(path.join(pluginRoot, 'manifest.json'), JSON.stringify({
        'format_version': 2,
        'header': {
          'name': pluginMeta.plugin.name,
          'description': pluginMeta.plugin.description,
          'uuid': pluginUUID,
          'version': pluginVersionArray,
          'min_engine_version': currentBDSVersionArray,
        },
        'modules': [
          {
            'description': 'Script resources',
            'language': 'javascript',
            'type': 'script',
            'uuid': scriptModuleUUID,
            'version': pluginVersionArray,
            'entry': `scripts/${entryScriptName}`,
          },
        ],
        'dependencies': [
          {
            'module_name': '@minecraft/server',
            'version': apiVersion,
          },
          {
            'module_name': '@minecraft/server-net',
            'version': '1.0.0-beta',
          },
          {
            'module_name': '@minecraft/server-admin',
            'version': '1.0.0-beta',
          },
          {
            'module_name': '@minecraft/server-ui',
            'version': '1.1.0',
          },
        ],
      }));
      fs.writeFileSync(
        path.join(pluginScriptRoot, entryScriptName),
        await plugin.file('script.js')!.async('nodebuffer'),
      );
      worldBehaviorPacks.push({
        pack_id: pluginUUID, version: pluginVersionArray
      });

      if (cmdLineOptions['debug-mode']) {
        fs.watchFile(path.join(pluginsRoot, pluginFileName), async () => {
          const plugin = await JSZip.loadAsync(fs.readFileSync(path.join('plugins', pluginFileName)));
          fs.writeFileSync(
            path.join(pluginScriptRoot, entryScriptName),
            await plugin.file('script.js')!.async('nodebuffer'),
          );
          logSelf(`§ePlugin §b${pluginFileName}§e changed. Please execute \`§areload§e\` AT THE TERMINAL to see changes.`);
        });
      }

      loadedPluginNumber++;
    } catch (e) {
      console.log(`Bad plugin ${pluginFileName}:`, e);
    }
  }

  fs.writeFileSync(
    worldBehaviorPacksFilePath,
    JSON.stringify(worldBehaviorPacks)
  );

  // fs.writeFileSync(path.join(levelRoot, 'world_resource_packs.json'),JSON.stringify(worldResourcePacks));

  logSelf(`§aSuccessfully loaded §b${loadedPluginNumber}§a plugin(s).`);
}