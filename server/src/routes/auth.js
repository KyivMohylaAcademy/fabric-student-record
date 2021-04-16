import express from 'express';
import { X509WalletMixin } from 'fabric-network';
import { getCA, getConnectedWallet, registerUser } from '../utils';

const router = express.Router();


const registrationHandler = async (login, password, affiliation) => {
  const ca = getCA();
  const adminData = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'password' });
  const mixin = X509WalletMixin.createIdentity(
    'Org1MSP',
    adminData.certificate,
    adminData.key.toBytes()
  );
  const gateway = await getConnectedWallet('Org1MSP', mixin);
  const admin = await gateway.getCurrentIdentity()
  await registerUser(ca, admin, { login, password, affiliation });

  const userData = await ca.enroll({
    enrollmentID: login,
    enrollmentSecret: password,
  });
  gateway.disconnect();
  return {
    login,
    certificate: userData.certificate,
    privateKey: userData.key.toBytes(),
  };
};


router.post('/student', async (req, res) => {
  try {
    const data = await registrationHandler(
      req.body.login,
      req.body.password,
      'student'
    );
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/teacher', async (req, res) => {
  try {
    const data = await registrationHandler(
      req.body.login,
      req.body.password,
      'teacher'
    );
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
