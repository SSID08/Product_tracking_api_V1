const mongoose = require("mongoose"),
Schema = mongoose.Schema;

const transactionSchema = new Schema(
    {
        _id: {
            type: String,
            required: true
        },
        product_id : {
            type: String,
            required: true
        },
        transaction_details : {
            type : {type: String,required : true},
            from : {type : Schema.Types.Mixed , required : false, default:""},
            to : {type : Schema.Types.Mixed , required : false, default : ""}
        },
        user_id: {
            type: String,
            required : true
        },
        org_id : {
            type : String,
            required : true
        },
         date_creation:{
            type: Date,
            required: true,
            default : new Date()
        }},
        {
            versionKey: false, // By default Mongoose inserts a new field __v to avoid this field versionKey has to be set to false
            _id: false,
          }

);

module.exports = mongoose.model("TransactionModel",transactionSchema);