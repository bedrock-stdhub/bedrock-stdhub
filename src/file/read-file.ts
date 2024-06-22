import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import fs from 'fs';
import { Action } from '@/utils/action';

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
    const buffer = fs.readFileSync(params.path);
    if (params.response === 'text') {
      return {
        result: [ ...buffer ],
      };
    } else {
      return {
        result: buffer.toString('utf-8')
      };
    }
  }
};

export default readFileAction;