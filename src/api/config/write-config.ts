import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fs from 'fs';
import YAML from 'yaml';
import fsExtra from 'fs-extra';

const schema = {
  type: 'object',
  properties: {
    pluginName: { type: 'string' },
    subConfigName: { type: 'string' },
    config: { type: 'object' }
  },
  required: [ 'pluginName', 'config' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

// First read, then write.
// If write first, server will return a 502.
const writeConfigAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    fsExtra.ensureDirSync(path.resolve(pluginsRoot, params.pluginName));
    const configFilePath = path.resolve(pluginsRoot, params.pluginName, `${params.subConfigName || 'config'}.yaml`);
    if (!configFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    fs.writeFileSync(configFilePath, YAML.stringify(params.config));
    return {};
  }
};

export default writeConfigAction;