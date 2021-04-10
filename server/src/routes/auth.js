import express from 'express';
import { X509WalletMixin } from 'fabric-network';
import { getCA, getConnectedWallet, registerUser } from '../utils';

const router = express.Router();

const studentRegistration = async (req, res) => {
  const { login, password } = req.body;
  try {
    const ca = getCA();
    const adminData = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'password' });
    const mixin = X509WalletMixin.createIdentity(
      'Org1MSP',
      adminData.certificate,
      adminData.key.toBytes()
    );
    const gateway = await getConnectedWallet('Org1MSP', mixin);
    const admin = await gateway.getCurrentIdentity()
    await registerUser(ca, admin, { login, password, affiliation: 'teacher' });

    const userData = await ca.enroll({
      enrollmentID: login,
      enrollmentSecret: password,
    });
    gateway.disconnect();
    res.status(201).json({
      login,
      certificate: userData.certificate,
      privateKey: userData.key.toBytes(),
    });
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }

const teacherRegistration = async (req, res) => {
  const {login, password} = req.body;

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

  try{
    await wallet.import(identity.label, mixin);
  }
  catch(err){
    res.status(400).json({ message: 'Error while importing wallet', error: err.message });
  }

  const gateway = new Gateway();
  const connectionProfile = yaml.safeLoad(
      fs.readFileSync(__dirname + '/../gateway/networkConnection.yaml', 'utf8')
  );
  const connectionOptions = {
    identity: identity.label,
    wallet: wallet,
    discovery: {enable: false, asLocalhost: true}
  };

  try {
    await gateway.connect(connectionProfile, connectionOptions);
  } catch(connErr) {
    res.status(400).json({ message: 'Error while connecting to gateway', error: err.message });
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
  } catch (registerErr) {
    res.status(400).json({ message: 'Error when attempt to register', error: err.message });
    return;
  }


  try {
   const userData = await ca.enroll({enrollmentID: login, enrollmentSecret: password});
  } catch (enrollmentErr) {
    res.status(400).json({ message: 'Error while enrolling admin', error: err.message });
  }
  gateway.disconnect();

  res.status(201).json({
    login: login,
    certificate: userData.certificate,
    privateKey: userData.key.toBytes(),
  });

};

router.post('/teacher', teacherRegistration);

export default router;