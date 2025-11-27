"use client";

import axios from "axios";
import { useRef } from "react"
import { BACKEND_URL } from "../../config";
import { useRouter } from "next/navigation";

export default function SignUp(){

    const emailRef = useRef<HTMLInputElement | null>(null);
    const passRef = useRef<HTMLInputElement | null>(null);
    const fnameRef = useRef<HTMLInputElement | null>(null);
    const lnameRef = useRef<HTMLInputElement | null>(null);

    const router = useRouter()

    async function Submit(){
        const email = emailRef.current?.value
        const password = passRef.current?.value
        const lname = lnameRef.current?.value
        const fname = fnameRef.current?.value

        await axios.post(`${BACKEND_URL}/signup`,{
            email: email,
            password: password,
            firstName: fname,
            lastName: lname
        })

        router.push("/auth/signin")
    }


    return <div>
        <input ref={emailRef} type="text" placeholder="Email" />
        <input ref={passRef} type="password" placeholder="Password" />
        <input ref={fnameRef} type="text" placeholder="FirstName" />
        <input ref={lnameRef} type="text" placeholder="LastName" />

        <button onClick={Submit}>Submit</button>
    </div>
}