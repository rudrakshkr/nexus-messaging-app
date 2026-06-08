const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {body, validationResult, matchedData} = require("express-validator");
require("dotenv").config({path: ".env"});
const prisma = require("../lib/prisma.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

async function roomsGet(req, res, next) {
    try {
        const userId = parseInt(req.user.id);

        const getRooms = await prisma.room.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId
                    }
                }
            },

            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullname: true,
                                email: true,
                                avatar: true,
                            }
                        }
                    }
                },

                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        const formattedRooms = getRooms.map(room => {
            const myParticipantInfo = room.participants.find(p => p.userId === userId);
            
            return {
                ...room,
                unreadCount: myParticipantInfo ? myParticipantInfo.unreadCount : 0
            };
        });

        formattedRooms.sort((a, b) => {
            const dateA = a.messages.length > 0 ? new Date(a.messages[0].createdAt) : new Date(a.createdAt);
            const dateB = b.messages.length > 0 ? new Date(b.messages[0].createdAt) : new Date(b.createdAt);
            
            return dateB - dateA; 
        });

        return res.status(200).json({rooms: formattedRooms});

    } catch(err) {
        console.error("Prisma Error: ", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function roomIdGet(req, res, next) {
    try {
        const myUserId = parseInt(req.user.id);
        const roomId = parseInt(req.params.roomId);

        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;

        const participant = await prisma.roomParticipant.findFirst({
            where: { 
                roomId: roomId, 
                userId: myUserId 
            }
        })

        if (!participant) {
            return res.status(403).json({ message: "Not authorized to view this room." });
        }

        const messages = await prisma.message.findMany({
            where: {
                roomId: roomId
            },
            take: 50,
            ...(cursor && {
                skip: 1,
                cursor: {
                    id: cursor
                }
            }),
            orderBy: {
                createdAt: 'desc'
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
        })

        const formattedMessages = messages.reverse().map(msg => ({
            id: msg.id,
            text: msg.text,
            imageUrl: msg.imageUrl,
            type: msg.type,
            roomId: roomId,
            senderEmail: msg.sender.email,
            fullname: msg.sender.fullname,
            avatar: msg.sender.avatar,
            time: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }),
            date: msg.createdAt
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

async function editProfile(req, res, next) {
    try {
        const myUserId = parseInt(req.user.id);
        const {fullname, email} = req.body;
        const uploadedUrl = req.file?.path;

        if(email) {
            const existingUser = await prisma.users.findUnique({
                where: {email: email}
            })

            if(existingUser && existingUser.id !== myUserId) {
                return res.status(400).json({ message: "This email is already in use by another account." });
            }
        }

        const updateData = {};
        if(fullname) updateData.fullname = fullname;
        if(email) updateData.email = email;
        if(uploadedUrl) updateData.avatar = uploadedUrl;

        const updatedUser = await prisma.users.update({
            where: {
                id: myUserId
            },
            data: updateData,
            select: {
                id: true,
                fullname: true,
                email: true,
                avatar: true
            }
        })

        const userRooms = await prisma.roomParticipant.findMany({
            where: { userId: myUserId },
            select: { roomId: true }
        });

        const io = req.app.get("io");
        if (io) {
            userRooms.forEach(room => {
                io.to(`room_${room.roomId}`).emit("userProfileUpdated", updatedUser);
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                avatar: updatedUser.avatar
            }
        });
    }
    catch(err) {
        console.error("Couldn't edit profile", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateGroupAvatar(req, res, next) {
    try {
        const {roomId} = req.body;
        if(!req.file) {
            return res.status(400).json({message: "No file uploaded"});
        }

        await prisma.room.update({
            where: {
                id: parseInt(roomId)
            },
            data: {
                avatar: req.file.path
            }
        })

        const savedMessage = await prisma.message.create({
            data: {
                text: `Group avatar was changed.`,
                type: 'SYSTEM',
                roomId: parseInt(roomId),
                senderId: req.user.id
            }
        });

        const formattedMessage = {
            id: savedMessage.id,
            text: savedMessage.text,
            type: savedMessage.type,
            roomId: savedMessage.roomId,
            time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }),
            date: savedMessage.createdAt
        };

        const io = req.app.get("io");
        if(io) {
            io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);
            io.to(`room_${roomId}`).emit("groupAvatarUpdated", {
                roomId: parseInt(roomId),
                avatar: req.file.path
            });
        }
        
        const uploadedUrl = req.file.path;

        return res.status(200).json({imageUrl: uploadedUrl});

    } catch(err) {
        console.error("Couldn't edit group avatar", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateGroupName(req, res, next) {
    try {
        const {roomId, subject} = req.body;

        await prisma.room.update({
            where: {
                id: parseInt(roomId)
            },
            data: {
                subject: subject
            }
        })

        const savedMessage = await prisma.message.create({
            data: {
                text: `Group name updated to "${subject}"`,
                type: 'SYSTEM',
                roomId: roomId,
                senderId: req.user.id
            }
        });

        const formattedMessage = {
            id: savedMessage.id,
            text: savedMessage.text,
            type: savedMessage.type,
            roomId: savedMessage.roomId,
            time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }),
            date: savedMessage.createdAt
        };

        const io = req.app.get("io");
        if(io) {
            io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);
            io.to(`room_${roomId}`).emit("groupNameUpdated", {
                roomId: parseInt(roomId),
                subject: subject
            });
        }

        return res.status(200).json({ 
            message: "Group name updated successfully"
        });
    } catch(err) {
        console.error("Couldn't edit group name", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateGroupAdmin(req, res, next) {
    try {
        const {roomId, userId, role} = req.body;

        if (!roomId || !userId || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        await prisma.roomParticipant.updateMany({
            where: {
                userId: userId,
                roomId: parseInt(roomId)
            },
            data: {
                role: role
            }
        })

        const targetUser = await prisma.users.findUnique({
            where: {
                id: userId
            },
            select: {
                fullname: true
            }
        });

        const actionText = role === "ADMIN"
            ? `${targetUser.fullname} was promoted to Admin.` 
            : `${targetUser.fullname} is no longer an Admin.`;

        const savedMessage = await prisma.message.create({
            data: {
                text: actionText,
                type: 'SYSTEM',
                roomId: roomId,
                senderId: req.user.id
            }
        });

        const formattedMessage = {
            id: savedMessage.id,
            text: savedMessage.text,
            type: savedMessage.type,
            roomId: savedMessage.roomId,
            time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }),
            date: savedMessage.createdAt
        };

        const io = req.app.get("io");
        if(io) {
            io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);
            io.to(`room_${roomId}`).emit("roleUpdated", {
                userId: userId,
                newRole: role
            });
        }

        return res.status(200).json({
            message: "Role updated successfully"
        })
    } catch(err) {
        console.error("Couldn't update role", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function markRoomAsRead(req, res) {
    const { roomId } = req.body;
    const userId = req.user.id;

    await prisma.roomParticipant.updateMany({
        where: { roomId: parseInt(roomId), userId: userId },
        data: { unreadCount: 0 }
    });

    return res.status(200).json({ success: true });
}

async function groupUserKick(req, res, next) {
    try {
        const {roomId, userId} = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const kickedUser = await prisma.users.findUnique({
            where: {
                id: userId
            },
            select: {
                fullname: true
            }
        });

        await prisma.roomParticipant.deleteMany({
            where: {
                userId: userId,
                roomId: parseInt(roomId)
            }
        })

        const savedMessage = await prisma.message.create({
            data: {
                text: `${kickedUser.fullname} was removed from the group.`,
                type: 'SYSTEM',
                roomId: parseInt(roomId),
                senderId: req.user.id
            }
        });

        const formattedMessage = {
            id: savedMessage.id,
            text: savedMessage.text,
            type: savedMessage.type,
            roomId: savedMessage.roomId,
            time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }),
            date: savedMessage.createdAt
        };

        const io = req.app.get("io");
        if(io) {
            io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);
            io.to(`user_${userId}`).emit("kickedFromGroup", {roomId});

            io.to(`room_${roomId}`).emit("participantRemoved", { 
                roomId: parseInt(roomId), 
                userId: parseInt(userId) 
            });
        }

        return res.status(200).json({
            message: "User removed successfully"
        })
    } catch(err) {
        console.error("Couldn't update role", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function groupUserAdd(req, res, next) {
    try {
        const {participantIds, roomId} = req.body;
        const userId = req.user.id;

        if(!participantIds || participantIds.length === 0) {
            return res.status(400).json({message: "No participants selected"});
        }

        const parsedParticipantIds = participantIds.map(id => parseInt(id));
        const addedUsers = await prisma.users.findMany({
            where: {
                id: {
                    in: parsedParticipantIds
                }
            },
            select: {
                fullname: true
            }
        });
        const addedNames = addedUsers.map(u => u.fullname).join(", ");

        const room = await prisma.room.update({
            where: {
                id: parseInt(roomId)
            },
            data: {
                participants: {
                    create: parsedParticipantIds.map((id) => ({
                        userId: id,
                        role: "MEMBER"
                    }))
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullname: true,
                                email: true,
                                avatar: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        // Create system message in database
        const savedMessage = await prisma.message.create({
            data: {
                text: `${addedNames} joined the group.`,
                type: 'SYSTEM',
                roomId: parseInt(roomId),
                senderId: userId
            }
        })

        const formattedMessage = {
            id: savedMessage.id,
            text: savedMessage.text,
            type: savedMessage.type,
            roomId: savedMessage.roomId,
            time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }),
            date: savedMessage.createdAt
        };

        const io = req.app.get("io");
        if(io) {
            io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);

            parsedParticipantIds.forEach(id => {
                io.to(`user_${id}`).emit("addedToGroup", {
                    roomId: roomId,
                    message: formattedMessage,
                    roomData: room
                })
            })
        }

        return res.status(201).json({ room: room, isNew: false });
    } catch(err) {
        console.error("Couldn't add members", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function leaveRoom(req, res, next) {
    try {
        const { roomId } = req.body;
        const userId = req.user.id;

        if (!roomId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const room = await prisma.room.findUnique({
            where: { id: parseInt(roomId) },
            select: { type: true }
        });

        if (!room) return res.status(404).json({ message: "Room not found" });

        const io = req.app.get("io");

        // 2. DIRECT CHAT LOGIC: Delete the entire room
        if (room.type === 'DIRECT') {
            await prisma.room.delete({
                where: { id: parseInt(roomId) }
            });

            if (io) {
                io.to(`room_${roomId}`).emit("kickedFromGroup", { roomId: parseInt(roomId) });
            }

            return res.status(200).json({ message: "Chat permanently deleted" });
        } 
        
        // 3. GROUP CHAT LOGIC: Just remove the user
        else {
            const leavingUser = await prisma.users.findUnique({
                where: { id: userId },
                select: { fullname: true }
            });

            await prisma.roomParticipant.deleteMany({
                where: {
                    userId: userId,
                    roomId: parseInt(roomId)
                }
            });

            const savedMessage = await prisma.message.create({
                data: {
                    text: `${leavingUser.fullname} left the chat.`,
                    type: 'SYSTEM',
                    roomId: parseInt(roomId),
                    senderId: userId
                }
            });

            const formattedMessage = {
                id: savedMessage.id,
                text: savedMessage.text,
                type: savedMessage.type,
                roomId: savedMessage.roomId,
                time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', minute: '2-digit', hour12: true 
                }),
                date: savedMessage.createdAt
            };

            if(io) {
                io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);
                
                io.to(`user_${userId}`).emit("kickedFromGroup", { roomId: parseInt(roomId) });
                
                io.to(`room_${roomId}`).emit("participantRemoved", { 
                    roomId: parseInt(roomId), 
                    userId: parseInt(userId) 
                });
            }

            return res.status(200).json({ message: "Left room successfully" });
        }

    } catch(err) {
        console.error("Couldn't leave room", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function deleteRoom(req, res, next) {
    try {
        const { roomId } = req.body;
        const userId = req.user.id;

        if (!roomId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const participant = await prisma.roomParticipant.findFirst({
            where: { 
                userId: userId, 
                roomId: parseInt(roomId) 
            }
        });

        if (!participant || participant.role !== 'ADMIN') {
            return res.status(403).json({ message: "Only admins can delete this group." });
        }

        await prisma.room.delete({
            where: { id: parseInt(roomId) }
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`room_${roomId}`).emit("kickedFromGroup", { roomId: parseInt(roomId) });
        }

        return res.status(200).json({ message: "Group deleted successfully" });

    } catch(err) {
        console.error("Couldn't delete room", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function createRoom(req, res, next) {
    try {
        const myUserId = parseInt(req.user.id);
        const { participantIds, isGroup, subject } = req.body;

        if (!participantIds || participantIds.length === 0) {
            return res.status(400).json({ message: "No participants selected." });
        }

        const allUserIds = [...new Set([myUserId, ...participantIds])];

        if (!isGroup && allUserIds.length === 2) {
            const otherUserId = allUserIds.find(id => id !== myUserId);

            const existingDirectRoom = await prisma.room.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: [
                        { participants: { some: { userId: myUserId } } },
                        { participants: { some: { userId: otherUserId } } }
                    ]
                },
                include: {
                    participants: { include: { user: { select: { id: true, fullname: true, email: true, avatar: true } } } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });

            if (existingDirectRoom) {
                return res.status(200).json({ room: existingDirectRoom, isNew: false });
            }
        }

        const newRoom = await prisma.room.create({
            data: {
                type: isGroup ? 'GROUP' : 'DIRECT',
                subject: isGroup ? subject : null,
                participants: {
                    create: allUserIds.map((id) => ({
                        userId: id,
                        role: (isGroup && id === myUserId) ? 'ADMIN' : 'MEMBER' 
                    }))
                }
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, fullname: true, email: true, avatar: true } }
                    }
                },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        const io = req.app.get("io");
        if (io) {
            participantIds.forEach(id => {
                io.to(`user_${id}`).emit("addedToGroup", {
                    roomId: newRoom.id,
                    roomData: newRoom
                });
            });
        }

        return res.status(201).json({ room: newRoom, isNew: true });

    } catch (err) {
        console.error("Couldn't create room", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function generativeIntelligence(req, res, next) {
    try {
        const {roomId} = req.params;

        const recentMessages = await prisma.message.findMany({
            where: {
                roomId: parseInt(roomId),
                type: 'USER'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100,
            include: {
                sender: {
                    select: {
                        fullname: true
                    }
                }
            }
        });

        if(recentMessages.length === 0) {
            return res.status(200).json({summary: "Not enough messages to analyze", tasks: [], links: []});
        }

        const transcript = recentMessages.reverse()
            .map(msg => `${msg.sender.fullname}: ${msg.text}`)
            .join('\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({model: "gemini-3.1-flash-lite"});
        
        const today = new Date().toISOString();

        const systemPrompt = `
            Analyze the following chat transcript and extract key information. 
            Today's current date and time in ISO format is: ${today}. Use this to calculate relative dates like "tomorrow" or "next week".
            
            You MUST respond ONLY with a valid JSON object matching this exact structure:
            {
                "summary": "A 2-3 sentence summary of the conversation.",
                "tasks": [
                    { 
                        "title": "Task description", 
                        "dueDate": "Friendly extracted date (e.g., 'Tomorrow', 'Oct 12') or 'No date'",
                        "isoDate": "An exact Google Calendar format string (YYYYMMDDTHHMMSSZ) based on the due date. If there is no specific time, default to 090000Z. If there is 'No date', make this null."
                    }
                ],
                "links": [
                    { "title": "Context of the link", "url": "https://..." }
                ]
            }
            
            Transcript:
            ${transcript}
        `;

        const result = await model.generateContent(systemPrompt);
        
        const responseText = result.response.text();

        const cleanString = responseText.replace(/```json/g, '').replace(/'''/g, '').trim();

        const parsedData = JSON.parse(cleanString);

        return res.status(200).json(parsedData);

    } catch(err) {
        console.error("Failed to generate intelligence:", err);
        return res.status(500).json({ message: "Failed to analyze chat." });
    }
}

async function magicCompose(req, res, next) {
    try {
        const {text, tone} = req.body;

        if(!text || text.trim() === "") {
            return res.status(400).json({ message: "No text provided to rewrite." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({model: "gemini-3.1-flash-lite"});

        const prompt = `
            You are an expert copywriter built into a chat application. 
            Rewrite the following text using a "${tone}" tone.
            Rules:
            1. Respond ONLY with the rewritten text.
            2. Do not use quotes around the text.
            3. Do not include any conversational filler.
            
            Original Text:
            ${text}
        `;

        const result = await model.generateContent(prompt);
        const rewrittenText = result.response.text().trim();

        return res.status(200).json({rewrittenText});
    } catch(err) {
        console.error("Magic Compose Error:", err);
        return res.status(500).json({ message: "Failed to rewrite text" });
    }
}

module.exports = {
    logInPost,
    verifyToken,
    signUpPagePost,
    roomIdGet,
    roomsGet,
    uploadImage,
    createRoom,
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
    usersGet
}