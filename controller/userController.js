const User = require("../models/UserModel");
const newgoogleUser = require("../models/googleUser");
const Category = require("../models/category");
const Products =require("../models/products");

const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const OTP = require("../models/otpModel");
const otpController = require("../controller/otpController");
const flash = require("connect-flash");

// for loading the website this method is called
const loadWebpage = async (req, res) => {
  try {
 
   
    res.render('index', { user: req.session.user });
  } catch (error) {
    console.log(error.messsage);
  }
};


const loadHomepage = async (req, res) => {
  try {
  //  homeeeee

  // const user = req.session.user
    res.render('index', { user :req.session.user});
  } catch (error) {
    console.log(error.message);
  }
};


// for loading the register this method is called
const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.messsage);
  }
};

// for loading the sign in page
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.messsage);
  }
};


const veriyfyLogin = async (req, res) => {
  try {
    const email = req.body.your_email;
    const password = req.body.your_pass;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (!userData.is_blocked) {
          req.session.user = userData; // Store the entire user object in session
          res.redirect('/home');
        } else {
          res.render('login', { message: 'YOU HAVE BEEN BLOCKED BY ADMIN' });
        }
      } else {
        res.render('login', { message: 'Email or password is incorrect' });
      }
    } else {
      res.render('login', { message: 'Email or password is incorrect' });
    }
  } catch (error) {
    console.log(error.message);
    res.render('login', { message: 'An error occurred during login' });
  }
};

// securding the password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// otp validation loading page

// const loadOtp = async (req, res) => {
//   try {
//     let message = req.flash("message");
//     res.render("otpVerification", {
//       message,
//     });
//   } catch (error) {
//     console.log(error.messsage);
//   }
// };

// for inserting user to database this method is called

let theOtp = "";
const insertUser = async (req, res) => {
  try {
    //  and when inserting the otp willl go to the mail
    const { name, email, password } = req.body;
    // checks wheater this user exists
    const existUser = await User.findOne({ email });
    if (existUser) {
      res.render("signup", { message: "User already exists" });
      return;
    }
    if (req.body.password === req.body.re_pass) {
      const spassword = await securePassword(req.body.password);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: spassword,
        is_admin: 0,
        is_verified: 0,
      });
      const userData = await user.save();
      if (userData) {
        const user=await User.findOne({email})
        
        const otpBody = await otpController.generateOtpfun(req, res);
        res.render("otpVerification", { email: email,user });
        console.log(userData);
        console.log("otp is :", otpBody);
        theOtp = otpBody;
      }
      
    } else {
      res.render("signup", {
        message: "your password dosen't match",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const loadResendOtp = async (req, res) => {
  try {
     
    const email = req.query.email; // Retrieve the email from query parameters
    console.log("Resending OTP for email:", email);
    const userData = await User.findOne({ email: email });
    if (userData) {
      // Generate a new OTP
      console.log("hello resend otppp")  
        // const user=await User.findOne({email})
        // const NewOtpBody = await otpController.generateOtpfun(req, res);
        // res.render("otpVerification", { email: email,user });
        // console.log(userData);
        // // console.log("New  resended OTP is :",NewOtpBody);
        // theOtp =NewOtpBody;
      
      // Send response indicating success
      res.status(200).send({ success: true, message: "New OTP has been sent." });
    } else {
      // If user not found, send response indicating failure
      res.status(404).send({ success: false, message: "User not found." });
    }
  } catch (error) {
    console.log(error.message);
    // Send response indicating error
    res.status(500).send({ success: false, message: "An error occurred while resending OTP." });
  }
};
// here we should give the otp verification in the user side

const verifyOtp = async (req, res) => {
  try {
    //const email = req.body.email;
    let writtenOtp =
      req.body.digit1 +
      req.body.digit2 +
      req.body.digit3 +
      req.body.digit4 +
      req.body.digit5 +
      req.body.digit6;
    console.log("The user written OTP is: ", writtenOtp);
    if (theOtp === writtenOtp) {
      
      res.redirect("/login");
    } else {
      console.log("User is blocked or not found");
      res.render("otpverification", {
        message: "Your OTP doesn't match or user is blocked",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// google authentication and loginn

const loadAuth = (req, res) => {
  //res.render('auth');
  res.render("index");
};

const successGoogleLogin = async (req, res) => {
  if (!req.user) {
    res.redirect("/failure");
  } else {
    const googleUser = new newgoogleUser({
      name: req.user.displayName,
      email: req.user.email,
      is_admin: 0,
      is_verified: 0,
    });
    const userData = await googleUser.save();
    console.log(req.user);
    res.redirect("/home");
  }
};

const failureGoogleLogin = (req, res) => {
  res.send("Error");
};

// const loadShop = async (req, res) => {
//   try {
//     const user =req.session.user
//     const categories = await Category.find();
//      const products = await Products.find();
//     res.render("shop", { catogeries: categories ,products,user});
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const loadShop = async (req, res) => {
  try {
    const user = req.session.user;
    const categories = await Category.find();
    
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 9; // Default to 9 items per page if not provided
    const skip = (page - 1) * limit;

    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Products.find().skip(skip).limit(limit);

    res.render("shop", { categories, products, user, currentPage: page, totalPages });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal server error');
  }
};

const userLogout=async (req,res)=>{
  try{
  req.session.destroy();
  res.redirect("/")
  
  }catch (error) {
    console.log(error.message);
  }
}

const loadShopDetials= async (req, res) => {
  try {
    const id=req.query.ProductId;
   
    const categories = await Category.find();
     const products = await Products. findById(id);

    res.render("product_details", { catogeries: categories ,products, user :req.session.user});
  } catch (error) {
    console.log(error.message);
  }
};


const getProducts = async (req, res) => {
  
  let sortOption = req.query.sort || '';
  let sortCriteria = {};

  switch (sortOption) {
      case 'priceLowHigh':
          sortCriteria = { price: 1 };
          break;
      case 'priceHighLow':
          sortCriteria = { price: -1 };
          break;
      case 'nameAZ':
          sortCriteria = { name: 1 };
          break;
      default:
          sortCriteria = {};
          break;
  }
  try {
      const products = await Products.find().sort(sortCriteria);
      const categories = await Category.find();
      res.render('shop', { products: products, catogeries :categories,user:req.session.user});
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};


const search = async (req, res) => {
  try {
    const query = req.query.query;
    const regex = new RegExp(query, 'i');

    const products = await Products.find({ name: regex });
    res.json(products);
  } catch (error) {
    console.log(error.message);
  }
};




module.exports = {
  loadRegister,
  loadLogin,
  veriyfyLogin,
  insertUser,
  loadWebpage,
  // loadOtp,
  userLogout,
 
  verifyOtp,
  loadResendOtp,
  loadAuth,
  successGoogleLogin,
  failureGoogleLogin,
  loadShop,
  loadShopDetials,
  loadHomepage ,
  getProducts,
  search

};
