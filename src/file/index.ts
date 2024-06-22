import express from 'express';
import registerAction from '@/utils/action';
import readFileAction from './read-file';

const router = express.Router();

registerAction(router, '/read', readFileAction);

export default router;