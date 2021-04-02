import express from 'express'
import { auth } from './routes';

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded());
app.use(express.static('public'));
app.use(express.json());

app.use('/api/v1/', auth);

const appPort = 3000;

app.listen(
    appPort,
    () => console.log(`Listening on port ${appPort}...`),
);

app.get('/v1/', (req, res) => {
    res.render('index')
});

app.get('/v1/register/student', (req, res) => {
    res.render('student-register-view')
});

app.get('/v1/register/teacher', (req, res) => {
    res.render('teacher-register-view')
});
