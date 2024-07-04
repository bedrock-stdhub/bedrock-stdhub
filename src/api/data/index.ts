import express from 'express';
import registerAction from '@/api/Action';
import readDataAction from './read-data';
import writeDataAction from './write-data';
import deleteDataAction from './delete-data';

const router = express.Router();

registerAction(router, '/read', readDataAction);
registerAction(router, '/write', writeDataAction);
registerAction(router, '/delete', deleteDataAction);

export default router;