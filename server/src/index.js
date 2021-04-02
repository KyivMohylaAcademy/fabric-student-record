import express from 'express'
//import './models';
import { auth } from './routes';
const path = require('path');
const app = express();
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use('/api/v1/', auth);
app.get('/main', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});
const appPort = 3000;
app.listen(
    appPort,
    () => console.log(`Listening on port ${appPort}...`),
);
