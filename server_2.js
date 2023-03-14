'use strict';



//const router= require('./router_2');

/*
const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
*/
const org1UserId = 'appUser1';

const express= require('express');//import the required package
const fabricNetwork = require('./fabricNetwork')
const router = express.Router();
const app=express();//create an object of from the express module
const port=2000;//set the port to host the server


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

function getdate(){

    const date = new Date();
    let day = date.getDate();
    let month= date.getMonth() + 1;
    let year = date.getFullYear();
    let currentdate=`${day}-${month}-${year}`;
    return(currentdate);
}
const GetAssets= async function(req,res){
    console.log('Getting assets on the blockchain');
    const contract = await fabricNetwork.connectNetwork('org1.example.com/connection-org1.json','wallet');
    let result = await contract.evaluateTransaction('GetAllAssets');
    result=prettyJSONString(result.toString());
    res.send(result);
}

const CreateAsset = async function(req,res){
    var type=req.query.type;
    var location = req.query.location;
    var weight = req.query.weight;
    var temp =req.query.temp;
    var org = req.query.org;
    var date = getdate();
    console.log('Creating a new asset');
    const contract = await fabricNetwork.connectNetwork('org1.example.com/connection-org1.json','wallet');
    await contract.submitTransaction('CreateAsset',org1UserId,`${org}`,`${type}`,`${location}`,`${weight}`,`${temp}`,`${date}`);
    console.log('*** Result: committed')
    console.log(`${location},${weight},${temp},${org}`);
}

const ReadAsset = async function(req,res){
    var id = req.query.id;
    const contract = await fabricNetwork.connectNetwork('org1.example.com/connection-org1.json','wallet');
    let result = await contract.evaluateTransaction('ReadAsset',id);
    res.send(`*** Result: ${prettyJSONString(result.toString())}`);
    
}

const RequestTransfer= async function(req,res){
    var id =req.query.id;
    var newOwnerOrg=req.query.newOwnerOrg;
    const contract = await fabricNetwork.connectNetwork('org1.example.com/connection-org1.json','wallet');
    let result = await contract.submitTransaction('RequestTransfer',`${newOwnerOrg}`,`${id}`);
    res.send(`*** Result: ${prettyJSONString(result.toString())}`);
}




app.listen(port,function(){console.log(`Application deployed on port ${port}`);});//deploy server
app.use('/api',router);//mount router on the server 


router.get('/',function(req,res){
    res.send('Hello world');
});
router.get('/list_assets',GetAssets);
router.get('/createproduct',CreateAsset);
router.get('/queryProduct',ReadAsset);
router.get('/transferproduct',RequestTransfer);

//module.exports={contract,org1UserId}
