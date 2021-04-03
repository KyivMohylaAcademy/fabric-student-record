import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import {Gateway, InMemoryWallet, X509WalletMixin} from 'fabric-network'
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {NotEmpty} from "../validators/index"

const router = express.Router();

const personRegistration = async (req, res, person) => {
    try {
        const {login, password} = req.body
        NotEmpty(login, "Login")
        NotEmpty(password, "Password")
        const ca = new FabricCAServices("http://0.0.0.0:7054");
        const adminData = await ca.enroll({enrollmentID: "admin", enrollmentSecret: "password"});
        const identity = {
            label: 'client',
            certificate: adminData.certificate,
            privateKey: adminData.key.toBytes(),
            mspId: 'NAUKMA',
        };
        const wallet = new InMemoryWallet();
        const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
        await wallet.import(identity.label, mixin);
        const gateway = new Gateway();
        const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'));
        const connectionOptions = {
            identity: identity.label,
            wallet: wallet,
            discovery: {enabled: false, asLocalhost: true},
        }
        await gateway.connect(connectionProfile, connectionOptions);
        const admin = gateway.getCurrentIdentity();
        await ca.register({
            enrollmentID: login,
            enrollmentSecret: password,
            role: 'peer',
            affiliation: person,
            maxEnrollments: -1,
        }, admin);
        const userData = await ca.enroll({enrollmentID: login, enrollmentSecret: password});
        gateway.disconnect();
        res.status(201).json(
            {
                login: login,
                certificate: userData.certificate,
                privatekey: userData.key.toBytes()
            }
        )
    } catch (err) {
        if (typeof err === "string")
            res.status(400).json(
                {
                    "message": err
                }
            )
        else {
            console.error(err)
            res.status(400).json(
                {
                    "message": "Server error",
                    "error": err
                }
            )
        }


    }
    // const caTLSCACerts = caInfo.tlsCACerts.pem;
};
const teacherRegistration = async (req, res) => {
    return personRegistration(req, res, "naukma.teacher")
}
const studentRegistration = async (req, res) => {
    return personRegistration(req, res, "naukma.student")
}


router.post('/teacher', teacherRegistration);
router.post('/student', studentRegistration);

// router.get('/student', (res, req) => console.log("bkakbak"));

export default router;
