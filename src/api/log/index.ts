import express from 'express';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import registerAction, { Action } from '@/utils/action';

import log from '@/log';

const router = express.Router();

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    content: { type: 'string' }
  },
  required: [ 'namespace', 'content' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const logAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    log(params.namespace, params.content);
    return {};
  }
} satisfies Action;

registerAction(router, '/', logAction);

export default router;