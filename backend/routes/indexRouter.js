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
    editProfile,
    updateGroupAvatar,
    updateGroupName,
    updateGroupAdmin,
    markRoomAsRead,
    groupUserKick,
    groupUserAdd,
    leaveRoom,
    deleteRoom,
    generativeIntelligence,
    magicCompose,
    createRoom,
} = require("../controllers/indexController");

// Upload middleware
const uploadMiddleware = require("../uploadMiddleware");

// Initialise the middleware and pass folder name as argument
const upload = uploadMiddleware("uploads")

// Rate limit AI requests
const rateLimit = require('express-rate-limit');

const magicComposeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        message: "You are doing that too much! Please wait 10 minutes before using Magic Compose again."
    },
    standardHeaders: true,
    legacyHeaders: false
})

const extractTasksLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { 
        message: "You've analyzed a lot of data recently! Please wait 15 minutes to prevent API exhaustion." 
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// --------------------------------------- ROUTES -------------------------------------------------------

// Public Routes
indexRouter.post('/api/login', logInPost);
indexRouter.post('/api/sign-up', signUpPagePost);

// Protected Routes
indexRouter.get('/api/getUsers', verifyToken, usersGet);
indexRouter.get('/api/getRooms', verifyToken, roomsGet);
indexRouter.get('/api/messages/:roomId', verifyToken, roomIdGet);

indexRouter.post('/api/uploadImage', verifyToken, upload.single('image'), uploadImage);
indexRouter.post('/api/editProfile', verifyToken, upload.single('avatar'), editProfile);

indexRouter.put('/api/updateGroupAvatar', verifyToken, upload.single('groupAvatar'), updateGroupAvatar);
indexRouter.put('/api/updateGroupName', verifyToken, updateGroupName);
indexRouter.put('/api/updateGroupAdmin', verifyToken, updateGroupAdmin);
indexRouter.put('/api/markRoomRead', verifyToken, markRoomAsRead);

indexRouter.delete('/api/kickGroupUser', verifyToken, groupUserKick);
indexRouter.delete('/api/leaveRoom', verifyToken, leaveRoom);
indexRouter.delete('/api/deleteRoom', verifyToken, deleteRoom);
indexRouter.post('/api/addGroupUser', verifyToken, groupUserAdd);
indexRouter.post('/api/createRoom', verifyToken, createRoom);

indexRouter.get('/api/intelligence/:roomId', verifyToken, extractTasksLimiter, generativeIntelligence);
indexRouter.post('/api/magicCompose', verifyToken, magicComposeLimiter, magicCompose);

module.exports = indexRouter;