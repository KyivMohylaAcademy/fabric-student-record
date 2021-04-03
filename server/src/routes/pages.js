import express from 'express';
import path from 'path';

let views_path = path.join(__dirname,'..','views')

const router = express.Router();
router.get('', (req,res)=>{
    res.sendFile(path.join(views_path,'index.html'));
});

router.get('/student', (req,res)=>{
    res.sendFile(path.join(views_path,'student','index.html'));
});

router.get('/teacher', (req,res)=>{
    res.sendFile(path.join(views_path,'teacher','index.html'));
});

export default router;
