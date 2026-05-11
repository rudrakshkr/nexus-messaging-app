const {Router} = require("express");
const indexRouter = Router();
const {
    logInPost,
    verifyToken, 
    signUpPagePost,
    usersGet,
    roomsGet,
    roomIdGet,
    uploadImage,
} = require("../controllers/indexController");

// Upload middleware
const uploadMiddleware = require("../uploadMiddleware");

// Initialise the middleware and pass folder name as argument
const upload = uploadMiddleware("uploads")

// --------------------------------------- ROUTES -------------------------------------------------------

// Public Routes
indexRouter.post('/api/login', logInPost);
indexRouter.post('/api/sign-up', signUpPagePost);

// Protected Routes
indexRouter.get('/api/getUsers', verifyToken, usersGet);
indexRouter.get('/api/getRooms', verifyToken, roomsGet);
indexRouter.get('/api/messages/:roomId', verifyToken, roomIdGet);
indexRouter.post('/api/uploadImage', verifyToken, upload.single('image'), uploadImage);

module.exports = indexRouter;