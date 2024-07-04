import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/api/Action';
import { registerCommand } from '@/command';

const schema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    commandName: { type: 'string' },
  },
  required: [ 'namespace', 'commandName' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const registerCommandAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const success = registerCommand(params.namespace, params.commandName);
    if (!success) {
      return { status: 400 };
    } else {
      return {};
    }
  }
} satisfies Action;

export default registerCommandAction;