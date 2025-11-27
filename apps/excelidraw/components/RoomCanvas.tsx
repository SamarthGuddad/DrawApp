"use client";
import { WS_URL } from "@/app/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}){
    const [socket,setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhhY2EyMmU4LTk5MGMtNDEzMy05YjVlLTk2YmFmZDhlMGNhMyIsImlhdCI6MTc2MzkxNzM2N30.tU5UDKbnswUcJ00GiynZyOGXAqH-NvIAgVD6ltOLNG0`)

        ws.onopen = () => {
            setSocket(ws)
            ws.send(JSON.stringify({
                type: "join",
                roomId
            }))
        }
    },[])

    if(!socket){
        return <div>
            Connecting to server.....
        </div>
    }

    return <div>
        <Canvas roomId={roomId} socket={socket}/>
    </div>
}