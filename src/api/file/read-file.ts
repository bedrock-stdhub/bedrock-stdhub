import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import fs from 'fs';
import { Action } from '@/utils/action';
import path from 'node:path';
import process from 'node:process';

const schema = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    response: { type: 'string', enum: [ 'text', 'bytes' ] }
  },
  required: [ 'path', 'response' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readFileAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const absolutePath = path.resolve(params.path);
    if (!absolutePath.startsWith(`${process.cwd()}${path.sep}`)) {
      return { status: 400 };
    }

    const buffer = fs.readFileSync(absolutePath);
    if (params.response === 'bytes') {
      return {
        data: { result: [ ...buffer ] }
      };
    } else {
      return {
        data: { result: buffer.toString('utf-8') }
      };
    }
  }
};

export default readFileAction;