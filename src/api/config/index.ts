import express from 'express';
import registerAction from '@/utils/action';
import readConfigAction from './read-config';
// import writeConfigAction from './write-config';

const router = express.Router();

registerAction(router, '/', readConfigAction);
// registerAction(router, '/write', writeConfigAction);

export default router;