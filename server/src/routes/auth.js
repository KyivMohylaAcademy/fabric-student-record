import express from 'express';
import { studentRegistration, teacherRegistration } from "../controllers";

const router = express.Router();

router.post('/student', studentRegistration);

router.post('/teacher', teacherRegistration);

export default router;
