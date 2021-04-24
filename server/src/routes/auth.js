import express from 'express';
import { Gateway, InMemoryWallet, X509WalletMixin } from 'fabric-network';
import FabricCAService from 'fabric-ca-client';

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();

const SERVICE_URL = `http://0.0.0.0:7054`;
const ca = new FabricCAService(SERVICE_URL);

const registration = async ({login, password}, user) => {
  if(!login || !password) {
    return {
      status: 401, 
      result: "Incorrect input data"
    };
  }

  try{ 
    var adminData = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'password' });
  } catch (error) {
    return {
      status: 400, 
      result: error
    };
  }

  const identity = {
    label: 'client',
    certificate: adminData.certificate,
    privateKey: adminData.key.toBytes(),
    mspId: 'NAUKMA',
  };

  const wallet = new InMemoryWallet();
  const mixin = X509WalletMixin.createIdentity(identity.mspId,
    identity.certificate,
    identity.privateKey);

  try{ 
    await wallet.import(identity.label, mixin);
  } catch (error) {
    return {
      status: 400, 
      result: error
    };
  }

  const gateway = new Gateway();
  const connectionProfile = yaml.safeLoad(
    fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'),
  );
  const connectionOptions = {
    identity: identity.label,
    wallet,
    discovery: { enabled: false, asLocalhost: true },
  };
  await gateway.connect(connectionProfile, connectionOptions);

  try{ 
    const admin = await gateway.getCurrentIdentity();
    const secret = await ca.register({
      enrollmentID: login,
      enrollmentSecret: password,
      role: 'peer',
      affiliation: `naukma.${user}`,
      maxEnrollments: -1,
    }, admin);
    var userData = await ca.enroll({
      enrollmentID: login,
      enrollmentSecret: secret,
    });
  } catch (error) {
    return {
      status: 400, 
      result: error
    };
  }

  gateway.disconnect();

  return  {
    status: 201, 
    result: {
      login,
      certificate: userData.certificate,
      privateKey: userData.key.toBytes(),
    }
  };
};

router.post('/student', async (req, res) => {
  const response = await registration(req.body, 'student');
  res.status(response.status).json(response.result);
});

router.post('/teacher', async (req, res) => {
  const response = await registration(req.body, 'teacher');
  res.status(response.status).json(response.result);
});

export default router;
