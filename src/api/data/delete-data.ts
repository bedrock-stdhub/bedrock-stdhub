import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fs from 'fs';

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
  },
  required: [ 'namespace', 'subDataPath' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

// First read, then write.
// If write first, server will return a 502.
const deleteDataAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const dataFilePath = path.resolve(pluginsRoot, params.namespace, params.subDataPath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    if (!fs.existsSync(dataFilePath)) {
      return { status: 404 };
    } else {
      fs.rmSync(dataFilePath);
      return {};
    }
  }
};

export default deleteDataAction;