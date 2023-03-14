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


    _createProductCompositeKey(stub, product) {
        return stub.createCompositeKey('Product',[`${product}`]);
    }

    async _getProduct(stub,id){
        const productBytes=await stub.getState(this._createProductCompositeKey(stub,id));
        return Product.from(productBytes);
    }

    async InitLedger(ctx) {
        const assets= [
            {
                id:'1a2b3c',
                owner: 'Fady',
                previousOwner:'',
                type: 'beef',
                requestIdentity: '',
            },
            {
                id:'2c5d6a',
                owner:'Tom',
                previousOwner:'',
                type: 'fish',
                requestIdentity: '',
            },
            {
                id:'1c2b44a',
                owner:'Kevin',
                previousOwner:'',
                type:'fish',
                requestIdentity : '',
            }
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.id, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.  
    async CreateAsset(ctx, owner_user,owner_org,type,location,weight,temperature,usebydate) {

        const asset = {
            owner_user: owner_user,
            owner_Org: owner_org,
            transferTo_org:'',
            type: type,
            location:location,
            weight:weight,
            temperature:temperature,
            useByDate:usebydate,
            transaction_msp: ctx.clientIdentity.getMSPID(),
        };

        const product_id=sha(JSON.stringify(asset));

        const exists = await this.AssetExists(ctx, product_id);

        if (exists) {
            throw new Error(`The asset ${product_id} already exists`);
        }

        asset.id=product_id;

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(this._createProductCompositeKey(ctx.stub,product_id), Product.from(asset).toBuffer());

        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(this._createProductCompositeKey(ctx.stub,id)); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.

    async RequestTransfer(ctx,newOwnerOrg,id){
        const exists=await this.AssetExists(ctx,id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.transferTo_org=newOwnerOrg;
        productInstance.transaction_msp=ctx.clientIdentity.getMSPID();
        return ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());

    }
    async TransferComplete(ctx,id,newOwner_user,location,temperature) {//modify to only allow acceptance of transfer when TransferTo attribute matches ctx user identity
        const exists = await this.AssetExists(ctx,id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        
        const productInstance = await this._getProduct(ctx.stub,id);
        productInstance.owner_user=newOwner_user;
        productInstance.owner_Org=productInstance.transferTo_org;
        productInstance.location=location;
        productInstance.temperature=temperature;
        productInstance.transaction_msp=ctx.clientIdentity.getMSPID();
        productInstance.transferTo_org='';

        // overwriting original asset with new asset
        /*const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };*/
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(this._createProductCompositeKey(ctx.stub,id), productInstance.toBuffer());
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON =await ctx.stub.getState(this._createProductCompositeKey(ctx.stub,id));
        return assetJSON && assetJSON.length > 0;
    }

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
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetProductHistory(ctx,id){
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getHistoryForKey(this._createProductCompositeKey(ctx.stub,id));
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
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);        
    }
}

module.exports = TransferContract;
