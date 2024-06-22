import { JSONSchema } from 'json-schema-to-ts';
import { Router } from 'express';
import { Schema, Validate, validator } from '@exodus/schemasafe';
import { randomUUID } from 'node:crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Action<R = any> {
  schema: JSONSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (params: any) => R | Promise<R>
}

const validatorMap = new Map<string, Validate>();

export default function registerAction(handler: Router, route: string, action: Action) {
  const objectValidator = validator(action.schema as Schema);
  const actionUUID = randomUUID();
  validatorMap.set(actionUUID, objectValidator);

  handler.post(route, async (req, res) => {
    const body = req.body;
    const cachedValidator = validatorMap.get(actionUUID)!;
    if (!cachedValidator(body)) {
      res.status(400).end();
    } else {
      try {
        res.json(await action.handler(body));
      } catch (error) {
        res.status(502) /* .json(error) */ .end();
      }
    }
  });
}