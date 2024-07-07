import express from 'express';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import {
  createGroup,
  deleteGroup,
  grantPermissionToGroup,
  revokePermissionFromGroup,
  groupExists,
  permissionExistsInGroup,
  testPermission,
  addPlayerToGroup,
  removePlayerFromGroup,
  getPlayersInGroup,
  getGroupsOfPlayer,
  getGroups,
  getAllPermissionsOfGroup,
  getExplicitPermissionsOfGroup,
  playerExistsInGroup,
} from '@/service/permission';
import registerAction, { Action } from '@/service/action';

const router = express.Router();

const createGroupSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' },
    extendsFrom: { type: 'string' }
  },
  required: [ 'groupName' ]
} as const satisfies JSONSchema;

const createGroupAction = {
  schema: createGroupSchema,
  handler: (params: FromSchema<typeof createGroupSchema>) => {
    if (groupExists(params.groupName)) {
      return { status: 400 };
    }
    createGroup(params.groupName, params.extendsFrom);
    return {};
  }
} satisfies Action;

registerAction(router, '/create-group', createGroupAction);

const deleteGroupSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' }
  },
  required: [ 'groupName' ]
} as const satisfies JSONSchema;

const deleteGroupAction = {
  schema: deleteGroupSchema,
  handler: (params: FromSchema<typeof deleteGroupSchema>) => {
    if (!groupExists(params.groupName)) {
      return { status: 404 };
    }
    deleteGroup(params.groupName);
    return {};
  }
} satisfies Action;

registerAction(router, '/delete-group', deleteGroupAction);

const grantPermissionSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' },
    permission: { type: 'string' }
  },
  required: [ 'groupName', 'permission' ]
} as const satisfies JSONSchema;

const grantPermissionAction = {
  schema: grantPermissionSchema,
  handler: (params: FromSchema<typeof grantPermissionSchema>) => {
    if (!groupExists(params.groupName)) {
      return { status: 404 };
    }
    if (permissionExistsInGroup(params.groupName, params.permission)) {
      return { status: 400 };
    }
    grantPermissionToGroup(params.groupName, params.permission);
    return {};
  }
} satisfies Action;

registerAction(router, '/grant-permission', grantPermissionAction);

const revokePermissionSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' },
    permission: { type: 'string' }
  },
  required: [ 'groupName', 'permission' ]
} as const satisfies JSONSchema;

const revokePermissionAction = {
  schema: revokePermissionSchema,
  handler: (params: FromSchema<typeof revokePermissionSchema>) => {
    if (!groupExists(params.groupName) || !permissionExistsInGroup(params.groupName, params.permission)) {
      return { status: 404 };
    }
    revokePermissionFromGroup(params.groupName, params.permission);
    return {};
  }
} satisfies Action;

registerAction(router, '/revoke-permission', revokePermissionAction);

const testPermissionSchema = {
  type: 'object',
  properties: {
    xuid: { type: 'string' },
    permission: { type: 'string' }
  },
  required: [ 'xuid', 'permission' ]
} as const satisfies JSONSchema;

const testPermissionAction = {
  schema: testPermissionSchema,
  handler: (params: FromSchema<typeof testPermissionSchema>) => {
    const hasPermission = testPermission(params.xuid, params.permission);
    return { data: { hasPermission } };
  }
} satisfies Action;

registerAction(router, '/test-permission', testPermissionAction);

const addPlayerToGroupSchema = {
  type: 'object',
  properties: {
    xuid: { type: 'string' },
    groupName: { type: 'string' }
  },
  required: [ 'xuid', 'groupName' ]
} as const satisfies JSONSchema;

const addPlayerToGroupAction = {
  schema: addPlayerToGroupSchema,
  handler: (params: FromSchema<typeof addPlayerToGroupSchema>) => {
    addPlayerToGroup(params.xuid, params.groupName);
    return {};
  }
} satisfies Action;

registerAction(router, '/add-player-to-group', addPlayerToGroupAction);

const removePlayerFromGroupSchema = {
  type: 'object',
  properties: {
    xuid: { type: 'string' },
    groupName: { type: 'string' }
  },
  required: [ 'xuid', 'groupName' ]
} as const satisfies JSONSchema;

const removePlayerFromGroupAction = {
  schema: removePlayerFromGroupSchema,
  handler: (params: FromSchema<typeof removePlayerFromGroupSchema>) => {
    if (!playerExistsInGroup(params.xuid, params.groupName)) {
      return { status: 404 };
    }
    removePlayerFromGroup(params.xuid, params.groupName);
    return {};
  }
} satisfies Action;

registerAction(router, '/remove-player-from-group', removePlayerFromGroupAction);

const listGroupsOfPlayerSchema = {
  type: 'object',
  properties: {
    xuid: { type: 'string' }
  },
  required: [ 'xuid' ]
} as const satisfies JSONSchema;

const listGroupsOfPlayerAction = {
  schema: listGroupsOfPlayerSchema,
  handler: (params: FromSchema<typeof listGroupsOfPlayerSchema>) => {
    const groups = getGroupsOfPlayer(params.xuid);
    return { data: { groups } };
  }
} satisfies Action;

registerAction(router, '/list-groups-of-player', listGroupsOfPlayerAction);

const listPlayersInGroupSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' }
  },
  required: [ 'groupName' ]
} as const satisfies JSONSchema;

const listPlayersInGroupAction = {
  schema: listPlayersInGroupSchema,
  handler: (params: FromSchema<typeof listPlayersInGroupSchema>) => {
    if (!groupExists(params.groupName)) {
      return { status: 404 };
    }
    const players = getPlayersInGroup(params.groupName);
    return { data: { players } };
  }
} satisfies Action;

registerAction(router, '/list-players-in-group', listPlayersInGroupAction);

const listExplicitPermissionsSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' }
  },
  required: [ 'groupName' ]
} as const satisfies JSONSchema;

const listExplicitPermissionsAction = {
  schema: listExplicitPermissionsSchema,
  handler: (params: FromSchema<typeof listExplicitPermissionsSchema>) => {
    const permissions = getExplicitPermissionsOfGroup(params.groupName);
    if (!permissions) {
      return { status: 404 };
    }
    return { data: { permissions } };
  }
} satisfies Action;

registerAction(router, '/list-explicit-permissions', listExplicitPermissionsAction);

const listAllPermissionsSchema = {
  type: 'object',
  properties: {
    groupName: { type: 'string' }
  },
  required: [ 'groupName' ]
} as const satisfies JSONSchema;

const listAllPermissionsAction = {
  schema: listAllPermissionsSchema,
  handler: (params: FromSchema<typeof listAllPermissionsSchema>) => {
    const permissions = getAllPermissionsOfGroup(params.groupName);
    if (!permissions) {
      return { status: 404 };
    }
    return { data: { permissions: Array.from(permissions) } };
  }
} satisfies Action;

registerAction(router, '/list-all-permissions', listAllPermissionsAction);

const listAllGroupsAction = {
  schema: {},
  handler: () => {
    const groups = getGroups();
    return { data: { groups } };
  }
} satisfies Action;

registerAction(router, '/list-all-groups', listAllGroupsAction);

export default router;