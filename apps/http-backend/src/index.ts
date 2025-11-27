import express from "express";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import bcrypt from "bcrypt"
import { middleware } from "./middleware.js";
import { SignupSchema , SigninSchema, CreateRoomSchema} from "@repo/common/types"
import { prismaClient } from "@repo/db/client";
import cors from "cors"

const app = express();
app.use(express.json())

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.post("/signup",async (req,res) => {

    const parsedBody = SignupSchema.safeParse(req.body);

    if(!parsedBody.success){
        res.json({
            message: "Incorrect Format",
            error: parsedBody.error
        })
        return;
    }

    const {email,password,firstName,lastName} = parsedBody.data

    try{
        const existing = await prismaClient.user.findUnique({
            where:{
                email: email
            }
        })

        if(existing){
            res.status(400).json({
                error: "Email already exists"
            })
            return
        }

        const hashedPassword = await bcrypt.hash(password,10)

        const user = await prismaClient.user.create({
            data:{
                email:email,
                password: hashedPassword,
                lastName: lastName,
                firstName: firstName
            }
        })

        res.status(201).json({
            message: "User signed up",
            user: user
        })
    }
    catch(err){
        res.status(501).json({
            error: err
        })
    }
})

app.post("/signin", async (req,res) => {
    const parsedBody = SigninSchema.safeParse(req.body);

    if(!parsedBody.success){
        res.json({
            message: "Incorrect Format",
            error: parsedBody.error
        })
        return;
    }

    const {email,password} = parsedBody.data

    try{
        const user = await prismaClient.user.findUnique({
            where:{
                email: email
            }
        })

        if(!user){
            res.status(404).json({
                error: "User not found"
            })
            return
        }

        const check = await bcrypt.compare(password,user.password)

        if(!check){
            res.status(401).json({
                error: "Incorrect Password"
            })
            return
        }

        const token = jwt.sign({
            id: user.id
        },JWT_SECRET)

        res.json({
            token
        })
    }
    catch(err){
        res.status(501).json({
            error: err
        })
    }
})

app.post("/room",middleware,async (req,res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body)

    if(!parsedData.success){
        res.status(402).json({
            error: "Incorrect Inputs"
        })
        return
    }

    // @ts-ignore: TODO: Fix this
    const userId = req.userId

    
    try{
        const room = await prismaClient.room.create({
            data:{
                adminId: userId,
                slug: parsedData.data!.name
            }
        })

        res.json({
            roomId: room.id
        })
    }
    catch(err){
        res.status(501).json({
            error: err
        })
    }
})

app.get("/chats/:roomId",async (req,res) => {
    const roomId = Number(req.params.roomId)

    try{
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId: roomId
            },
            orderBy:{
                id: "desc"
            },
            take: 50
        })

        res.json({
            messages
        })
    }
    catch(err){
        res.status(501).json({
            error: err
        })
    }
})

app.get("/room/:slug",async (req,res) => {
    const slug = req.params.slug

    try{
        const room = await prismaClient.room.findFirst({
            where:{
                slug:slug
            }
        })

        const roomId = room?.id

        res.json({
            roomId
        })
    }
    catch(err){
        res.status(501).json({
            error: err
        })
    }
})
 

app.listen(3001);
