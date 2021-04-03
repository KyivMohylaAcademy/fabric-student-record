import express from 'express';
import FabricCAServices from 'fabric-ca-client';
import {Gateway, InMemoryWallet, X509WalletMixin} from 'fabric-network';
import fs from 'fs';
import yaml from 'js-yaml';

const router = express.Router();
const user = async (req, res) => {
  const {login, password,entity} = req.body;

  const ca = new FabricCAServices('http://0.0.0.0:7054');

  let adminData;
  try {
    adminData = await ca.enroll({
      enrollmentID: process.env.ADMIN_ENROLLMENT_ID,
      enrollmentSecret: process.env.ADMIN_ENROLLMENT_SECRET
    });
  } catch(enrollmentErr) {
    console.error('Failed to enroll admin: ' + enrollmentErr);
    res.status(500).send('Failed to enroll admin: ' + enrollmentErr);
    return;
  }

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
  } catch (importErr) {
    console.error('Failed to import wallet: ' + importErr);
    res.status(500).send('Failed to import wallet: ' + importErr);
    return;
  }

  const gateway = new Gateway();
  const connectionProfile = yaml.safeLoad(
      fs.readFileSync(__dirname + '/../gateway/networkConnection.yaml', 'utf8')
  );
  const connectionOptions = {
    identity: identity.label,
    wallet: wallet,
    discovery: {
      enabled: false,
      asLocalhost: true
    },
  };

  try {
    await gateway.connect(connectionProfile, connectionOptions);
  } catch(connErr) {
    console.error('Failed to connect to gateway: ' + connErr);
    res.status(500).send('Failed to connect to gateway: ' + connErr);
    return;
  }

  const admin = gateway.getCurrentIdentity();

  try {
    await ca.register({
      enrollmentID: login,
      enrollmentSecret: password,
      role: 'peer',
      affiliation: `naukma.${entity}`,
      maxEnrollments: -1
    }, admin);
  } catch (registerErr) {
    console.error('Failed to register user: ' + registerErr);
    res.status(500).send('Failed to register user: ' + registerErr);
    return;
  }

  let userData;
  try {
    userData = await ca.enroll({enrollmentID: login, enrollmentSecret: password});
  } catch (enrollmentErr) {
    console.error('Failed to enroll user: ' + enrollmentErr);
    res.status(500).send('Failed to enroll user: ' + enrollmentErr);
  }
  gateway.disconnect();

  res.status(201).json({
    login: login,
    certificate: userData.certificate,
    privateKey: userData.key.toBytes(),
  });

};

router.post('/register', user);

export default router;