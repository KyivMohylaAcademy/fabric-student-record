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
    const gateway = await getConnectedWallet('client', mixin);
    const admin = await gateway.getCurrentIdentity()
    await registerUser(ca, admin, { login, password, affiliation: 'student' });

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
};
router.post('/student', studentRegistration);

export default router;
