/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const sha =require('sha256');
const { Product } = require('./product');

class TransferContract extends Contract {


    _createProductCompositeKey(stub, id) {//don't need composite keys
        return stub.createCompositeKey('Product',[`${id}`]);
    }


    async _getProduct(stub,id){
        const productBytes=await stub.getState(this._createProductCompositeKey(stub,id));
        return Product.from(productBytes);
    }

    async checkOwnership(ctx,id){
        const productOwnerInfo=await this._getProduct(ctx.stub,id).owner_Org;
        const clientOwnerOrgInfo=ctx.clientIdentity.getAttributeValue('Organisation');
        return clientOwnerOrgInfo==productOwnerInfo;
    }

    async _AssetExists(ctx, id) {
        const assetJSON =await ctx.stub.getState(this._createProductCompositeKey(ctx.stub,id));
        return assetJSON && assetJSON.length > 0;
    }

    async InitLedger(ctx) {
        const assets= [
            {
                id:"1234",
                owner_Org: 'Org1',
                owner_user: 'Fady',          
                transferTo_Org:'',  
                type: 'Chicken',
                location:'Cranfield',
                weight:0.5,
                temperature:18,
                useByDate:'23/12/23',
            },
            {
                id:'56',
                owner_Org: 'Org2',
                owner_user: 'Tom',          
                transferTo_Org:'',  
                type: 'Fish',
                location:'Manchester',
                weight:0.8,
                temperature:18,
                useByDate:'23/06/23',
            },
            {
                id:'78',
                owner_Org: 'Org1',
                owner_user: 'Kevin',          
                transferTo_Org:'',  
                type: 'Beef',
                location:'London',
                weight:0.6,
                temperature:15,
                useByDate:'12/08/23',
            }
        ];

        for (const asset of assets) {
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,asset.id), Product.from(asset).toBuffer());
        }
        return('Ledger Initialised with assets')
    }

    // CreateAsset issues a new asset to the world state with given details.  
    async CreateAsset(ctx, owner_user,type,location,weight,temperature,usebydate) {

        const asset = {
            owner_Org: ctx.clientIdentity.getAttributeValue('Organisation'),
            owner_user: owner_user,          
            transferTo_Org:'',  
            type: type,
            location:location,
            weight:weight,
            temperature:temperature,
            useByDate:usebydate,
        };

        const product_id=sha(JSON.stringify(asset));
        asset.id=product_id;
        const exists = await this._AssetExists(ctx, product_id);

        if (exists) {
            throw new Error(`The asset ${product_id} already exists`);
        }

        //const key = [asset.owner_Org,asset.id]

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,product_id), Product.from(asset).toBuffer());

        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        }
        const assetJSON = await ctx.stub.getState(this._createProductCompositeKey(ctx.stub,id)); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.

    async RequestTransfer(ctx,newOwnerOrg,id){
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        }
        const exists=await this._AssetExists(ctx,id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const productInstance = await this._getProduct(ctx.stub,id);
        if (productInstance.transferTo_Org!=''){
            throw new Error('A transfer has already been requested for this product')
        }

        productInstance.transferTo_Org=newOwnerOrg;

/*         const new_asset_to_put={
            owner_Org:newOwnerOrg,
            owner_user:newOwner_user,
            requestedTransfer:true,
            previousOwner:productInstance.owner_Org,
            type:productInstance.type,
            weight:productInstance.weight,
            location:'',
            temperature:'',
            useByDate:productInstance.useByDate,
            transaction_msp:ctx.clientIdentity.getMSPID(),
            id:productInstance.id
        } */

        
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();

    }
    async TransferComplete(ctx,id,newOwner_user,location,temperature,weight) {//modify to only allow acceptance of transfer when TransferTo attribute matches ctx user identity
        const exists = await this._AssetExists(ctx,id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        };
        const productInstance=await this._getProduct(ctx.stub,id);
        if(productInstance.transferTo_Org==''){
            throw new Error('Transfer has not been requested')
        };
        if (!ctx.clientIdentity.assertAttributeValue('Organisation',productInstance.transferTo_Org)){
            throw new Error('Organisation does not have permission to complete product transfer')
        };

        productInstance.owner_user=newOwner_user;
        productInstance.owner_Org=ctx.clientIdentity.getAttributeValue('Organisation');
        productInstance.transferTo_Org='';
        productInstance.location=location;
        productInstance.temperature=temperature;
        productInstance.weight=weight;
        //productInstance.transaction_msp=ctx.clientIdentity.getMSPID();

        // overwriting original asset with new asset
        /*const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };*/
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();
    }

    async UpdateLocation(ctx,id,newlocation){
        const exists = await this._AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        };
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        };
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.location=newlocation;
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();
    }

    async UpdateTemperature(ctx,id,newtemperature){
        const exists = await this._AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        };
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        };
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.temperature=newtemperature;
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();
    }

    async UpdateWeight(ctx,id,newWeight){
        const exists = await this._AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        if (this.checkOwnership(ctx,id)==false){
            throw new Error('User is not authorized to access this asset');
        }
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.weight=newWeight;
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();
    }

    async UpdateUseBy(ctx,id,newUseby){

        const exists = await this._AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        }
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.useByDate=newUseby;
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
        return productInstance.toJson();
    }
    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this._AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        if (!this.checkOwnership(ctx,id)){
            throw new Error('User is not authorized to access this asset');
        }
        return ctx.stub.deleteState(this._createProductCompositeKey(ctx.stub,id));
    }

    // AssetExists returns true when asset with given ID exists in world state.


    // TransferAsset updates the owner field of asset with given id in the world state.
    /*async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }*/

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        let ownership_info=ctx.clientIdentity.getAttributeValue('Organisation');
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByPartialCompositeKey('Product',[]);
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if(ownership_info==record.owner_Org){
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetProductHistory(ctx,id){
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getHistoryForKey(this._createProductCompositeKey(ctx.stub,id));
        let ownership_info=ctx.clientIdentity.getAttributeValue('Organisation');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if(ownership_info==record.owner_Org){
            allResults.push(record);}
            result = await iterator.next();
        }
        return JSON.stringify(allResults);        
    }
}

module.exports = TransferContract;
