const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const networkPath = process.env.FABRIC_NETWORK_PATH;
const channelName = process.env.CHANNEL_NAME || 'supplychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'supplychain';

function buildCCP() {
    // Doc connection profile template
    var ccpPath = path.resolve(__dirname, 'connection-producer.json');
    var contents = fs.readFileSync(ccpPath, 'utf8');
    var ccp = JSON.parse(contents);

    // Doc TLS CA certificates va nhung vao connection profile
    var producerTlsCa = fs.readFileSync(
        path.resolve(networkPath, 'organizations/peerOrganizations/producer.supplychain.com/tlsca/tlsca.producer.supplychain.com-cert.pem'),
        'utf8'
    );
    var logisticsTlsCa = fs.readFileSync(
        path.resolve(networkPath, 'organizations/peerOrganizations/logistics.supplychain.com/tlsca/tlsca.logistics.supplychain.com-cert.pem'),
        'utf8'
    );
    var retailerTlsCa = fs.readFileSync(
        path.resolve(networkPath, 'organizations/peerOrganizations/retailer.supplychain.com/tlsca/tlsca.retailer.supplychain.com-cert.pem'),
        'utf8'
    );
    var ordererTlsCa = fs.readFileSync(
        path.resolve(networkPath, 'organizations/ordererOrganizations/supplychain.com/tlsca/tlsca.supplychain.com-cert.pem'),
        'utf8'
    );

    // Thay placeholder bang cert thuc
    ccp.peers['peer0.producer.supplychain.com'].tlsCACerts.pem = producerTlsCa;
    ccp.peers['peer0.logistics.supplychain.com'].tlsCACerts.pem = logisticsTlsCa;
    ccp.peers['peer0.retailer.supplychain.com'].tlsCACerts.pem = retailerTlsCa;
    ccp.orderers['orderer1.supplychain.com'].tlsCACerts.pem = ordererTlsCa;

    return ccp;
}

async function buildWallet(walletPath) {
    var wallet;
    if (walletPath) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
    } else {
        wallet = await Wallets.newInMemoryWallet();
    }
    return wallet;
}

async function connectGateway(userId) {
    var ccp = buildCCP();
    var walletPath = path.join(__dirname, '..', '..', 'wallet');
    var wallet = await buildWallet(walletPath);

    var identity = await wallet.get(userId);
    if (!identity) {
        throw new Error('Identity ' + userId + ' not found in wallet. Run createIdentity first.');
    }

    var gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true }
    });

    var network = await gateway.getNetwork(channelName);
    var contract = network.getContract(chaincodeName);

    return { gateway, contract };
}

async function createFileBasedIdentity() {
    var walletPath = path.join(__dirname, '..', '..', 'wallet');
    var wallet = await buildWallet(walletPath);

    var identity = await wallet.get('admin');
    if (identity) {
        console.log('Admin identity already exists in wallet');
        return;
    }

    // Doc certificate
    var certDir = path.resolve(
        networkPath,
        'organizations/peerOrganizations/producer.supplychain.com/users/Admin@producer.supplychain.com/msp/signcerts'
    );
    var certFiles = fs.readdirSync(certDir);
    var certFile = certFiles.find(function(f) { return f.endsWith('.pem'); });
    if (!certFile) {
        throw new Error('Certificate not found in ' + certDir);
    }
    var certificate = fs.readFileSync(path.join(certDir, certFile), 'utf8');

    // Doc private key
    var keyDir = path.resolve(
        networkPath,
        'organizations/peerOrganizations/producer.supplychain.com/users/Admin@producer.supplychain.com/msp/keystore'
    );
    var keyFiles = fs.readdirSync(keyDir);
    var keyFile = keyFiles.find(function(f) { return f.endsWith('_sk'); });
    if (!keyFile) {
        throw new Error('Private key not found in ' + keyDir);
    }
    var privateKey = fs.readFileSync(path.join(keyDir, keyFile), 'utf8');

    var x509Identity = {
        credentials: {
            certificate: certificate,
            privateKey: privateKey
        },
        mspId: 'ProducerMSP',
        type: 'X.509'
    };

    await wallet.put('admin', x509Identity);
    console.log('Successfully created admin identity from Producer Org');
}

async function enrollAdmin() {
    // Custom network khong co CA, dung file-based identity
    await createFileBasedIdentity();
}

module.exports = {
    buildCCP,
    buildWallet,
    connectGateway,
    enrollAdmin,
    createFileBasedIdentity
};
