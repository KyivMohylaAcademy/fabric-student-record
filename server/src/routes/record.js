import express from 'express';
import { X509WalletMixin } from 'fabric-network';
import {getCA, getConnectedWallet, registerUser, sendTransaction} from '../utils';

const router = express.Router();
const createStudentRecord = async (req, res) => {
    const {certificate, privateKey, studentEmail, studentFullName} = req.body;
    try {
      const mixin = X509WalletMixin.createIdentity(
          'Org1MSP',
          certificate,
          privateKey
      );
      const gateway = await getConnectedWallet('Org1MSP', mixin);
      const result = await sendTransaction(gateway,{
          name: 'createStudentRecord',
          props: [studentEmail, studentFullName]
      });
      gateway.disconnect();
      if (result)
        res.status(201).json({data:result});
      else
        res.status(400).json({message: "Cannot create student record with creds and email"});
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};

const getStudentData = async (req, res) => {
    const {certificate, privateKey, studentEmail} = req.body;
    try {
        const mixin = X509WalletMixin.createIdentity(
            'Org1MSP',
            certificate,
            privateKey
        );
        const gateway = await getConnectedWallet('Org1MSP', mixin);
        const result = await sendTransaction(gateway,{
            name: 'getStudentData',
            props: [studentEmail]
        });
        gateway.disconnect();
        res.status(201).json({data:result});
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};

const createSubjectGroup = async (req, res) => {
  const {certificate, privateKey, studentEmails, semester, subjectName} = req.body;
  if (!studentEmails || !studentEmails.length || !semester || !subjectName) {
    res.status(400).json({message: "Must specify subjectName, semester and studentEmails"});
    return;
  }

  try {
    const mixin = X509WalletMixin.createIdentity(
        'Org1MSP',
        certificate,
        privateKey
    );
    const gateway = await getConnectedWallet('Org1MSP', mixin);
    const resMap = {};
    for (const email of studentEmails) {
      const result = await sendTransaction(gateway,{
        name: 'addSubjectToStudentRecord',
        props: [email, String(semester), subjectName]
      });
      resMap[email] = Boolean(result);
    }

    gateway.disconnect();
    res.status(200).json({data:resMap});
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const createSubjectMark = async (req, res) => {
  const {certificate, privateKey, studentEmail, semester, subjectName, theme, rating} = req.body;
  if (!studentEmail || !semester || !subjectName || !theme || !rating) {
    res.status(400).json({message: "Must specify studentEmail, semester, studentEmail, theme and rating"});
    return;
  }

  try {
    const mixin = X509WalletMixin.createIdentity(
        'Org1MSP',
        certificate,
        privateKey
    );
    const gateway = await getConnectedWallet('Org1MSP', mixin);
    const result = await sendTransaction(gateway,{
      name: 'putMark',
      props: [studentEmail, String(semester), subjectName, theme, rating]
    });

    gateway.disconnect();
    if (result)
      res.status(201).json({data:result});
    else
      res.status(400).json({message: "Cannot create rating"});
  }
  catch (e) {
    res.status(400).json({ message: e.message });
  }
};

router.post('/', createStudentRecord);
router.get('/', getStudentData);
router.post('/group', createSubjectGroup);
router.post('/rating', createSubjectMark);

export default router;
