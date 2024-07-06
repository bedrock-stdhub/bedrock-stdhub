import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { getXuidByName } from '@/service/xuid';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  required: [ 'name' ]
} as const satisfies JSONSchema;

const getXuidByNameAction = {
  schema,
  handler: (params: FromSchema<typeof schema>) => {
    // return 404 if the name is not found
    const xuid = getXuidByName(params.name);
    if (!xuid) {
      return { status: 404 };
    } else {
      return { data: { xuid } };
    }
  }
};

export default getXuidByNameAction;