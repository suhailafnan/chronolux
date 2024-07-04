
const mongoose = require('mongoose');
const Order = require('../models/orderModels');
const User = require('../models/UserModel');
const Category = require('../models/category');
const Products = require('../models/products');

const loadorderDetails = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId')
            .populate('items.productId')
            .populate('items.categoryId');

        res.render('orderpage', { orders });
    } catch (error) {
        console.log(error.message);
    }
};

const loadorderViewPage = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findOne({ orderId: orderId })
            .populate('userId') 
            .populate('items.productId') 
            .populate('items.categoryId'); 
        res.render('adminOrderDetailpage', { order });
    } catch (error) {
        console.log(error.message);
    }
};



const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body;
       const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { orderStatus: orderStatus } },
            { new: true }
        );
        if (order) {
            console.log('Order status updated');
            res.status(200).send({ success: true, message: 'Order status updated successfully', order });
        } else {
            res.status(404).send({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error.message);
    }
};



module.exports = {
    loadorderDetails,
    loadorderViewPage,
    updateOrderStatus,
    
};
