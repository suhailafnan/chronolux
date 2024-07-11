const User = require("../models/UserModel");
const Category =require("../models/category");
const Products =require("../models/products");

const createCatogery=async (req, res) => {
    try {
      const {name , Description,  categ}= req.body;
  
      const existCategory =await Category.find({
        $and: [
          {name:name}
          
        ]
      });
      if(existCategory.length > 0) {
        console.log("existing foundd");
         res.redirect('/admin/page_Categories')
        
      }else{
  
      
      const catogeries = new Category({
        name: req.body.name,
        Description:req.body.Description
       
      
      });
     const categoryData=await catogeries.save();
     res.redirect("/admin/page_Categories")
    }
      
    }catch (error) {
      console.log(error.message);
    }
  } 
  
  
  const loadCategories = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = 4; 
      const skip = (page - 1) * limit; 
    
      const totalCategories = await Category.countDocuments();
      const categories = await Category.find().skip(skip).limit(limit);
      const totalPages = Math.ceil(totalCategories / limit);
   
      res.render('pageCategories', { 
        catogeries: categories, 
        currentPagess: page,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    } 
  };
  
  
  const editCategoryLoad = async (req, res) => {
    try {
      const id = req.query.id; 
      const categoryData = await Category.findById(id); 
      if (categoryData) {
        const categories = await Category.find();
        res.render('edit_categories', { category: categoryData });
      } else {
        console.log("Category not found");
      }
    } catch (error) {
      console.error('Error:', error);
      
      res.status(500).send('Internal Server Error');
    }
  }
  
  const updateCategory = async (req, res) => {
    try {
      const {name , Description,  categ ,category_id}= req.body;
  
     
      const exist =await Category.find({
        $and: [
          {name:name}
          // , 
          // {categ:categ } 
        ]
      });
      if(exist.length > 0) {
        console.log("existing foundd , the category has alredy been declared ");
         res.redirect('/admin/page_Categories')
        
      }else{
  
        const Updatecat=await Category.findByIdAndUpdate
        ({_id:category_id},
          {$set:{name: name,
                 Description:Description
                //,categ:categ
                }})
        res.redirect("/admin/page_Categories")
      }
  
        }catch (error) {
         console.log(error.message);
       }
  }
  
  const deleteCategory = async (req, res) => {
    try {
      const id = req.query.id;
      await Category.deleteOne({ _id: id });
      await Products.deleteMany({category: id });
  
      res.redirect("/admin/page_Categories");
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal server error');
    }
  };
  

  module.exports={
    createCatogery,
    loadCategories,
    editCategoryLoad,
    updateCategory,
    deleteCategory
  }