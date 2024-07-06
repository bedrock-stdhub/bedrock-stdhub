import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Action } from '@/api/Action';
import { getNameByXuid } from '@/service/xuid';

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

export default getNameByXuidAction;