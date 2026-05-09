const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {body, validationResult, matchedData} = require("express-validator");
require("dotenv").config({path: ".env"});
const prisma = require("../lib/prisma.js");

async function logInPost(req, res) {
    try {
        const { email, password } = req.body;
        
        let token = null; 

        if (email && password) {
            const user = await prisma.users.findUnique({
                where: { email: email }
            });

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            let match = await bcrypt.compare(password, user.password);
            
            if (match) {
                token = jwt.sign({ email: user.email, id: user.id }, process.env.SECRET_KEY, { expiresIn: '7d' });
                return res.json({ 
                    token, 
                    email: 
                    user.email, 
                    id: user.id, 
                    avatar: user.avatar, 
                    fullname: user.fullname
                });
            } else {
                return res.status(401).json({ message: "Invalid password" });
            }
        } else {
            return res.status(400).json({ message: "Username and password are required" });
        }
    } catch(err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

function verifyToken(req, res, next) {
    req.user = { email: null, id: null, verified: false };
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(' ')[1];
        
        jwt.verify(bearerToken, process.env.SECRET_KEY, function (err, data) {
            if (err) {
                console.error("JWT Error:", err.message);
                return res.sendStatus(403);
            }
            
            req.user = { email: data.email, id: data.id, verified: true };
            return next();
        });
    } else {
        return res.sendStatus(403);
    }
}

const validateUser = [
    body("password").trim().isLength({min: 6, max: 25}).withMessage("Password should be atleast 8 characters long"),
    body("email")
    .custom(async (value) => {
        const user = await prisma.users.findUnique({
            where: {
                email: value
            }
        })

        if(user) {
            throw new Error("Email already in use");
        }
    })
]

let signUpPagePost = [
    validateUser,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);

            if(!errors.isEmpty()){
                return res.status(400).json({errors: errors.array()})
            }

            const {password} = matchedData(req);
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.users.createMany({
                data: [
                    {fullname: req.body.fullname, email: req.body.email, password: hashedPassword}
                ]
            })

            return res.json({message: "Nice, you can sign in now!"});
        } catch(err) {
            console.error("SignUp Error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
]

async function usersGet(req, res, next) {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                fullname: true,
                email: true,
                avatar: true
            }
        });
        
        if(!users) {
            return res.json({message: "Couldn't find user!"})
        }

        return res.json({users: users});
    }
    catch(err) {
        console.error("Prisma Error: ", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function messagesGet(req, res, next) {
    try {
        const myUserId = parseInt(req.user.id);
        const receiverId = parseInt(req.params.receiverId);

        const sharedRoom = await prisma.room.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    // Must contain logged in user id
                    {participants: {some: {userId: myUserId } } },
                    // And receiver id
                    {participants: {some: {userId: receiverId } } }
                ]
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        sender: {
                            select: {
                                email: true,
                                fullname: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        })

        if(!sharedRoom) {
            return res.status(200).json([]);
        }

        const formattedMessages = sharedRoom.messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            imageUrl: msg.imageUrl,
            senderEmail: msg.sender.email,
            avatar: msg.sender.avatar,
            time: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            })
        }));

        res.status(200).json(formattedMessages);
    } catch(err) {
        console.error("Error fetching chat history: ", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function uploadImage(req, res, next) {
    try {
        if(!req.file) {
            return res.status(400).json({message: "No file uploaded"});
        }

        const uploadedUrl = req.file.path;

        return res.status(200).json({imageUrl: uploadedUrl});
    } catch(err) {
        console.error("Upload error:", err);
        return res.status(500).json({ message: "File upload failed" });
    }
}

function logout(req, res) {
    return res.sendStatus(200);
}

module.exports = {
    logInPost,
    verifyToken,
    signUpPagePost,
    messagesGet,
    uploadImage,
    logout,
    usersGet
}