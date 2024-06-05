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
  
      const userData = await User.findOne({ email: email });
  
      if (userData) {
      
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (passwordMatch) {
          if (userData.is_admin===0) {
            res.render("adminLogin", { message: "please verify your mail" });
          } else {
            req.session.user_id = userData._id;
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
      const userData = await User.findById({ _id: req.session.user_id });
      res.render("adminIndex", { admin: userData });
    } catch (error) {
      console.log(error.message);
    }

  };
  
 
   
  const loadUsers= async (req, res) => {
    try {
      const userData = await User.find({is_admin: 0 });
      res.render("page_users",{ users: userData })

    }catch (error) {
      console.log(error.message);
    }
  }

  const deleteUser = async (req, res) => {
    try {
      console.log("deleeeeteeeeeeeeeedd")
      const id = req.query.id;
      await User.deleteOne({ _id: id });

      res.redirect("/admin/home");
    } catch (error) {
      console.log(error.message);
    }
  };


const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, { is_blocked: true });

    if (userData) {
      console.log("User blocked successfully");
      res.status(200).send({ message: "User blocked successfully" });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findByIdAndUpdate(id, { is_blocked: false });

    if (userData) {
      console.log("User unblocked successfully");
      res.status(200).send({ message: "User unblocked successfully" });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: error.message });
  }
};

const loadCategories= async (req, res) => {
  try {
    const catogeries=await Category.find()
    res.render("page_categories",{catogeries})

  }catch (error) {
    console.log(error.message);
  }
}


const loadAddProduct= async (req, res) => {
  try {
const categories = await Category.find();

res.render("page_add_products" , {categories: categories} )

  }catch (error) {
    console.log(error.message);
  }
}


//.......................................
const createCatogery=async (req, res) => {
  try {
  //  const { name,Description,sub_category} =req.body;
    // const name = req.body.name.trim();
    // const Description = req.body.Description.trim();
    // const sub_category = req.body.sub_category.trim();
    const {name , Description,  categ}= req.body;

    const existCategory =await Category.find({
      $and: [
        {name:name}, 
        {categ:categ } 
      ]
    });
    if(existCategory.length > 0) {
      console.log("existing foundd");
       res.redirect('/admin/page_Categories')
      
    }else{

    
    const catogeries = new Category({
      name: req.body.name,
      Description:req.body.Description,
      categ:req.body.categ 
    
    });
   const categoryData=await catogeries.save();
   console.log(categoryData)
   res.redirect("/admin/page_Categories")
  }
    

  }catch (error) {
    console.log(error.message);
  }
} 


const catogeryLoad= async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('page_categories', { catogeries: categories });
  } catch (error) {
    console.error('Error:', error);
    // Ha ndle error appropriately
  } 
};

const editCategoryLoad = async (req, res) => {
  try {
    const id = req.query.id; // Retrieve _id from query parameters
    const categoryData = await Category.findById(id); // Use id directly, not {_id: id}
    if (categoryData) {
      console.log("Category found:", categoryData);
      const categories = await Category.find();
      res.render('edit_categories', { category: categoryData });
    } else {
      console.log("Category not found");
    }
 
  } catch (error) {
    console.error('Error:', error);
    // Handle error appropriately
    res.status(500).send('Internal Server Error');
  }
}

const updateCategory = async (req, res) => {
  try {
    const {name , Description,  categ ,category_id}= req.body;

   
    const exist =await Category.find({
      $and: [
        {name:name}, 
        {categ:categ } 
      ]
    });
    if(exist.length > 0) {
      console.log("existing foundd , the category has alredy been declared ");
       res.redirect('/admin/page_Categories')
      
    }else{

      const Updatecat=await Category.findByIdAndUpdate
      ({_id:category_id},
        {$set:{name: name,
               Description:Description, 
               categ:categ}})
      res.redirect("/admin/page_Categories")
    }

      }catch (error) {
       console.log(error.message);
     }
}


const deleteCategory = async (req, res) => {
  try {
    
      
        const id = req.query.id;
        console.log(id)
        await Category.deleteOne({ _id: id });
  
        res.redirect("/admin/page_Categories")
    
       }catch (error) {
      console.log(error.message);
    }
}


const AddProductTo = async (req, res) => {
  try {
    
    
    const { tax_rate, stock, price, product_name, Full_description, category, sub_category } = req.body;
    const uploadedImageName = req.files.mainimage? req.files.mainimage[0].filename : '';
    const uploadedSub_images1 = req.files.sub_images1? req.files.sub_images1[0].filename : '';
    const uploadedSub_images2= req.files.sub_images2? req.files.sub_images2[0].filename : '';

   
    
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).send('Category not found');
    }

    const products = new Products({
      name: product_name,
      price: price,
      Description: Full_description,
      category: categoryDoc._id, // Use the ObjectId here
      sub_category: sub_category,
      Stock: stock,
      tax_rate: tax_rate,
      mainimage: uploadedImageName,
      sub_images1: uploadedSub_images1,
      sub_images2: uploadedSub_images2
    });

    const productsData = await products.save();
    console.log(`product is ${productsData}`);
    res.redirect("/admin/products_list");
  
  } catch (error) {
    console.error('Error:', error);
    // Handle error appropriately
  } 
};






// };
const loadProductList = async (req, res) => {
  try {
    const products = await Products.find().populate('category');
    const categories = await Category.find();
    res.render('product_list', { product: products, categories: categories });
  } catch (error) {
    console.error('Error:', error);
    // Handle error appropriately
  } 
};


const deleteProduct = async (req, res) => {
  try {
    
      
        const id = req.query.id;
        console.log(id)
        await Products.deleteOne({ _id: id });
  
        res.redirect("/admin/products_list");
    
       }catch (error) {
      console.log(error.message);
    }
}
const editProductLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Products.findById(id).populate('category');
    const categorydata = await Category.find();
    if (ProductData) {
      console.log("Products found:", ProductData);
      res.render('edit_product', { Product: ProductData, categorydata });
    } else {
      console.log("Products not found");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
 
const updateProduct = async (req, res) => {
  try {
    // Destructure the required fields from req.body
    const { tax_rate, stock, price, product_name, Full_description, category, sub_category, product_id } = req.body;
    // Check if product_id is undefined
    if (!product_id) {
      throw new Error("Product ID is missing in the request body");
    }
    // Handle file uploads
    // const uploadedImageName = req.files.mainimage ? req.files.mainimage[0].filename : '';
    // const uploadedSub_images1 = req.files.sub_images1 ? req.files.sub_images1[0].filename : '';
    // const uploadedSub_images2 = req.files.sub_images2 ? req.files.sub_images2[0].filename : '';
    // Update the product
    const updateProducts = await Products.findByIdAndUpdate(
      product_id,  // Use the product_id directly
      {
        $set: {
          name: product_name,
          price: price,
          Description: Full_description,
          category: category, // Assuming category is already an ObjectId
          sub_category: sub_category,
          Stock: stock,
          tax_rate: tax_rate,
          // mainimage: uploadedImageName,
          // sub_images1: uploadedSub_images1,
          // sub_images2: uploadedSub_images2
        }
      },
      { new: true } // Return the updated document
    );

    res.redirect("/admin/products_list");

  } catch (error) {
    console.error('Error:', error.message);
    // Send an appropriate error response to the client
    res.status(500).send({ error: error.message });
  }
};




  
  


module.exports = {
    adminLoadLogin,
    verifyAdminLogin,
    loadAdminHome,
    loadCategories,
    loadUsers,
    deleteUser,
    blockUser,
    unblockUser,
    loadAddProduct,
    createCatogery,
    catogeryLoad,
    AddProductTo,
    editCategoryLoad,
    updateCategory,
    deleteCategory,
    loadProductList,
    deleteProduct,
    editProductLoad,
     updateProduct

}