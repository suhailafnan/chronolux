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
const Wallet= require("../models/walletModel");
const Coupon =require("../models/couponModel")
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
        if (!addressData) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const selectedAddress = addressData.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) {
            return res.status(404).json({ success: false, message: 'Selected address not found' });
        }

        const cart = await Cart.findOne({ userId: userid }).populate("product.productId");
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        let outOfStockProducts = [];
        for (const item of cart.product) {
            const product = item.productId;

            if (product.Stock < item.quantity) {
                outOfStockProducts.push(product.name);
            }
        }

        if (outOfStockProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Products are out of stock, please remove products",
                outOfStockProducts
            });
        }

      
  

        const existingOrders = await Order.findOne({ userId: userid });
        let isFirstOrder = false;
        let referedCode = null;

        if (!existingOrders) {
            isFirstOrder = true;
            referedCode = user.referedCode; 
            
            if (referedCode) {
               
                const referedUser = await User.findOne({ referenceCode: referedCode });
                if (referedUser) {
                    const referedUserId = referedUser._id;
                    let referedUserWallet = await Wallet.findOne({ UserId: referedUserId });
                    if (!referedUserWallet) {
                        referedUserWallet = new Wallet({
                            UserId: referedUserId,
                            balance: 50,
                            history: [{
                                amount: 50,
                                transactionType: "Referal bonus",
                                previousBalance: 0
                            }]
                        });
                    } else {
                        referedUserWallet.balance += 50;
                        referedUserWallet.history.push({
                            amount: 50,
                            transactionType: "Referal bonus",
                            previousBalance: referedUserWallet.balance - 50
                        });
                    }
                    await referedUserWallet.save();
                 

                    let currentUserWallet = await Wallet.findOne({ UserId: userid });
                    if (!currentUserWallet) {
                        currentUserWallet = new Wallet({
                            UserId: userid,
                            balance: 30,
                            history: [{
                                amount: 30,
                                transactionType: "First order bonus",
                                previousBalance: 0
                            }]
                        });
                    } else {
                        currentUserWallet.balance += 30;
                        currentUserWallet.history.push({
                            amount: 30,
                            transactionType: "First order bonus" ,
                            previousBalance: currentUserWallet.balance - 30
                        });
                    }
                    await currentUserWallet.save();
                
                }
            }
        }


        const items = [];
        for (const item of cart.product) {
            const oneProduct = await Products.findById(item.productId);
            if (!oneProduct) {
                continue;
            }

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
            address: selectedAddress, 
            paymentMethod: paymentMethod,
            orderId: randomId,
            createdAt: new Date() 
        });

        await newOrder.save();

      
        res.status(200).json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


// const giveCoupon = async (userId, totalAmount, orderId) => {
//     try {
//         const user = await User.findById(userId);
//         const order = await Order.findById(orderId);
//         const coupons = await Coupon.find({ is_active: true });

//         let addedCoupons = [];
//         for (const coupon of coupons) {
//             if (totalAmount >= coupon.minimum) {
//                 const couponExists = user.coupons.some(item => item.equals(coupon._id));

//                 if (!couponExists) {
//                     await User.findByIdAndUpdate(
//                         { _id: userId },
//                         { $push: { coupons: coupon._id } }
//                     );
//                     addedCoupons.push(coupon);
//                 }
//             }
//         }

//         return addedCoupons;
//     } catch (error) {
//         console.log(error);
//         throw error; 
//     }
// };

// const orderConfirmation = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userId = req.session.user._id;
//         const orderId = req.query.orderId;
//         const order = await Order.findById(orderId).populate('items.productId');

//         if (!order) {
//             return res.status(404).render('errorPage', { message: 'Order not found' });
//         }

//         const addedCoupons = await giveCoupon(userId, order.totalAmount, orderId);
//         res.render('orderConfirmation', { user, order, addedCoupons });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).render('errorPage', { message: 'Internal Server Error' });
//     }
// };

// ########this will  check that is that coupon given or not but the hting in the up will check like that 
const giveCoupon = async (userId, totalAmount, orderId) => {
    try {
        const user = await User.findById(userId);
        const coupons = await Coupon.find({ is_active: true });

        let addedCoupons = [];
        for (const coupon of coupons) {
            if (totalAmount >= coupon.minimum) {
                await User.findByIdAndUpdate(
                    { _id: userId },
                    { $push: { coupons: coupon._id } }
                );
                addedCoupons.push(coupon);
            }
        }

        return addedCoupons;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const orderConfirmation = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = req.session.user._id;
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).render('errorPage', { message: 'Order not found' });
        }

        const addedCoupons = await giveCoupon(userId, order.totalAmount, orderId);
        res.render('orderConfirmation', { user, order, addedCoupons });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('errorPage', { message: 'Internal Server Error' });
    }
};


module.exports={
    loadcheckOutPage,
    addToPlaceOrder,
    orderConfirmation,
   generateRandomId,
   giveCoupon 
}
