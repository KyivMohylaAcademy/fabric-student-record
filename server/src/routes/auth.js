import express from 'express';
import register from './registration';

const router = express.Router();

router.post('/student', (req, res) => {
  register('student', req, res);
});

router.post('/teacher', (req, res) => {
  register('teacher', req, res);
});

export default router;





