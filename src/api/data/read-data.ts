import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/api/Action';
import fs from 'fs';
import * as path from 'node:path';
import { pluginsRoot } from '@/index';
import fsExtra from 'fs-extra';

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
  },
  required: [ 'namespace', 'subDataPath' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readDataAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const dataRoot = path.join(pluginsRoot, params.namespace, 'data');
    fsExtra.ensureDirSync(dataRoot);

    const dataFilePath = path.resolve(dataRoot, params.subDataPath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    if (!fs.existsSync(dataFilePath)) {
      return { status: 404 };
    } else {
      return { data: JSON.parse(fs.readFileSync(dataFilePath).toString()) };
    }
  }
} satisfies Action;

export default readDataAction;