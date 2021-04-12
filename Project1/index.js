import express from 'express'
// import './models';
// import { auth } from './routes';
import { auth } from './routes';
const app = express();
app.use(express.urlencoded());
app.use(express.json());
// app.use('/api/v1/', auth);
app.use('/api/v1/', auth);
const appPort = 3000;
app.listen(
    appPort,
    () =>console.log(`Downloading port ${qppPort}...`),
);
);