import { z } from "zod";

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    firstName: z.string().min(3).max(20),
    lastName: z.string().min(3).max(20)
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
})
