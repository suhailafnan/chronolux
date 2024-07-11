const express = require("express");
const admin_route = express();
const session = require("express-session");
const config = require("../config/config");
const nocache = require("nocache");
const auth = require("../middleware/adminAuth");
const adminController = require("../controller/adminController")
const flash=require("express-flash");
const path=require("path")
const adminOrderController = require("../controller/adminOrderController")
const offerController = require("../controller/offerController")
const categoryController = require("../controller/categoryController")
const productController = require("../controller/productController")
admin_route.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

admin_route.use(nocache());
admin_route.use(flash());



const productMulter=require("../middleware/multerController")


admin_route.get("/",adminController.adminLoadLogin);
admin_route.post("/", adminController.verifyAdminLogin);
admin_route.get("/home",auth.isLogin,adminController.loadAdminHome);

admin_route.get("/page_users",auth.isLogin,adminController.loadUsers);
admin_route.get("/delete-user", adminController.deleteUser);
admin_route.post("/block-user", adminController.blockUser);
admin_route.post("/Unblock-user", adminController.unblockUser);

admin_route.get("/page_Categories",categoryController.loadCategories);
admin_route.post("/createCatogery", categoryController.createCatogery);
admin_route.get("/edit_category", categoryController.editCategoryLoad);
admin_route.post("/updateCatogery", categoryController.updateCategory);
admin_route.get("/delete_category", categoryController.deleteCategory);



admin_route.get("/page_product",productController.loadAddProduct);
admin_route.post("/add_product", productMulter, productController.AddProductTo);
admin_route.get("/products_list",productController.loadProductList);
admin_route.get("/edit_Product", productController.editProductLoad);
admin_route.post("/update_product", productMulter,productController.updateProduct); 
admin_route.get("/delete_Product", productController.deleteProduct);


admin_route.get("/orderDetails",adminOrderController.loadorderDetails);
admin_route.get('/orderViewPage', adminOrderController.loadorderViewPage);
admin_route.post('/updateOrderStatus', adminOrderController.updateOrderStatus);

// offersssssssss

admin_route.get('/Offer', offerController.loadOfferPage);
admin_route.get('/addOfferPage', offerController.loadOfferAddingPage);
admin_route.post('/addOffer', offerController.addOffer);
admin_route.get('/CategoryOffer', offerController.loadCategoryOfferPage);
admin_route.get('/addcategoryOfferPage', offerController.loadCategoryOfferAddingPage);
admin_route.post('/addCategoryOffer', offerController.addCategoryOffer);
admin_route.get('/deleteCategoryOffer', offerController.deleteCategoryOffer);

admin_route.get('/deleteProductOffer', offerController.deleteProductOffer);

module.exports = admin_route;