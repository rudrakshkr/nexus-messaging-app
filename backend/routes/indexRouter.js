const {Router} = require("express");
const indexRouter = Router();
const {
    logInPost,
    verifyToken, 
    signUpPagePost,
    usersGet,
    messagesGet,
    logout,
} = require("../controllers/indexController");

// --------------------------------------- ROUTES -------------------------------------------------------

// Public Routes
indexRouter.post('/api/login', logInPost);
indexRouter.post('/api/sign-up', signUpPagePost);
indexRouter.get('/api/logout', logout);

// Protected Routes
indexRouter.get('/api/getUsers', verifyToken, usersGet);
indexRouter.get('/api/messages/:receiverId', verifyToken, messagesGet);

module.exports = indexRouter;