import FabricCAServices from "fabric-ca-client";
import {Gateway, InMemoryWallet, X509WalletMixin} from "fabric-network";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "express";

const teacherRegistration = async (req, res) => {
    const {login, password} = req.body;

    const ca = new FabricCAServices('http://0.0.0.0:7054');

    try {
        const adminData =
            await ca.enroll({
                enrollmentID: 'admin',
                enrollmentSecret: 'password'
            });

        const identity = {
            label: 'client',
            certificate: adminData.certificate,
            privateKey: adminData.key.toBytes(),
            mspId: 'NAUKMA'
        }

        const wallet = new InMemoryWallet();
        const mixin = X509WalletMixin
            .createIdentity(identity.mspId, identity.certificate, identity.privateKey);

        await wallet.import(identity.label, mixin);

        const gateway = new Gateway();

        const connectionProfile =
            yaml.safeLoad(
                fs.readFileSync(
                    path.resolve(__dirname, '../gateway/networkConnection.yaml'), 'utf8'));

        const connectionOptions = {
            identity: identity.label,
            wallet: wallet,
            discovery: {enable: false, asLocalhost: true}
        };

        await gateway.connect(connectionProfile, connectionOptions);

        const admin = gateway.getCurrentIdentity();

        await ca.register({
            enrollmentID: login,
            enrollmentSecret: password,
            role: 'peer',
            affiliation: 'naukma.student',
            maxEnrollments: -1
        }, admin);

        const userData = await ca.enroll({
            enrollmentID: login,
            enrollmentSecret: password
        });

        gateway.disconnect();

        res.status(201).json(
            {
                login: login,
                certificate: userData.certificate,
                privateKey: userData.key.toBytes()
            }
        );

    } catch (err) {
        res.status(400)
            .json({
                msg: 'An error occurred during teacher registration',
                err
            });
    }
}

export default teacherRegistration;