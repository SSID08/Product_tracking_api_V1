const request= require('request');
//const TransactionModel = require('../models/transaction');
//require('../models/db');

const url = 'http://localhost:2000/api/transferproduct?id=5678&newOwnerOrg=Org3';

request(url,function(err,response,body){//callback function sending at get request to the Plumber API
    if (err){
        console.log(err);
    }
console.log(body);
})