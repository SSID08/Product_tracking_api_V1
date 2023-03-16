const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser2';
const mspOrg1 = 'Org1MSP';

const ccp = buildCCPOrg1();

const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

async function main(){
// setup the wallet to hold the credentials of the application user

const wallet = await buildWallet(Wallets, walletPath);

// in a real application this would be done on an administrative flow, and only once
await enrollAdmin(caClient, wallet, mspOrg1);

// in a real application this would be done only when a new user was required to be added
// and would be part of an administrative flow
await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1','Org2');}

main()