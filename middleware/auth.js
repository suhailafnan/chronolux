// const isLogout = async (req, res, next) => {
//     try {
//       if (req.session.user_id) {
//       } else {
//         res.redirect("/");
//       }
//       next();
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
  
//   const isLogin = async (req, res, next) => {
//     try {
//       if (req.session.user_id) {
//         res.redirect("/home");
//       } else {
//       }
//       next();
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
  
//   module.exports = {
//     isLogin,
//     isLogout
//   };
const isLogout = async (req, res, next) => {
  try {
      if (req.session.user) {
          // User is logged in, redirect them to home
          return res.redirect("/home");
      }
      next();
  } catch (error) {
      console.log(error.message);
      next(error); // Pass the error to the next middleware
  }
};

const isLogin = async (req, res, next) => {
  try {
      if (!req.session.user) {
          // User is not logged in, redirect them to login
          return res.redirect("/");
      }
      next();
  } catch (error) {
      console.log(error.message);
      next(error); // Pass the error to the next middleware
  }
};

module.exports = {
  isLogin,
  isLogout
};