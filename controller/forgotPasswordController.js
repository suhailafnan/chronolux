const User = require("../models/UserModel");
const newgoogleUser = require("../models/googleUser");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const OTP = require("../models/otpModel");
const otpController = require("../controller/otpController");
const flash = require("connect-flash");


// const loadForgotPassword=async(req,res)=>{
//     try{
//         const user=req.session.user
//         res.render("forgotPassword",{user})

//     }catch (error) {
//         console.log(error);
//     }
//  };
// let theOtp="";
// const  ForgotPassword=async(req,res)=>{
//     try{
//         const email=req.body.email;
//         const user=await User.findOne({email:email})
//         if(user){
      
//         const Otp = await otpController.generateOtpfun(req, res);
//         res.render("resetPasswordOtp", { email: email,user,errormsg });
//         console.log("otp is :", Otp);
//         theOtp = Otp;
//         }
//     }catch (error) {
//         console.log(error);
//     }
// };
// const    verifyOtp= async (req, res) => {
//     try {
     
//       let writtenOtp =
//         req.body.digit1 +
//         req.body.digit2 +
//         req.body.digit3 +
//         req.body.digit4 +
//         req.body.digit5 +
//         req.body.digit6;
//       console.log("The user written OTP is: ", writtenOtp);
//       if (theOtp === writtenOtp) { 
//         console.log("helllllllllllllll")
//       } else {
//         console.log("User is blocked or not found"); 
//         req.flash('errormsg', ' Otp  do not match');
//         return  res.redirect("/forgotEmailSubmit")
//       }
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
// module.exports={
//     loadForgotPassword,
//     ForgotPassword,
//     verifyOtp
// }
const loadForgotPassword = async (req, res) => {
    try {
  
        res.render("forgotPassword");
        
    } catch (error) {
        console.log(error);
    }
};

let theOtp = "";

const ForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });
        if (user) {
            const Otp = await otpController.generateOtpfun(req, res);
            theOtp = Otp;
            console.log("otp is:", Otp);
            res.render("resetPasswordOtp", { email: email, user, errormsg: null });
        } else {
            const errormsg = "User not found";
            res.render("forgotPassword", { errormsg });
        }
    } catch (error) {
        console.log(error);
    }
};

const verifyOtp = async (req, res) => {
    try {
        const email=req.query.email;
        const writtenOtp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4 + req.body.digit5 + req.body.digit6;
        console.log("The user written OTP is:", writtenOtp);
        if (theOtp === writtenOtp) {
            console.log("OTP verified successfully");
            // Redirect to reset password page or perform further actions
        } else {
            console.log("OTP does not match");
            // const errormsg = 'OTP does not match';
            // return res.render("resetPasswordOtp", { errormsg, user: req.body.email });
        }
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    loadForgotPassword,
    ForgotPassword,
    verifyOtp
};
