const User = require("../models/UserModel");
const newgoogleUser = require("../models/googleUser");
const Category = require("../models/category");
const Products =require("../models/products"); 
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const Cart=require("../models/cart"); 
const Address=require("../models/address"); 
const Order=require("../models/orderModels"); 


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
        if (productId && productId.price) {
            const subtotal = productId.price * quantity;
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


  // const  addToPlaceOrder = async (req, res) => {
  //   try {
  //   console.log("thiings all posted to backend")
  //     const user= req.session.user;
  //     const orderData =req.body
  //     console.log(orderData,user)
      
  //      const userId=user._id
    
  //      const addressId=orderData.addressId;
     
  //      const address = await Address.findOne({ 'userId': userId }); 
  //      console.log(address)
    


        
        // const order = new Order({
        //  name:user.name,
        //  address:orderData.addressId

        // });
        // const orderdetails = await Order.save();


     
  //   } catch (error) {
  //     console.log(error.message);
  // }
  // };
  

  const addToPlaceOrder = async (req, res) => {
    try {
      console.log("thiings all posted to backend")
      const user= req.session.user;
      const orderData =req.body;
     

      const paymentMethod =orderData.paymentMethod;
      const addressId = orderData.addressId;
      const userid = req.session.user._id;
      const totalamount = orderData.totalAmount;
      const addressData = await Address.findOne({ userId: userid ,"address._id":addressId});
      console.log(addressData)
      const cart= await Cart.findOne({ userId: userid }).populate(
        "product.productId"
      );
 
      let outOfStockProducts = [];
      if (cart) {
        for (const item of cart.product) {
          const product = item.productId;
  
          if (product.Stock <item.quantity) {
            outOfStockProducts.push(product.name);
          }
        }
      }
      if (outOfStockProducts.length > 0) {
        res
          .status(400)
          .json({
            success: false,
            message: "Products is out of Stock, please remove product",
          });
      } else {
        const items = [];
  
        for (const item of cart.product) {
          const oneProduct = await Products.findById(item.productId);
       

          const itemDetails = { 
            productId: item.productId,
            quantity: item.quantity,
            categoryId: oneProduct.category,
            price: oneProduct.price,
          };
  
          items.push(itemDetails);
  
          oneProduct.Stock -= item.quantity;
          await oneProduct.save();
  
        }
  
        await Cart.findOneAndUpdate({ userId: userid }, { product: [] });
  
        const newOrder = new Order({
          userId: userid,
          items: items,
          totalAmount: totalamount,
          address:addressData.address,
          paymentMethod: paymentMethod,
         
        });
  
      
        await newOrder.save();
       
        res.status(200).json({ success: true });
      }
    } catch (error) {
      console.log(error.message);
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
    orderConfirmation
}

