const {Schema, model} = require("mongoose");

const customerSchema = new Schema({
    name: {
        type: String,
        required : true
    },
    email: {
        type: String,
        required : true
    },
    password: {
        type: String,
        required : true,
        select: false
    },
    gender: {
        type: String,
        required : true
    },
    image: {
        type: String,
        required : false,
    },
    address: {
        type: String,
        required : false,
    },
    phoneNumber: {
        type: String,
        required : false,
    },
    status: {
        type: String,
        required : true
    },
    method: {
        type: String,
        required : true
    }, 
},{ timestamps: true })

module.exports = model('customers',customerSchema)