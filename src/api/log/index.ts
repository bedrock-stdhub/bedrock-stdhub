import express from 'express';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import registerAction, { Action } from '@/utils/action';
import replaceMinecraftColors from '@/utils/replace-minecraft-colors';

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

const logAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    console.log(`[${params.namespace}] ${replaceMinecraftColors(params.content)}`);
    return {};
  }
} satisfies Action;

registerAction(router, '/', logAction);

export default router;