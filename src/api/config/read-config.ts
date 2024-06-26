import deepMerge from '@/utils/merge-object';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import fs from 'fs';
import * as path from 'node:path';
import { pluginsRoot } from '@/index';
import YAML from 'yaml';
import fsExtra from 'fs-extra';

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subConfigName: { type: 'string' },
    defaults: { type: 'object' }
  },
  required: [ 'namespace', 'defaults' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readConfigAction =  {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
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

export default readConfigAction;