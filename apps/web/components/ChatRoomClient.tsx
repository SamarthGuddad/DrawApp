"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient(
    {
        messages,
        id
    }:
    {
        messages: {message: string}[],
        id: string
    }
){
    const currentmsgRef = useRef<HTMLInputElement | null>(null)
    const {socket,loading} = useSocket();
    const [chats,setChats] = useState(messages)

    useEffect(() => {
        if(socket && !loading){

            socket.send(JSON.stringify({
                type: "join",
                roomId: id
            }))
 
            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data)
                if(parsedData.type === "chat"){
                    setChats(c => [...c,{message: parsedData.message}])
                }
            }
        }
    },[socket,loading,id])

    return <div>
            {chats.map(m =>  <div>{m.message}</div>)}

            <input ref={currentmsgRef} type="text" placeholder="Enter Message"/>
            <button onClick={() => {
                socket?.send(JSON.stringify({
                    type: "chat",
                    roomId: id,
                    message: currentmsgRef.current?.value
                }))

                
            }}>Send Message</button>
    </div>  
}