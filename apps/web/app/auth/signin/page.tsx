"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { BACKEND_URL } from "../../config";

export default function SignIn(){
    const emailRef = useRef<HTMLInputElement | null>(null);
    const passRef = useRef<HTMLInputElement | null>(null);

    const router = useRouter()

    async function Submit(){
        const email = emailRef.current?.value
        const password = passRef.current?.value

        const response = await axios.post(`${BACKEND_URL}/signin`,{
            email: email,
            password: password
        })

        localStorage.setItem("token",response.data.token)

        router.push("/")
    }

    return <div>
        <input ref={emailRef} type="text" placeholder="Email" />
        <input ref={passRef} type="password" placeholder="Password" />
        <button onClick={Submit}>Submit</button>
    </div>
}