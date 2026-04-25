const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {body, validationResult, matchedData} = require("express-validator");
require("dotenv").config({path: ".env"});
const prisma = require("../lib/prisma.js");

async function logInPost(req, res) {
    try {
        const { username, password } = req.body;
        
        let token = null; 

        if (username && password) {
            const user = await prisma.users.findUnique({
                where: { username: username }
            });

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            let match = await bcrypt.compare(password, user.password);
            
            if (match) {
                token = jwt.sign({ username: user.username, role: user.role }, process.env.SECRET_KEY, { expiresIn: '7d' });
                return res.json({ token, username: user.username, role: user.role });
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
    req.user = { username: null, verified: false };
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(' ')[1];
        
        jwt.verify(bearerToken, process.env.SECRET_KEY, function (err, data) {
            if (err) {
                console.error("JWT Error:", err.message);
                return res.sendStatus(403);
            }
            
            req.user = { username: data.username, role: data.role, verified: true };
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

function logout(req, res) {
    return res.sendStatus(200);
}

module.exports = {
    logInPost,
    verifyToken,
    signUpPagePost,
    logout,
}