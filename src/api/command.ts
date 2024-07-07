import express from 'express';
import registerAction, { Action } from '@/service/action';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { registerCommand, triggerCommand } from '@/service/command';
import { logSelf } from '@/service/log';
import { getXuidByName } from '@/service/xuid';

const router = express.Router();

const registerCommandSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    commandName: { type: 'string' },
    permission: { type: 'string' }
  },
  required: [ 'namespace', 'commandName' ],
} as const satisfies JSONSchema;

const registerCommandAction = {
  schema: registerCommandSchema,
  handler: (params: FromSchema<typeof registerCommandSchema>) => {
    const success = registerCommand(params.namespace, params.commandName, params.permission);
    if (!success) {
      return { status: 400 };
    } else {
      return {};
    }
  }
} satisfies Action;

registerAction(router, '/register', registerCommandAction);

const submitCommandSchema = {
  type: 'object',
  properties: {
    playerId: { type: 'string' },
    playerName: { type: 'string' },
    commandString: { type: 'string' },
    playerIsOp: { type: 'boolean' },
  },
  required: [ 'playerId', 'playerName', 'commandString' ],
} as const satisfies JSONSchema;

const submitCommandAction = {
  schema: submitCommandSchema,
  handler: (params: FromSchema<typeof submitCommandSchema>) => {
    logSelf(`Player ${params.playerName} attempts to call plugin command ${params.commandString}`);
    const xuid = getXuidByName(params.playerName);
    return triggerCommand(params.commandString, params.playerIsOp, params.playerId, xuid);
  }
} satisfies Action;

registerAction(router, '/submit', submitCommandAction);

export default router;