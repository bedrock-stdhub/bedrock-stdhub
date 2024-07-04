import express from 'express';
import registerAction from '@/api/Action';
import registerCommandAction from '@/api/command/register-command';
import submitCommandAction from '@/api/command/submit-command';

const router = express.Router();

registerAction(router, '/register', registerCommandAction);
registerAction(router, '/submit', submitCommandAction);

export default router;