const express = require("express");
const admin_route = express();
const session = require("express-session");
const config = require("../config/config");
const nocache = require("nocache");
const auth = require("../middleware/adminAuth");
const adminController = require("../controller/adminController")
const flash=require("express-flash");
const path=require("path")

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

admin_route.post("/add_product", productMulter, adminController.AddProductTo);




admin_route.get("/",adminController.adminLoadLogin);
admin_route.post("/", adminController.verifyAdminLogin);
admin_route.get("/home",auth.isLogin,adminController.loadAdminHome);

admin_route.get("/page_users",auth.isLogin,adminController.loadUsers);
admin_route.get("/delete-user", adminController.deleteUser);
admin_route.post("/block-user", adminController.blockUser);
admin_route.post("/Unblock-user", adminController.unblockUser);

admin_route.get("/page_Categories",adminController.loadCategories);
admin_route.post("/createCatogery", adminController.createCatogery);
admin_route.get("/createCatogery", adminController.catogeryLoad);


admin_route.get("/page_product",adminController.loadAddProduct);

admin_route.get("/products_list",adminController.loadProductList);



admin_route.get("/edit_category", adminController.editCategoryLoad);
admin_route.post("/updateCatogery", adminController.updateCategory);

admin_route.get("/delete_category", adminController.deleteCategory);


admin_route.get("/delete_Product", adminController.deleteProduct);
admin_route.get("/edit_Product", adminController.editProductLoad);

admin_route.post("/update_product", productMulter,adminController.updateProduct);







// admin_route.get("*", function (req, res) {
//     res.redirect("/admin");
//   });

module.exports = admin_route;