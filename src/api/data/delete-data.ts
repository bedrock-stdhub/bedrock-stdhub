import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/api/Action';
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
const deleteDataAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const dataFilePath = path.resolve(pluginsRoot, params.namespace, 'data', params.subDataPath);
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
} satisfies Action;

export default deleteDataAction;