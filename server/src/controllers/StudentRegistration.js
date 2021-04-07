import yaml from "js-yaml";
import fs from "fs";
import FabricCAServices from "fabric-ca-client";

const studentRegistration = async (req, res) => {
    let caInfo = yaml.safeLoad(fs.readFileSync('../gateway/fabric-ca-client-config.yaml', 'utf8'));
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
};

export default studentRegistration;

