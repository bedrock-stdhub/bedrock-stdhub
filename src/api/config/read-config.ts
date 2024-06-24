import deepMerge from '@/utils/merge-object';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import fs from 'fs';
import * as path from 'node:path';
import { pluginsRoot } from '@/index';
import YAML from 'yaml';

const schema = {
  type: 'object',
  properties: {
    pluginName: { type: 'string' },
    subConfigName: { type: 'string' },
    defaults: { type: 'object' }
  },
  required: [ 'pluginName', 'defaults' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readConfigAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const pluginRoot = path.resolve(pluginsRoot, params.pluginName);
    if (!fs.existsSync(pluginRoot)) {
      fs.mkdirSync(pluginRoot);
    }

    const configFilePath = path.resolve(pluginRoot, `${params.subConfigName || 'config'}.yaml`);
    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(configFilePath, YAML.stringify(params.defaults));
      return params.defaults;
    } else {
      const readObj = YAML.parse(fs.readFileSync(configFilePath).toString());
      return deepMerge(readObj, params.defaults);
    }
  }
};

export default readConfigAction;