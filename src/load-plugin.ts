import fs from 'node:fs';
import JSZip from 'jszip';
import path from 'node:path';
import { cmdLineOptions, levelRoot, pluginsRoot } from '@/index';
import fsExtra from 'fs-extra';
import { randomUUID } from 'node:crypto';
import YAML from 'yaml';
import { getCurrentBDSVersion, getMinecraftServerApiVersionMapping } from '@/utils/bds-version';

/*
 * Logic of loading legacy plugins (.mcaddon)
  async function extractMCAddon(pluginName: string, addon: JSZip) {
    const behaviorPack = await JSZip.loadAsync(addon.file(`${pluginName}_bp.mcpack`)!.async('nodebuffer'));
    const resourcePack = await JSZip.loadAsync(addon.file(`${pluginName}_rp.mcpack`)!.async('nodebuffer'));

    const bpRoot = path.join(levelRoot, 'behavior_packs', pluginName);
    const rpRoot = path.join(levelRoot, 'resource_packs', pluginName);
    await extractAllFilesFromZip(behaviorPack, bpRoot);
    await extractAllFilesFromZip(resourcePack, rpRoot);
  }

  async function extractAllFilesFromZip(zip: JSZip, toPath: string) {
    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename];
      const outputPath = path.join(toPath, filename);
      if (file.dir) {
        fsExtra.ensureDirSync(outputPath);
      } else {
        const content = await file.async('nodebuffer');
        fsExtra.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, content);
      }
    }
  }
 */

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
  // const worldResourcePacks: { pack_id: string, version: number[] }[] = [];

  /*
   * Logic of loading legacy plugins (.mcaddon)
    const legacyPlugins = allPlugins.filter(fileName => fileName.endsWith('.mcaddon'));
    for (const pluginFileName of legacyPlugins) {
      const pluginName = pluginFileName.substring(0, pluginFileName.length - 8);
      const addon = await JSZip.loadAsync(fs.readFileSync(path.join(pluginsRoot, pluginFileName)));
      await extractMCAddon(pluginName, addon);
      const bpManifest = JSON.parse(fs.readFileSync(
        path.join(levelRoot, 'behavior_packs', pluginName, 'manifest.json')).toString());
      const rpManifest = JSON.parse(fs.readFileSync(
        path.join(levelRoot, 'behavior_packs', pluginName, 'manifest.json')).toString());
      worldBehaviorPacks.push({ pack_id: bpManifest.header.uuid, version: bpManifest.header.version });
      worldResourcePacks.push({ pack_id: rpManifest.header.uuid, version: rpManifest.header.version });

      if (cmdLineOptions['debug-mode']) {
        fs.watchFile(path.join(pluginsRoot, pluginFileName), async () => {
          const addon = await JSZip.loadAsync(fs.readFileSync(path.join(pluginsRoot, pluginFileName)));
          await extractMCAddon(pluginName, addon);
          console.log(`Plugin ${pluginFileName} changed. Please execute \`/reload\` to see changes.`);
        });
      }

      console.log(`Loaded legacy plugin \`${pluginFileName}\`.`);
    }
   */

  const plugins = allPlugins.filter(fileName => fileName.endsWith('.stdplugin'));

  const currentBDSVersion = getCurrentBDSVersion();
  console.log(`Your current BDS version is: ${currentBDSVersion}`);
  console.log('If this does not match, please report an issue.');

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
      console.log('Seems that you are using a newer release of BDS, which is not listed in npm registry.');
      console.log('Check if you are using a preview version, or wait a moment.');
      throw 'Version not supported';
    }
  }

  let loadedPluginNumber = 0;

  for (const pluginFileName of plugins) {
    try {
      const plugin = await JSZip.loadAsync(fs.readFileSync(path.join('plugins', pluginFileName)));
      const pluginMeta = YAML.parse(
        await plugin.file('plugin.yaml')!.async('string'),
      ) as {
        plugin: {
          name: string,
          description: string,
          version: `${number}.${number}.${number}`
        },
        targetMinecraftVersion: string
      };
      const pluginVersionArray = pluginMeta.plugin.version.split('.').map(i => parseInt(i));
      const pluginUUID = randomUUID();
      const scriptModuleUUID = randomUUID();

      const targetMinecraftVersion = pluginMeta.targetMinecraftVersion;

      if (targetMinecraftVersion !== currentBDSVersion) {
        console.log(`The Minecraft version requirement of plugin ${pluginMeta.plugin.name} (${targetMinecraftVersion}) does not match current version ${currentBDSVersion}.`);
        console.log('We will still enable this plugin. But when it does not function as expected, do not report any issue.');
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
          console.log('Triggered');
          const plugin = await JSZip.loadAsync(fs.readFileSync(path.join('plugins', pluginFileName)));
          fs.writeFileSync(
            path.join(pluginScriptRoot, entryScriptName),
            await plugin.file('script.js')!.async('nodebuffer'),
          );
          console.log(`Plugin ${pluginFileName} changed. Please execute \`reload\` AT THE TERMINAL to see changes.`);
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

  console.log(`Successfully loaded ${loadedPluginNumber} plugins.`);
}