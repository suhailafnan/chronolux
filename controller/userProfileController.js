const User = require("../models/UserModel");
const newgoogleUser = require("../models/googleUser");
const Category = require("../models/category");
const Products =require("../models/products");
const Address =require("../models/address");
const bcrypt = require("bcrypt");
const Order=require("../models/orderModels"); 


const flash = require("express-flash");



const loadUserProfile = async (req, res) => {
  try {
    const user_id = req.query.id; // Retrieve user_id from query parameters
    const user = await User.findById(user_id);

    if (user) {
      const errormsg = req.flash('errormsg');
      const successmsg = req.flash('successmsg');
      res.render("userProfile", { user, errormsg, successmsg });
     
    } else {
      console.log("User not found");
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

  
  const loadEditProfile= async (req, res) => {
    try {
     
      const id=req.query.id
    
      const userData = await User.findById(id); 
      if (userData) {
        const errormsg = req.flash('errormsg');
        const successmsg = req.flash('successmsg');
        res.render("editProfile", { user: userData, errormsg, successmsg });
        
        
      }else{
        console.log("user not found")
      }
  
    } catch (error) {
      console.log(error.message);
      
    }
  };
  
  const updateProfile = async (req, res) => {
    try {
     
      const { user_id, name } = req.body;
  
      // Correct the usage of findByIdAndUpdate
      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        { $set: { name: name } },
        { new: true } // Option to return the updated document
      );
  
      if (updatedUser) {
       
        req.flash('successmsg', 'Name changed successfully');
        // Redirect to the user profile page with the user_id as a query parameter
        res.redirect(`/userProfile?id=${user_id}`);
      } else {
        req.flash('errormsg', 'Name changing failed');
        console.log("User not found");
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };

  const changePasswordLoad = async (req, res) => {
    try {
      const user_id = req.query.id; // Retrieve user_id from query parameters
      const userData = await User.findById(user_id);
      if (!userData) {
        req.flash('errormsg', 'User not found');
        return res.redirect('/someErrorPage'); // Redirect if user not found, or handle accordingly
      }
      const errormsg = req.flash('errormsg');
      const successmsg = req.flash('successmsg');
      res.render("changePassword", { user: userData, errormsg, successmsg });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
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





const changepassword = async (req, res) => {
  try {
    const { user_id, oldPassword, newPassword, confirmPassword } = req.body;

    // Fetch the user from the database
    const user = await User.findById(user_id);
    if (!user) {
      req.flash('errormsg', 'User not found');
      return res.redirect(`/ChangePassword?id=${user_id}`);
    }

    // Compare oldPassword with the hashed password stored in the database
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      req.flash('errormsg', 'Old password is incorrect');
      return res.redirect(`/ChangePassword?id=${user_id}`);
    }

    // Validate the new password and confirmation
    if (newPassword !== confirmPassword) {
      req.flash('errormsg', 'New password and confirm password do not match');
      return res.redirect(`/ChangePassword?id=${user_id}`);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    req.flash('successmsg', 'Password changed successfully');
    res.redirect( `/userProfile?id=${user_id}`); // Redirect to a success page or the profile page
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const   loadUserAdress= async (req, res) => {
  try {
      
        const user = req.session.user;     
        const addressData = await Address.findOne({userId:user})
        res.render("userAddress", { user,addressData});
    

  } catch (error) {
    console.log(error.message);
    
  }
};

const   loadAddAddress= async (req, res) => {
  try {
      res.render("userAddAddress", { user: req.session.user });

  } catch (error) {
    console.log(error.message);
    
  }
};
 

const addNewAddress = async (req, res) => {
  try {
    const userid = req.session.user;
    const { name, city, district, state, country, mobile, pincode, home_address } = req.body;
    if (!name || !home_address || !city || !district || !state || !country || !mobile || !pincode) {
      return res.status(400).send("All fields are required");
    }
    const address = await Address.findOne({ userId: userid });

    if (address) {
      address.address.push({
        name: name,
        home_address: home_address,
        city: city,
        district: district,
        state: state,
        country: country,
        mobile: mobile,
        pincode: pincode
      });
      await address.save();
      res.redirect('/Address');
    } else {
      const newAddress = new Address({
        userId: userid,
        address: [{
          name: name,
          home_address: home_address,
          city: city,
          district: district,
          state: state,
          country: country,
          mobile: mobile,
          pincode: pincode
        }]
      });
      await newAddress.save();
      res.redirect('/Address');
    }
  } catch (error) {
    console.log(error.message);
   
  }
};

const loadOrderHistory = async (req, res) => {
  try {
    const user = req.session.user;
    const orders = await Order.find({ userId: user })
      .populate('items.productId')
      .populate('items.categoryId')
      .populate('userId');

    console.log(orders); 

    res.render("orderPage", { user, orders });
  } catch (error) {
    console.log(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
    
    const user = req.session.user; 
    const addressId = req.query.id;    
    const addressData = await Address.findOne({ userId: user });
    const address = addressData.address.find(addr => addr._id.toString() === addressId);
    // console.log("this is the address we want to edit :=", address);
    res.render('editAddress', { user, address });
  } catch (error) {
    console.log(error.message);
  }
};
const updateAddress = async (req, res) => {
  try {
  
    const user = req.session.user;
    const addressId = req.body.address_id; 

    const { name, country, state, district, pincode, mobile, home_address, city } = req.body;

    // Find the document that contains the address array
    const addressData = await Address.findOne({ userId: user });

    // Update the specific address within the array
    await Address.updateOne(
      { userId: user, "address._id": addressId },
      {
        $set: {
          "address.$.name": name,
          "address.$.city": city,
          "address.$.district": district,
          "address.$.state": state,
          "address.$.country": country,
          "address.$.mobile": mobile,
          "address.$.pincode": pincode,
          "address.$.home_address": home_address
        }
      }
    );

    res.redirect(`/Address`);
  } catch (error) {
    console.log(error.message);
    res.redirect(`/userProfile?id=${user._id}`); // Add redirection or error handling as needed
  }
};

const deleteAddress = async (req, res) => {
  try {
    console.log("helllllll");
    
    const user = req.session.user; 
    const addressId = req.query.id;    

    // Update the specific address within the array
    await Address.updateOne(
      { userId: user },
      {
        $pull: {
          address: { _id: addressId }
        }
      }
    );
    
    res.redirect(`/Address`);
  } catch (error) {
    console.log(error.message);
  }
};




 
  

module.exports={
    loadUserProfile,
    loadEditProfile,
    updateProfile,
    changePasswordLoad,
    securePassword,
    changepassword,
    loadUserAdress,
    loadAddAddress,
    addNewAddress,
    loadOrderHistory,
    editAddress,
    updateAddress,
    deleteAddress

}