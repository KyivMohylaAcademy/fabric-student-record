import express from 'express';
import { X509WalletMixin, Gateway, InMemoryWallet } from 'fabric-network';

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = express.Router();

const getWallet = async (label, mixin) => {
  const wallet = new InMemoryWallet();
  await wallet.import(label, mixin);
  const gateway = new Gateway();
  const connectionProfile = yaml.safeLoad(
    fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'),
  );
  const connectionOptions = {
    identity: label,
    wallet,
    discovery: { enabled: false, asLocalhost: true },
  };
  await gateway.connect(connectionProfile, connectionOptions);
  return gateway;
}

const sendTransaction = async (gateway, transaction) => {
  try {
    const network = await gateway.getNetwork('testchannel');
    const contract = await network.getContract('recordcontract',
      'org.fabric.studentRecordsStorage');
    const issueResponse = await contract.submitTransaction(transaction.name, ...transaction.props);
    return issueResponse.toString() ? JSON.parse(issueResponse.toString()) : null;
  }
  catch (error) {
    console.log(`Error processing transaction. ${error.stack}`);
    gateway.disconnect();
    return null;
  }
}

const createStudentRecord = async (req, res) => {
  const { certificate, privateKey, stEmail, stFullName } = req.body;
  try {
    const mixin = X509WalletMixin.createIdentity(
      'NAUKMA',
      certificate,
      privateKey
    );
    const gateway = await getWallet('NAUKMA', mixin);
    const result = await sendTransaction(gateway, {
      name: 'createStudentRecord',
      props: [stEmail, stFullName]
    });
    gateway.disconnect();
    if (result)
      res.status(201).json({ data: result });
    else
      res.status(400).json({ message: "No access" });
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getStudentData = async (req, res) => {
  const { certificate, privateKey, stEmail } = req.body;
  try {
    const mixin = X509WalletMixin.createIdentity(
      'NAUKMA',
      certificate,
      privateKey
    );
    const gateway = await getWallet('NAUKMA', mixin);
    const result = await sendTransaction(gateway, {
      name: 'getStudentData',
      props: [stEmail]
    });
    gateway.disconnect();
    res.status(201).json({ data: result });
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const createSubjectGroup = async (req, res) => {
  const { certificate, privateKey, stEmails, term, subject } = req.body;
  if (!stEmails || !stEmails.length || !term || !subject) {
    res.status(400).json({ message: "Must specify subject, term and stEmails" });
    return;
  }

  try {
    const mixin = X509WalletMixin.createIdentity(
      'NAUKMA',
      certificate,
      privateKey
    );
    const gateway = await getWallet('NAUKMA', mixin);
    const resMap = {};
    for (const email of stEmails) {
      const result = await sendTransaction(gateway, {
        name: 'addSubjectToStudentRecord',
        props: [email, String(term), subject]
      });
      resMap[email] = Boolean(result);
    }

    gateway.disconnect();
    res.status(200).json({ data: 'ok' });
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const createSubjectMark = async (req, res) => {
  const { certificate, privateKey, stInfo } = req.body;
  const { stEmail, term, subject, theme, rating } = stInfo;

  if (!stEmail || !term || !subject || !theme || !rating) {
    res.status(400).json({ message: "stEmail, term, subject, theme and rating are required fields" });
    return;
  }

  try {
    const mixin = X509WalletMixin.createIdentity(
      'NAUKMA',
      certificate,
      privateKey
    );
    const gateway = await getWallet('NAUKMA', mixin);
    const result = await sendTransaction(gateway, {
      name: 'addMark',
      props: [stEmail, String(term), subject, theme, rating]
    });

    gateway.disconnect();
    if (result)
      res.status(201).json({ data: result });
    else
      res.status(400).json({ message: "Cannot create rating" });
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

router.post('/', createStudentRecord);
router.get('/', getStudentData);
router.post('/subject', createSubjectGroup);
router.put('/mark', createSubjectMark);

export default router;
