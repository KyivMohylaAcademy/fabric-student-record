import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import { Gateway, X509WalletMixin, InMemoryWallet } from 'fabric-network'
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();
let userDataInterim;

const registerStudent = async (req, res) => {
    return signup('student')(req, res);
};

const registerTeacher = async (req, res) => {
    return signup('teacher')(req, res);
};

const signup = (type) => {
    return async (req, res) => {
        const { login, password } = req.body;
        const fabricCAServices = new FabricCAServices('http://0.0.0.0:7054');
        let adminDataInterim;

        try {
            adminDataInterim = await fabricCAServices.enroll({
                enrollmentId: 'admin',
                enrollmentSecret: 'password'
            });
        } catch (error) {
            await res.status(404).json({
                message: error.message,
                error: "Admin registration failed",
            });
            return;
        }

        const identity = {
            label: 'client',
            certificate: adminDataInterim.certificate,
            privateKey: adminDataInterim.key.toBytes(),
            mspId: 'NAUKMA',
        };

        const inMemoryWallet = new InMemoryWallet();
        const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
        await inMemoryWallet.import(identity.label, mixin);
        const gateWay = new Gateway();
        const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'));
        const connectionOptions = {
            identity: identity.label,
            wallet: inMemoryWallet,
            discovery: { enabled: false, asLocalhost: true },
        };

        try {
            await gateWay.connect(connectionProfile, connectionOptions);
        } catch (error) {
            res.status(500).send('Connection failed: ' + error);
            return;
        }
        const admin = gateWay.getCurrentIdentity();

        try {
            await fabricCAServices.register({
                enrollmentID: login,
                enrollmentSecret: password,
                affiliation: `NAUKMA.${type}`,
                role: 'peer',
                maxEnrollments: -1,
            }, admin);
        } catch (error) {
            res.status(500).send('User registration failed: ' + error);
            return;
        }

        try {
            userDataInterim = await fabricCAServices.enroll({ enrollmentID: login, enrollmentSecret: password });
        } catch (error) {
            res.status(500).send('User registration failed: ' + error);
        }
        gateWay.disconnect();

        await res.status(201).json({
            login: login,
            certificate: userDataInterim.certificate,
            privateKey: userDataInterim.key.toBytes(),
        });
    };
};

router.post('/teacher', registerTeacher);

router.post('/student', registerStudent);

export default router;
