import express from 'express';
import registerAction, { Action } from '@/api/Action';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import path from 'node:path';
import process from 'node:process';
import fs from 'fs';

const router = express.Router();

const readFileSchema = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    response: { type: 'string', enum: [ 'text', 'bytes' ] }
  },
  required: [ 'path', 'response' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readFileAction = {
  schema: readFileSchema,
  handler: (params: FromSchema<typeof readFileSchema>) => {
    const absolutePath = path.resolve(params.path);
    if (!absolutePath.startsWith(`${process.cwd()}${path.sep}`)) {
      return { status: 400 };
    }

    const buffer = fs.readFileSync(absolutePath);
    if (params.response === 'bytes') {
      return {
        data: { result: [ ...buffer ] }
      };
    } else {
      return {
        data: { result: buffer.toString('utf-8') }
      };
    }
  }
} satisfies Action;

registerAction(router, '/read', readFileAction);

export default router;