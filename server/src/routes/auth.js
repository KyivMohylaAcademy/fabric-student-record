import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {Gateway, InMemoryWallet, X509WalletMixin} from 'fabric-network';

const router = express.Router();

const naukmaRegistration = async (req, res, userEnrollmentData) => {
  const {login, password} = req.body;

  const ca = new FabricCAServices('http://0.0.0.0:7054');
  try {
    const adminData = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'password'});

    const identity = {
      label: 'client',
      certificate: adminData.certificate,
      privateKey: adminData.key.toBytes(),
      mspId: 'NaUKMA'
    }
    const wallet = new InMemoryWallet();
    const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
    await wallet.import(identity.label, mixin);
    const gateway = new Gateway();
    const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'));
    const connectionOptions = {
      identity: identity.label,
      wallet: wallet,
      discovery: {enabled: false, asLocalhost: true}
    }
    await gateway.connect(connectionProfile, connectionOptions);
    const admin = gateway.getCurrentIdentity();

    await ca.register({
      enrollmentID: login,
      enrollmentSecret: password,
      role: 'peer',
      affiliation: userEnrollmentData,
      maxEnrollments: -1
    }, admin);


    const userData = await ca.enroll({enrollmentID: login, enrollmentSecret: password});

    gateway.disconnect();

    res.status(201).json({
      login: login,
      certificate: userData.certificate,
      privateKey: userData.key.toBytes()
    })

    console.log(userData.certificate)
    console.log(userData.key.toBytes())

  } catch(e){
    console.log("Enrollment error")
    res.status(400).json({message : "Enrollment error", error : e.message})
  }
};

router.post('/naukma', naukmaRegistration);

export default router;
