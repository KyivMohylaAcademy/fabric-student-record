import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import {Gateway, InMemoryWallet, X509WalletMixin} from 'fabric-network';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();

function isEmpty(value){
    if(value.ledger_height === 0) {
        return true;
    }
}

const userRegistration = async (req, res, userEnrollmentData) => {

    const {login, password} = req.body;

    const wallet = new InMemoryWallet();

    const gateway = new Gateway();

    if(!login || isEmpty(login)){
        res.status(400).json({
            message: "login can`t be empty",
            statusCode: 400
        })
    }

    if(!password || isEmpty(password)){
        res.status(400).json({
            message: "password can`t be empty",
            statusCode: 400
        })
    }

    const ca = new FabricCAServices('http://0.0.0.0:7054');

    const adminData = await ca.enroll(
        {
            enrollmentID: 'admin',
            enrollmentSecret: 'password'
        });

    const identity = {
        label: 'client',
        certificate: adminData.certificate,
        privateKey: adminData.key.toBytes(),
        mspId: 'NAUKMA'
    }

    try{
        const mixin = X509WalletMixin.createIdentity(
            identity.mspId,
            identity.certificate,
            identity.privateKey
        );

        await wallet.import(identity.label, mixin);
    }
    catch (err){
        res.status(400).json({
            errorMessage: 'Error while creating identity',
            statusCode: 400,
            innerError: err.message
        })
    }

    try{
        const connProfile = yaml.safeLoad(fs.readFileSync(
            path.resolve(__dirname, '../gateway/networkConnection.yaml'),
            'utf8')
        );

        const connOptions = {
            identity: identity.label,
            wallet: wallet,
            discovery: {
                enable: false,
                asLocalhost: true
            }
        }

        await gateway.connect(connProfile, connOptions);
    }
    catch (err) {
        res.status(400).json({
            errorMessage: 'Error while connecting gateway',
            statusCode: 400,
            innerError: err.message
        })
    }

    const admin = await gateway.getCurrentIdentity();

    try{
        await ca.register(
            {
                enrollmentID: login,
                enrollmentSecret: password,
                role: 'peer',
                affiliation: userEnrollmentData,
                maxEnrollments: -1
            },
            admin
        );
    }
    catch (err){
        res.status(400).json({
            errorMessage: 'Error while register user',
            statusCode: 400,
            innerError: err.message
        })
    }

    const userData = await ca.enroll(
      {
            enrollmentID: login,
            enrollmentSecret: password
      });

    gateway.disconnect();

    res.status(201).json(
          {
            certificate: userData.certificate
          }
    );
};

router.post('/teacher', function teacherRegistration(req, res){
    return userRegistration(req, res, "naukma.teacher")
});

router.post('/student', function studentRegistration(req, res){
    return userRegistration(req, res, "naukma.student")
});

export default router;
