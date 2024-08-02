const User = require("../models/UserModel");
const Category =require("../models/category");
const Products =require("../models/products");
const bcrypt = require("bcrypt");


const adminLoadLogin=async (req,res)=>{
    try{
      
        res.render("adminLogin");

    } catch (error) {
    console.log(error.message);
  }
};

const verifyAdminLogin = async (req, res) => {
   
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await User.findOne({ email: email });

    if (adminData) {
    
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch) {
        if (adminData.is_admin===0) {
          res.render("adminLogin", { message: "please verify your mail" });
        } else {
          req.session.user_id = adminData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("adminLogin", {
          message: "Email or password incorrect",
        });
      }
    } else {
      res.render("adminLogin", { message: "Email or password incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAdminHome = async (req, res) => {
  try {
    const adminData = await User.findById({ _id: req.session.user_id });
    const adminId=req.session.user_id
    
    res.render("adminIndex", { admin: adminData ,adminId});
  } catch (error) {
    console.log(error.message);
  }

};
 
   
  const loadUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 
      const skip = (page - 1) * limit; 
  
      const totalUsers = await User.countDocuments({ is_admin: 0 });
      const users = await User.find({ is_admin: 0 }).skip(skip).limit(limit);
      const totalPages = Math.ceil(totalUsers / limit);
      res.render("pageUsers", {
        users: users,
        currentPage: page,
        totalPages: totalPages,
        adminId:req.session.user_id
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  

  const deleteUser = async (req, res) => {
    try {
      
      const id = req.query.id;
      await User.deleteOne({ _id: id });

      res.redirect("/admin/page_users");
    } catch (error) {
      console.log(error.message);
    }
  };


const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, { is_blocked: true }, { new: true });
    if (userData) {
      
      res.status(200).send({ success: true, user: userData });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, { is_blocked: false }, { new: true });
    if (userData) {
    
      res.status(200).send({ success: true, user: userData });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, error: error.message });
  }
};

const adminLogout=async (req,res)=>{
  try{
  req.session.destroy();
  console.log("hello")
  res.redirect("http://localhost:8000/admin")
  
  }catch (error) {
    console.log(error.message);
  }
}
module.exports = {
    adminLoadLogin,
    verifyAdminLogin,
    loadAdminHome,
    loadUsers,
    deleteUser,
    blockUser,
    unblockUser,
    adminLogout

 

}