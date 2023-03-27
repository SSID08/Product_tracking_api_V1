// Setting for Hyperledger Fabric
const { Gateway, Wallets } = require('fabric-network');
//const FabricCAServices = require('fabric-ca-client');
const path = require('path');
//const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
//const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, './wallet');
//const org1UserId = 'appUser1_new_new';



async function connectNetwork(username) {

  const ccp = buildCCPOrg1();
  const wallet = await buildWallet(Wallets, walletPath);

  // Check to see if we've already enrolled the user.

  // Create a new gateway for connecting to our peer node.
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: username,
    discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
})
  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork(channelName);
  // Get the contract from the network.
  const contract = network.getContract(chaincodeName);
  return contract;
}

module.exports = {connectNetwork}