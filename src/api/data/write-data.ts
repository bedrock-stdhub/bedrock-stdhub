import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fs from 'fs';
import fsExtra from 'fs-extra';

const schema = {
  type: 'object',
  properties: {
    pluginName: { type: 'string' },
    subDataPath: { type: 'string' },
    data: { type: 'object' }
  },
  required: [ 'pluginName', 'subDataPath', 'data' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

// First read, then write.
// If write first, server will return a 502.
const writeDataAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const dataFilePath = path.resolve(pluginsRoot, params.pluginName, params.subDataPath);
    fsExtra.ensureDirSync(dataFilePath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(params.data));
    return {};
  }
};

export default writeDataAction;