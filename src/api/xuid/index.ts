import express from 'express';
import registerAction from '@/api/Action';
import getXuidByNameAction from '@/api/xuid/get-xuid-by-name';
import getNameByXuidAction from '@/api/xuid/get-name-by-xuid';

const router = express.Router();

registerAction(router, '/get-xuid-by-name', getXuidByNameAction);
registerAction(router, '/get-name-by-xuid', getNameByXuidAction);

export default router;