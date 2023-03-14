//import required packages
const express= require('express');
const router = express.Router();
const ctrlProductTracking = require('./controllers/productTracking')
const contract = require('./server_2').contract;

router.get('/',function(req,res){
    res.send('Hello world');
})
router.get('/list_assets',ctrlProductTracking.GetAssets)

//lrouter.post('/createproduct',ctrlProductTracking.CreateAsset);
router.get('/queryProduct',ctrlProductTracking.ReadAsset);
//router.post('/requesttransfer',ctrlProductTracking.RequesTransfer);

//Get request to deal output list of files present in database

module.exports = router;//allow the app.use() method in server.js to access the router object
