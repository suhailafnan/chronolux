const User = require("../models/UserModel");
const Wallet= require("../models/walletModel");
const Cart=require("../models/cart");
const Order = require('../models/orderModels');
const Address=require("../models/address"); 
const crypto = require('crypto');
const Products =require("../models/products"); 
const generateRandomId = async () => {
    try {
      const randomId = crypto.randomBytes(8).toString('hex');
      return randomId;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to generate random ID');
    }
  };

const loadWallet =async (req,res)=>{
    try{
        const user=req.session.user
       const wallet=await Wallet.findOne({  UserId:user})
       res.render("userWallet",{user,wallet})
    }catch(error){
        console.log(error)
    }
}


const addToWallet = async (req, res) => {
    try {
        const user = req.session.user;
        const amount = parseFloat(req.query.amount);
        let wallet = await Wallet.findOne({ UserId: user._id });
        if (!wallet) {
            wallet = new Wallet({
                UserId: user._id,
                balance: amount,
                history: [{
                    amount: amount,
                    transactionType: "razorpay",
                    previousBalance: 0 
                }]
            });
        } else {
            const previousBalance = wallet.balance;
            wallet.balance += amount;
            wallet.history.push({
                amount: amount,
                transactionType: "razorpay",
                previousBalance: previousBalance
            });
        }
        await wallet.save();
        res.status(200).json({ message: 'Wallet updated successfully', wallet });
    } catch (error) {
        console.error("Error adding to wallet:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const withdrawMoney = async (req, res) => {
    try {
        const user = req.session.user;
        const amount = parseFloat(req.query.amount);
        const wallet = await Wallet.findOne({ UserId: user._id });
        if (!wallet) {
            return res.status(404).json({ success: false, error: 'Wallet not found' });
        }

        const previousBalance = wallet.balance;

        if (previousBalance < amount) {
            return res.status(400).json({ success: false, error: 'Insufficient balance' });
        }

        wallet.balance -= amount;
        wallet.history.push({
            // amount: -amount,
            amount: amount,
            transactionType: "withdraw",
            previousBalance: previousBalance
        });
        await wallet.save();

        res.status(200).json({ success: true, message: 'Withdrawal successful', wallet });

    } catch (error) {
        console.error("Error withdrawing from wallet:", error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const viewTransaction = async (req, res) => {
    try {
        const user = req.session.user;
        const wallet = await Wallet.findOne({ UserId: user._id });
        res.render("walletTransaction", { user, wallet });
    } catch (error) {
        console.log(error);
    }
};
const placeOrderWithWallet = async (req, res) => {
    try {
      const { addressId, paymentMethod, totalAmount, cartDetails } = req.body;
      const user = req.session.user;
  
      const wallet = await Wallet.findOne({ UserId: user._id });
      if (!wallet) {
        return res.status(404).json({ success: false, message: 'Wallet not found' });
      }
  
      const cart = await Cart.findOne({ userId: user._id }).populate("product.productId");
      if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found' });
      }
  
      if (totalAmount > wallet.balance) {
        return res.status(400).json({ success: false, message: 'Insufficient balance in wallet!' });
      }
  
      const addressData = await Address.findOne({ userId: user._id, "address._id": addressId });
      if (!addressData) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
  
      // Filter the selected address
      const selectedAddress = addressData.address.find(addr => addr._id.toString() === addressId);
  
      if (!selectedAddress) {
        return res.status(404).json({ success: false, message: 'Selected address not found' });
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
          message: "Products are out of stock, please remove product(s)",
          outOfStockProducts
        });
      }
  
      // Update wallet balance and transaction history
      const previousBalance = wallet.balance;
      wallet.balance -= totalAmount;
      wallet.history.push({
        amount: totalAmount,
        transactionType: "Ordered",
        previousBalance: previousBalance
      });
      await wallet.save();
  
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
  
      await Cart.findOneAndUpdate({ userId: user._id }, { product: [] });
  
      const randomId = await generateRandomId();
  
      const newOrder = new Order({
        userId: user._id,
        items: items,
        totalAmount: totalAmount,
        address: selectedAddress, 
        paymentMethod: paymentMethod,
        orderId: randomId,
      });
  
      await newOrder.save();
      res.status(200).json({ success: true, message: 'Order placed successfully!' });
  
    } catch (error) {
      console.error('Error placing order with wallet:', error);
      res.status(500).json({ success: false, message: 'An error occurred while placing the order.' });
    }
  };
  
// const placeOrderWithWallet = async (req, res) => {
//     try {
//         const { addressId, paymentMethod, totalAmount, cartDetails } = req.body;
//         const user = req.session.user;
//         console.log(addressId)
//         const wallet = await Wallet.findOne({ UserId: user._id });
//         if (!wallet) {
//             return res.status(404).json({ success: false, message: 'Wallet not found' });
//         }

//         const cart = await Cart.findOne({ userId: user._id }).populate("product.productId");
//         if (!cart) {
//             return res.status(404).json({ success: false, message: 'Cart not found' });
//         }

//         if (totalAmount > wallet.balance) {
//             return res.status(400).json({ success: false, message: 'Insufficient balance in wallet!' });
//         }

//         const addressData = await Address.findOne({ userId: user._id, "address._id": addressId });
//         if (!addressData) {
//             return res.status(404).json({ success: false, message: 'Address not found' });
//         }

//         let outOfStockProducts = [];
//         for (const item of cart.product) {
//             const product = item.productId;
//             if (product.Stock < item.quantity) {
//                 outOfStockProducts.push(product.name);
//             }
//         }

//         if (outOfStockProducts.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Products are out of stock, please remove product(s)",
//                 outOfStockProducts
//             });
//         }

//         //here this will and gavee tha  Update wallet balance and transaction history
//         const previousBalance = wallet.balance;
//         wallet.balance -= totalAmount;
//         wallet.history.push({
//             amount: totalAmount,
//             transactionType: "Ordered",
//             previousBalance: previousBalance
//         });
//         await wallet.save();

//         const items = [];
//         for (const item of cart.product) {
//             const oneProduct = await Products.findById(item.productId);
//             if (!oneProduct) {
//                 continue; 
//             }

//             const itemDetails = {
//                 productId: item.productId,
//                 quantity: item.quantity,
//                 categoryId: oneProduct.category,
//                 price: oneProduct.finalPrice,
//             };

//             items.push(itemDetails);

//             oneProduct.Stock -= item.quantity;
//             await oneProduct.save();
//         }

//         await Cart.findOneAndUpdate({ userId: user._id }, { product: [] });

//         const randomId = await generateRandomId();

//         const newOrder = new Order({
//             userId: user._id,
//             items: items,
//             totalAmount: totalAmount,
//             address: addressData.address,
//             paymentMethod: paymentMethod,
//             orderId: randomId,
//         });

//         await newOrder.save();
//         res.status(200).json({ success: true, message: 'Order placed successfully!' });

//     } catch (error) {
//         console.error('Error placing order with wallet:', error);
//         res.status(500).json({ success: false, message: 'An error occurred while placing the order.' });
//     }
// };

const walletOrderConfirmation = async (req, res) => {
    try {
        const user = req.session.user;
     
        res.render("walletOrderConfirmation", { user});
    } catch (error) {
        console.log(error);
    }
};




module.exports={
    loadWallet,
    addToWallet,
    withdrawMoney,
    viewTransaction,
    placeOrderWithWallet,
    walletOrderConfirmation
}