import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fs from 'fs';
import fsExtra from 'fs-extra';

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
    data: { type: 'object' }
  },
  required: [ 'namespace', 'subDataPath', 'data' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const writeDataAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const dataPath = path.resolve(pluginsRoot, params.namespace, 'data');
    const dataFilePath = path.resolve(dataPath, params.subDataPath);
    fsExtra.ensureDirSync(dataPath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(params.data));
    return {};
  }
};

export default writeDataAction;