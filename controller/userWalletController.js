const User = require("../models/UserModel");
const Wallet= require("../models/walletModel");

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
            amount: -amount,
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


module.exports={
    loadWallet,
    addToWallet,
    withdrawMoney
}