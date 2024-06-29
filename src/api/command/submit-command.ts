import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/utils/action';
import { resolveCommand } from '@/command';
import { triggerScriptEvent } from '@/terminal';
import { CommandDispatchEvent } from '@/event/command/CommandDispatchEvent';

const schema = {
  type: 'object',
  properties: {
    playerId: { type: 'string' },
    commandString: { type: 'string' },
  },
  required: [ 'playerId', 'commandString' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const submitCommandAction: Action = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const resolved = resolveCommand(params.commandString);
    if (!resolved) {
      return { status: 404 };
    } else {
      triggerScriptEvent(resolved.namespace, new CommandDispatchEvent(
        params.playerId,
        resolved.resolvedText
      ));
      return {};
    }
  }
};

export default submitCommandAction;