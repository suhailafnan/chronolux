const User = require("../models/UserModel");
const Category =require("../models/category");
const Products =require("../models/products");
const bcrypt = require("bcrypt");

const loadAddProduct= async (req, res) => {
    try {
  const categories = await Category.find();
  
  res.render("page_add_products" , {categories: categories} )
  
    }catch (error) {
      console.log(error.message);
    }
  }
  
  
  const AddProductTo = async (req, res) => {
    try { 
      const { tax_rate, stock, price, product_name, Full_description, category
        //  sub_category 
        } = req.body;
      const uploadedImageName = req.files.mainimage? req.files.mainimage[0].filename : '';
      const uploadedSub_images1 = req.files.sub_images1? req.files.sub_images1[0].filename : '';
      const uploadedSub_images2= req.files.sub_images2? req.files.sub_images2[0].filename : '';
  
     
      
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).send('Category not found');
      }
      if(price > 0){
        const products = new Products({
          name: product_name,
          price: price,
          Description: Full_description,
          category: categoryDoc._id, 
          // sub_category: sub_category,
          Stock: stock,
          tax_rate: tax_rate,
          mainimage: uploadedImageName,
          sub_images1: uploadedSub_images1,
          sub_images2: uploadedSub_images2
        });
        const productsData = await products.save();
        // res.status(200).send({ success: true, message: "product added succsessfully"});
       
        res.redirect("/admin/products_list");
      }else{
        console.log("price should be greater than 0")
        res.redirect("/admin/products_list");
        // res.status(200).send({ success: false, message: "price should be greater than 0"});
      }
    
  
     
     
    
    } catch (error) {
      console.error('Error:', error);
    } 
  };
  
  
  
  
  const loadProductList = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = 4; 
      const skip = (page - 1) * limit; 
  
      const totalProducts = await Products.countDocuments();
      const products = await Products.find().populate('category').skip(skip).limit(limit);
      const categories = await Category.find();
      const totalPages = Math.ceil(totalProducts / limit);
  
      res.render('product_list', { 
        product: products, 
        categories: categories,
        currentPage: page,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('Error:', error);
    } 
  };
  
  
  const deleteProduct = async (req, res) => {
    try {
      
        
          const id = req.query.id;
         
          const user=req.session.user
      
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
      const { tax_rate, stock, price, product_name, Full_description, category, product_id } = req.body;
  
      if (!product_id) {
        console.log("Product ID is missing");
        return res.status(400).send({ success: false, message: "Product ID is missing" });
      }
  
      const product = await Products.findById(product_id);
  
      if (!product) {
        console.log("Product not found");
        return res.status(404).send({ success: false, message: "Product not found" });
      }
  
      const uploadedImageName = req.files.mainimage ? req.files.mainimage[0].filename : product.mainimage;
      const uploadedSub_images1 = req.files.sub_images1 ? req.files.sub_images1[0].filename : product.sub_images1;
      const uploadedSub_images2 = req.files.sub_images2 ? req.files.sub_images2[0].filename : product.sub_images2;
  
      if (price > 0) {
        const updateProducts = await Products.findByIdAndUpdate(
          product_id,
          {
            $set: {
              name: product_name,
              price: price,
              Description: Full_description,
              category: category,
              
              Stock: stock,
              tax_rate: tax_rate,
              mainimage: uploadedImageName,
              sub_images1: uploadedSub_images1,
              sub_images2: uploadedSub_images2,
            }
          },
          { new: true }
        );
  
        res.redirect("/admin/products_list");
      } else {
        console.log("Price should be greater than 0");
        res.status(400).send({ success: false, message: "Price should be greater than 0" });
      }
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send({ success: false, message: "Internal Server Error" });
    }
  };

  module.exports={
    loadAddProduct,
    AddProductTo,
    loadProductList,
    deleteProduct,
    editProductLoad,
     updateProduct
  }