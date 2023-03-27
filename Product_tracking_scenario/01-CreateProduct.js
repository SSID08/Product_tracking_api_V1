const request= require('request');
//const { Product } = require('../../Chaincode_test2/chaincode-javascript/lib/product');
const TransactionModel = require('../models/transaction');
require('../models/db');

const url='http://localhost:2000/api/createproduct?type=chicken&location=Cranfield&weight=0.5&temp=12&date=12/12/12';


request(url,function(err,response,body){//callback function sending at get request to the Plumber API
    if (err){
        console.log(err);
    }
console.log(body);})
/*     if(response){
        TransactionModel.find({},function(err,transactions){
            console.log(transactions);
            return;
        })
}}) */

/* ProductModel.find({ owner_id: owner_id }, function(err, products){
        
    // console.log('products:' + products);
    console.log('products queried sucessfully')
    sendJSONresponse(res, 200, products);
    return;


}) */