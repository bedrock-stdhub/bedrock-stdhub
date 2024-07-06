import express from 'express';
import registerAction, { Action } from '@/service/action';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fsExtra from 'fs-extra';
import fs from 'fs';
import YAML from 'yaml';
import deepMerge from '@/utils/merge-object';

const router = express.Router();

const readConfigSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subConfigName: { type: 'string' },
    defaults: { type: 'object' }
  },
  required: [ 'namespace', 'defaults' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const readConfigAction =  {
  schema: readConfigSchema,
  handler: (params: FromSchema<typeof readConfigSchema>) => {
    const pluginRoot = path.join(pluginsRoot, params.namespace);
    fsExtra.ensureDirSync(pluginRoot);

    const configFilePath = path.resolve(pluginRoot, `${params.subConfigName || 'config'}.yaml`);
    if (!configFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(configFilePath, YAML.stringify(params.defaults));
      return { data: params.defaults };
    } else {
      const readObj = YAML.parse(fs.readFileSync(configFilePath).toString());
      return { data: deepMerge(params.defaults, readObj) };
    }
  }
} satisfies Action;

registerAction(router, '/', readConfigAction);

/*
  const schema = {
    type: 'object',
    properties: {
      namespace: { type: 'string' },
      subConfigName: { type: 'string' },
      config: { type: 'object' }
    },
    required: [ 'namespace', 'config' ],
    additionalProperties: false,
  } as const satisfies JSONSchema;

  // First read, then write.
  // If write first, server will return a 502.
  const writeConfigAction = {
    schema,
    handler: (params: FromSchema<typeof schema>) => {
      fsExtra.ensureDirSync(path.resolve(pluginsRoot, params.namespace));
      const configFilePath = path.resolve(pluginsRoot, params.namespace, `${params.subConfigName || 'config'}.yaml`);
      if (!configFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
        return { status: 400 };
      }

      fs.writeFileSync(configFilePath, YAML.stringify(params.config));
      return {};
    }
  } satisfies Action;
 */

export default router;