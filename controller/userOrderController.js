const Order = require('../models/orderModels');
const User = require('../models/UserModel');


const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { orderStatus: "Cancelled" } },
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
        res.status(500).send({ success: false, message: 'Internal server error' });
    }
};

const   returnOrderLoad= async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order=await Order.findOne({orderId:orderId})
        const user=req.session.user
       res.render("returnOrder",{order,user})
    } catch (error) {
        console.log(error.message);
    }
};


const   returnOrder= async (req, res) => {
    try {
        const { orderId, returnReason } = req.body;
        console.log(returnReason)
        console.log(orderId) 
        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { orderStatus: "Returned", returnReason: returnReason } },
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

module.exports={
    cancelOrder,
    returnOrderLoad,
    returnOrder
}