'use strict';

class Product {
    constructor() {
        this.id;
        this.owner_Org;
        this.transferTo_Org;
        this.type;
        this.location;
        this.weight;
        this.temperature;
        this.useByDate;
        this.linkedExperiments;
    }

    static from(bufferOrJson) {
        if (Buffer.isBuffer(bufferOrJson)) {
            if (!bufferOrJson.length) {
                return;
            }

            bufferOrJson = JSON.parse(bufferOrJson.toString('utf-8'));
        }
        return Object.assign(new Product(),bufferOrJson);
    }

    toJson() {
        return JSON.stringify(this);
    }


    toBuffer() {
        return Buffer.from(this.toJson());
    }
}

module.exports = { Product };
