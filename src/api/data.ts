import express from 'express';
import registerAction, { Action } from '@/service/action';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import path from 'node:path';
import { pluginsRoot } from '@/index';
import fsExtra from 'fs-extra';
import fs from 'fs';

const router = express.Router();

const readDataSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
  },
  required: [ 'namespace', 'subDataPath' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const readDataAction = {
  schema: readDataSchema,
  handler: (params: FromSchema<typeof readDataSchema>) => {
    const dataRoot = path.join(pluginsRoot, params.namespace, 'data');
    fsExtra.ensureDirSync(dataRoot);

    const dataFilePath = path.resolve(dataRoot, params.subDataPath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    if (!fs.existsSync(dataFilePath)) {
      return { status: 404 };
    } else {
      return { data: JSON.parse(fs.readFileSync(dataFilePath).toString()) };
    }
  }
} satisfies Action;

registerAction(router, '/read', readDataAction);

const writeDataSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
    data: { type: 'object' }
  },
  required: [ 'namespace', 'subDataPath', 'data' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const writeDataAction = {
  schema: writeDataSchema,
  handler: (params: FromSchema<typeof writeDataSchema>) => {
    const dataFilePath = path.resolve(pluginsRoot, params.namespace, 'data', params.subDataPath);
    const dataFileDirname = path.dirname(dataFilePath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    fsExtra.ensureDirSync(dataFileDirname);
    fs.writeFileSync(dataFilePath, JSON.stringify(params.data));
    return {};
  }
} satisfies Action;

registerAction(router, '/write', writeDataAction);

const deleteDataSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string' },
    subDataPath: { type: 'string' },
  },
  required: [ 'namespace', 'subDataPath' ],
  additionalProperties: false,
} as const satisfies JSONSchema;

const deleteDataAction = {
  schema: deleteDataSchema,
  handler: (params: FromSchema<typeof deleteDataSchema>) => {
    const dataFilePath = path.resolve(pluginsRoot, params.namespace, 'data', params.subDataPath);
    if (!dataFilePath.startsWith(`${pluginsRoot}${path.sep}`)) {
      return { status: 400 };
    }

    if (!fs.existsSync(dataFilePath)) {
      return { status: 404 };
    } else {
      fs.rmSync(dataFilePath);
      return {};
    }
  }
} satisfies Action;

registerAction(router, '/delete', deleteDataAction);

export default router;