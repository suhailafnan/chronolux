const express = require("express");
const user_route = express();
const session=require("express-session")
const config =require("../config/config")
const userController = require("../controller/userController");
const otpController = require('../controller/otpController');
const cartController = require("../controller/cartController");
const userProfileController = require("../controller/userProfileController");
const checkOutController = require("../controller/checkOutController");

const flash=require("express-flash")
const nocache = require("nocache");
const auth = require("../middleware/auth");
user_route.use(nocache());
const passport = require('passport'); 
require('../passport');
user_route.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
user_route.use(express.json());
user_route.use(passport.initialize()); 
user_route.use(passport.session());
user_route.use(
    session({
    secret:config.sessionSecret,
      resave: false,
      saveUninitialized: false,
    })
  );
user_route.use(flash())
user_route.use(express.json());
user_route.set("view engine", "ejs");
user_route.set("views", "./views/users/");



user_route.get('/', auth.isLogout, userController.loadWebpage);
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', auth.isLogout, userController.insertUser);
user_route.get('/login', auth.isLogout, userController.loadLogin);
user_route.post('/login', auth.isLogout, userController.veriyfyLogin);
user_route.get('/otpverify', auth.isLogout, userController.loadOtp);
user_route.post('/verify', auth.isLogout, userController.verifyOtp);
user_route.get('/resendOtp', auth.isLogout, userController.loadResendOtp);
user_route.get('/shop',userController.loadShop);
user_route.get('/shop_details',userController.loadShopDetials);
// login only routes routes
user_route.get('/home', auth.isLogin, userController.loadHomepage);
// user_route.post('/resendOtp', userController.loadResendOtp);

//google authenticationn
// Auth 
user_route.get('/auth/google' , passport.authenticate('google', { scope: 
	[ 'email', 'profile' ] 
})); 
// Auth Callback 
user_route.get( '/auth/google/callback', 
	passport.authenticate( 'google', { 
		successRedirect: '/success', 
		failureRedirect: '/failure'
}));
// Success 
user_route.get('/success' , userController.successGoogleLogin); 
// failure 
user_route.get('/failure' , userController.failureGoogleLogin);
// homepages 



// user profile routes are here
user_route.get('/userProfile',userProfileController.loadUserProfile);
user_route.get('/EditProfile',userProfileController.loadEditProfile);
user_route.post('/updateProfile',userProfileController.updateProfile);
user_route.get('/ChangePassword', userProfileController.changePasswordLoad);
user_route.post('/changePassword', userProfileController.changepassword);
user_route.get('/Address',userProfileController.loadUserAdress);
user_route.get('/addAddress',userProfileController.loadAddAddress);
user_route.post('/addAddress',userProfileController.addNewAddress);

user_route.get('/OrderHistory',userProfileController.loadOrderHistory);

user_route.get('/shopSort',  userController.getProducts);


// from here the carts route are set here
user_route.get('/cart',cartController.loadCart);
user_route.post('/addToCart', auth.isLogin,cartController.addToCart);
user_route.post('/removeProduct', auth.isLogin,cartController.removeFromCart);
user_route.post('/update-quantity', auth.isLogin,cartController.updateQuantity);
user_route.post('/checkQuantity', auth.isLogin,cartController.checkQuantity);


// check out page 
user_route.get('/checkOut',checkOutController.loadcheckOutPage);
user_route.post('/placeOrder',checkOutController.addToPlaceOrder);


user_route.get('/orderConfirmation',checkOutController.orderConfirmation);

module.exports = user_route;
