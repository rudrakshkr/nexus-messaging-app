const {Router} = require("express");
const indexRouter = Router();
const {
    logInPost,
    verifyToken, 
    signUpPagePost,
    logout,
} = require("../controllers/indexController");

// --------------------------------------- ROUTES -------------------------------------------------------

// Public Routes
indexRouter.post('/api/login', logInPost);
indexRouter.post('/api/sign-up', signUpPagePost);
indexRouter.get('/api/logout', logout);

module.exports = indexRouter;