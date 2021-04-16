import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import FabricCAServices from 'fabric-ca-client';

export default async (type, req, res) => {
  const {login, password} = req.body;
  const ca = new FabricCAServices('http://0.0.0.0:7054');
  let adminData;
  try {
    adminData = await ca.enroll({enrollmentId: 'admin', enrollmentSecret: 'password'});
  } catch (e) {
    res.status(404).json({
      message: e.message,
      error: 'Failed to enroll admin',
    });
    return;
  }
  const identity = {
    label: 'client',
    certificate: adminData.certificate,
    privateKey: adminData.key.toBytes(),
    mspId: 'NAUKMA',
  };

  const wallet = new InMemoryWallet();
  const mixin = X509WalletMixin.createIdentity(identity.mspId, identity.certificate, identity.privateKey);
  await wallet.import(identity.label, mixin);
  const gateWay = new Gateway();
  const connectionProfile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'));
  const connectionOptions = {
    identity: identity.label,
    wallet,
    discovery: {enabled: false, asLocalhost: true},
  };

  try {
    await gateWay.connect(connectionProfile, connectionOptions);
  } catch (e) {
    return res.status(500)
      .json({message: e.message});
  }
  const admin = gateWay.getCurrentIdentity();

  try {
    await ca.register({
      enrollmentID: login,
      enrollmentSecret: password,
      role: 'peer',
      affiliation: `naukma.${type}`,
      maxEnrollments: -1,
    }, admin);
  } catch (e) {
    return res.status(500)
      .json({message: e.message});
  }

  try {
    const userData = await ca.enroll({enrollmentID: login, enrollmentSecret: password});

    gateWay.disconnect();

    res.status(201).json({
      login: login,
      certificate: userData.certificate,
      privateKey: userData.key.toBytes(),
    });
  } catch (e) {
    res.status(500)
      .json({message: e.message});
  }
};
