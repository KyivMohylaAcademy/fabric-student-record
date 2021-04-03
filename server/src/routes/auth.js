import {
	Gateway,
	InMemoryWallet,
	X509WalletMixin
} from 'fabric-network';
import FabricCAService from 'fabric-ca-client';
import yaml from 'js-yaml';
import path from 'path';
import express from 'express';
import * as fs from 'fs';

const FABRIC_URL = `http://0.0.0.0:7054`;
const LOGIN = 'admin';
const PASSWORD = 'admin';

const router = express.Router();

const CAService = new FabricCAService(FABRIC_URL);

const createAdminGateway = async () => {
	const adminData = await CAService.enroll({
		enrollmentID: LOGIN,
		enrollmentSecret: PASSWORD
	});
	const admin_id = {
		label: 'client',
		certificate: adminData.certificate,
		privateKey: adminData.key.toBytes(),
		mspId: 'NAUKMA',
	};
	const wallet = new InMemoryWallet();
	const mixin = X509WalletMixin.createIdentity(admin_id.mspId, admin_id.certificate, admin_id.privateKey);
	await wallet.import(admin_id.label, mixin);
	const gateway = new Gateway();
	const connectionProfile = yaml.safeLoad(
		fs.readFileSync(path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'),
	);
	await gateway.connect(connectionProfile, {
		identity: admin_id.label,
		wallet,
		discovery: { enabled: false, asLocalhost: true },
	});
	return gateway;
}

const registrationHandler = async (res, login, password, affiliation) => {
	if (!login || !password) {
		res.status(400).send({
			error: 'Please provide login credentials;'
		})
		return
	}

	let gateway;
	try {
		gateway = await createAdminGateway();
	} catch (e) {
		res.status(400).send({
			error: 'Connection error;'
		})
		return
	}
	const admin = await gateway.getCurrentIdentity();

	const secret = await CAService.register({
		enrollmentID: login,
		enrollmentSecret: password,
		role: 'peer',
		affiliation: affiliation,
		maxEnrollments: -1,
	}, admin);

	let userData;
	try {
		userData = await CAService.enroll({
			enrollmentID: login,
			enrollmentSecret: secret,
		});
	} catch (e) {
		res.status(400).send({
			error: 'Invalid login credentials;'
		})
		gateway.disconnect();
		return
	}

	gateway.disconnect();
	res.status(201).json({
		login,
		certificate: userData.certificate,
		privateKey: userData.key.toBytes(),
	});
};

router.post('/student', (req, res) => registrationHandler(
	res,
	req.body.login,
	req.body.password,
	'naukma.student'
));

router.post('/teacher', (req, res) => registrationHandler(
	res,
	req.body.login,
	req.body.password,
	'naukma.teacher'
));

export default router;