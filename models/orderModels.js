const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

    items:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'products',
                required:true
            },
            quantity:{
                type:Number,
                required:true
            },
            Status:{
                type:String,
                enum: ['Confirmed', 'Shipped', 'Cancelled', 'Return','Delivered'],
                default:'Confirmed',
            },
            reason:{
                type:String,
            },
            price:{
                type:Number
            },
            categoryId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'category',
                required:true
            },
        },
    ],

    totalAmount:{
        type:Number,
        required:true,
    },
    
    address:[
        {
            name:{
                type:String,
                required:true
            },
            city:{
                type:String,
                required:true
            },
            state:{
                type:String,
                required:true
            },
            district:{
                type:String,
                required:true
            },
            country:{
                type:String,
                required:true
            },
            mobile:{
                type:Number,
                required:true
            },
            pincode:{
                type:Number,
                required:true
            },
            home_address:{
                type:String
            }
        },
    ],

    paymentMethod:{
        type:String,
        required:true
    },

    orderStatus:{
        type:String,
        enum: ['Approved', 'Shipped', 'Cancelled', 'Return','Delivered'],
        default:'Approved',
     },
    currendDate:{
        type:Date,
        default: ()=> Date.now(),
    },

})

module.exports = mongoose.model('order',orderSchema);
