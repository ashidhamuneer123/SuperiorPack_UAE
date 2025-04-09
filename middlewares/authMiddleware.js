export const adminAuth = (req, res, next) => {
    if (req.session && req.session.admin) {
      return next();
    }
    return res.redirect("/admin/login");
  };


  export const userAuth = (req, res, next) => {
    if (req.session && req.session.user) {
      next(); 
    } else {
      res.redirect('/login');
    }
  };
  
  