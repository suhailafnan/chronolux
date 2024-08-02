const Order = require('../models/orderModels');
const User = require('../models/UserModel');
const Wishlist = require('../models/wishList');
const Product = require("../models/products");

const addToWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const productId = req.query.productId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ userId: user });

        if (wishlist) {
            const productExists = wishlist.product.some(item => item.productId.toString() === productId);
            if (productExists) {
                return res.status(200).send({ success: false, message: 'Product is already in the wishlist' });
            }

            wishlist.product.push({ productId: productId, price: product.price });
        } else {
            wishlist = new Wishlist({
                userId: user,
                product: [{ productId: productId, price: product.price }]
            });
        }

        await wishlist.save();

        res.status(200).send({ success: true, message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Server error' });
    }
};


const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findOne({ _id: userId });
        const wishlistData = await Wishlist.findOne({ userId: userId }).populate('product.productId');

        let wishlist = [];
        if (wishlistData && wishlistData.product) {
            wishlist = wishlistData.product;
        }

        res.render('wishlist', { user: userData, wishlist: wishlist, count: wishlist.length });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.query.productId;
       

        const removed = await Wishlist.updateOne(
            { userId: userId },
            { $pull: { product: { productId: productId } } }
        );

        if (removed.modifiedCount > 0) {
            res.status(200).send({ success: true, message: 'Removed from wishlist successfully' });
        } else {
            res.status(400).json({ success: false, message: "Failed to remove the product from the wishlist." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred while removing the product from the wishlist.' });
    }
};



module.exports = {
    addToWishlist,
    loadWishlist,
    removeFromWishlist
};
