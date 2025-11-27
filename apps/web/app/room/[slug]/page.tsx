import axios from "axios"
import { BACKEND_URL } from "../../config"
import { ChatRoom } from "../../../components/ChatRoom";

async function getRoom(slug: string){
    const response = await axios.get(`${BACKEND_URL}/room/${slug}`)
    return response.data.roomId;
}

export default async function ChatRoom1({params}: {
    params: {
        slug: string
    }
}){
    const slug = params.slug

    const roomId = String(await getRoom(slug))
    console.log(`${roomId} is the room Id`)
    console.log(typeof roomId)

    return <ChatRoom id={roomId}/>
}