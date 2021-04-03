import express from 'express'
// import './models';
import { auth } from './routes';

const app = express();
app.use(express.urlencoded());

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use('/api/v1/', auth);
app.get('/api/v1/', (req, res) => res.render('home'));
app.get('/api/v1/signup-teacher', (req, res) => res.render('signup-teacher'));
app.get('/api/v1/signup-student', (req, res) => res.render('signup-student'));


const appPort = 3000;
app.listen(
    appPort,
    () => console.log(`Listening on port ${appPort}...`),
);