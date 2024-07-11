const User = require("../models/UserModel");
const newgoogleUser = require("../models/googleUser");
const Category = require("../models/category");
const Products =require("../models/products"); 
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const Cart=require("../models/cart"); 
const Address=require("../models/address"); 
const Order=require("../models/orderModels"); 
const crypto = require('crypto');


const loadcheckOutPage = async (req, res) => {
    try {
      const user= req.session.user;
      const addressdata = await Address.findOne({ userId: user });
  
      const cartdata = await Cart.findOne({ userId: user }).populate(
        "product.productId"
      );
  
     
  
      let totalamount = 0;
      cartdata.product.forEach((item) => {
        const { productId, quantity } = item;
        if (productId && productId.finalPrice) {
            const subtotal = productId.finalPrice * quantity;
            totalamount += subtotal;
          
        }
      });
  
      res.render("checkOut", {
        addressdata,
        totalamount,
        user, 
        cartdata
        
      });
    } catch (error) {
      console.log(error.message);
  }
  };
  



  const generateRandomId = async () => {
    try {
      const randomId = crypto.randomBytes(8).toString('hex');
      return randomId;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to generate random ID');
    }
  };
  



  const addToPlaceOrder = async (req, res) => {
    try {
     
      const user = req.session.user;
      const orderData = req.body;
  
      const paymentMethod = orderData.paymentMethod;
      const addressId = orderData.addressId;
      const userid = req.session.user._id;
      const totalAmount = orderData.totalAmount;
      const addressData = await Address.findOne({ userId: userid, "address._id": addressId });
     
      
      const cart = await Cart.findOne({ userId: userid }).populate("product.productId");
  
      let outOfStockProducts = [];
      if (cart) {
        for (const item of cart.product) {
          const product = item.productId;
  
          if (product.Stock < item.quantity) {
            outOfStockProducts.push(product.name);
          }
        }
      }
  
      if (outOfStockProducts.length > 0) {
        res.status(400).json({
          success: false,
          message: "Products are out of stock, please remove product(s)",
        });
      } else {
        const items = [];
  
        for (const item of cart.product) {
          const oneProduct = await Products.findById(item.productId);
  
          const itemDetails = { 
            productId: item.productId,
            quantity: item.quantity,
            categoryId: oneProduct.category,
            price: oneProduct.finalPrice,
          };
  
          items.push(itemDetails);
  
          oneProduct.Stock -= item.quantity;
          await oneProduct.save();
        }
  
        await Cart.findOneAndUpdate({ userId: userid }, { product: [] });
  
        const randomId = await generateRandomId();
  
        const newOrder = new Order({
          userId: userid,
          items: items,
          totalAmount: totalAmount,
          address: addressData.address,
          paymentMethod: paymentMethod,
          orderId: randomId,
        });
  
        await newOrder.save();
       
        
        
        res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  
  
  const orderConfirmation=async(req,res)=>{
    try{

      const user=req.session.user
      res.render('orderConfirmation',{user})

    } catch (error) {
      console.log(error.message);
  }
  };


module.exports={
    loadcheckOutPage,
    addToPlaceOrder,
    orderConfirmation,
   generateRandomId
}
