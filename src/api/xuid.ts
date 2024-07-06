import express from 'express';
import registerAction, { Action } from '@/service/action';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { getNameByXuid, getXuidByName } from '@/service/xuid';

const router = express.Router();

const getXuidByNameSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  required: [ 'name' ]
} as const satisfies JSONSchema;

const getXuidByNameAction = {
  schema: getXuidByNameSchema,
  handler: (params: FromSchema<typeof getXuidByNameSchema>) => {
    // return 404 if the name is not found
    const xuid = getXuidByName(params.name);
    if (!xuid) {
      return { status: 404 };
    } else {
      return { data: { xuid } };
    }
  }
};

registerAction(router, '/get-xuid-by-name', getXuidByNameAction);

const schema = {
  type: 'object',
  properties: {
    xuid: { type: 'string' }
  },
  required: [ 'xuid' ]
} as const satisfies JSONSchema;

const getNameByXuidAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    const name = getNameByXuid(params.xuid);
    if (!name) {
      return { status: 404 };
    } else {
      return { data: { name } };
    }
  }
} satisfies Action;

registerAction(router, '/get-name-by-xuid', getNameByXuidAction);

export default router;