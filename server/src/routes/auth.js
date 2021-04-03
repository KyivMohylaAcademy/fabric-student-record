import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import {Gateway, InMemoryWallet, X509WalletMixin} from 'fabric-network';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();
const teacherRegistration = async (req, res) => {
  const {login, password} = req.body;

  const ca = new FabricCAServices('http://0.0.0.0:7054');
  
  try {
    const adminData = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'password'});
    const identity = {
      label: 'client',
      certificate: adminData.certificate,
      privateKey: adminData.key.toBytes(),
      mspId: 'NAUKMA'
    };

    const wallet = new InMemoryWallet();
    const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
    
    try {
      await wallet.import(identity.label, mixin);
    }
    catch(err){
      res.status(400).json({ message: 'Error in wallet import', error: err.message });
    }

    const gateway = new Gateway();
    const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname,'../gateway/networkConnection.yaml'), 'utf8'));
    const connectionOptions = {
      identity: identity.label,
      wallet: wallet,
      discovery: {enable: false, asLocalhost: true}
    };

    try {
      await gateway.connect(connectionProfile, connectionOptions);
    }
    catch(err){
      res.status(400).json({ message: 'Error in gateway connection', error: err.message });
    }
    
    const admin = gateway.getCurrentIdentity();

    try {
      await ca.register({
        enrollmentID: login,
        enrollmentSecret: password,
        role: 'peer',
        affiliation: 'naukma.teacher',
        maxEnrollments: -1
      }, admin);
    }
    catch(err){
      res.status(400).json({ message: 'Error while register', error: err.message });
    }

    try {
      const userData = await ca.enroll({
        enrollmentID: login,
        enrollmentSecret: password
      });

      res.status(201).json(
        {
          login: login,
          certificate: userData.certificate,
          privateKey: userData.key.toBytes()
        }
      );
    }
    catch(err){
      res.status(400).json({ message: 'Error in getting userData', error: err.message });
    }

    gateway.disconnect();
  }
  catch(err){
    res.status(400).json({ message: 'Error in admin enrollment', error: err.message });
  }
};


const studentRegistration = async (req, res) => {
  const {login, password} = req.body;

  const ca = new FabricCAServices('http://0.0.0.0:7054');
  
  try {
    const adminData = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'password'});
    const identity = {
      label: 'client',
      certificate: adminData.certificate,
      privateKey: adminData.key.toBytes(),
      mspId: 'NAUKMA'
    };

    const wallet = new InMemoryWallet();
    const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
    
    try {
      await wallet.import(identity.label, mixin);
    }
    catch(err){
      res.status(400).json({ message: 'Error in wallet import', error: err.message });
    }

    const gateway = new Gateway();
    const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname,'../gateway/networkConnection.yaml'), 'utf8'));
    const connectionOptions = {
      identity: identity.label,
      wallet: wallet,
      discovery: {enable: false, asLocalhost: true}
    };

    try {
      await gateway.connect(connectionProfile, connectionOptions);
    }
    catch(err){
      res.status(400).json({ message: 'Error in gateway connection', error: err.message });
    }
    
    const admin = gateway.getCurrentIdentity();

    try {
      await ca.register({
        enrollmentID: login,
        enrollmentSecret: password,
        role: 'peer',
        affiliation: 'naukma.student',
        maxEnrollments: -1
      }, admin);
    }
    catch(err){
      res.status(400).json({ message: 'Error while register', error: err.message });
    }

    try {
      const userData = await ca.enroll({
        enrollmentID: login,
        enrollmentSecret: password
      });

      res.status(201).json(
        {
          login: login,
          certificate: userData.certificate,
          privateKey: userData.key.toBytes()
        }
      );
    }
    catch(err){
      res.status(400).json({ message: 'Error in getting userData', error: err.message });
    }

    gateway.disconnect();
  }
  catch(err){
    res.status(400).json({ message: 'Error in admin enrollment', error: err.message });
  }
};

router.post('/teacher', teacherRegistration);
router.post('/student', studentRegistration);

export default router;