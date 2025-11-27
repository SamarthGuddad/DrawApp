import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from '@repo/db/client';
import dotenv from "dotenv"
dotenv.config({ path: "../../.env" })

const wss = new WebSocketServer({ port: 8080 });

interface User{
  userId: string,
  rooms: string[],
  ws: WebSocket
}

const users: User[] = []; 

function checkUser(token: string): string | null{
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded == "string") {
    return null
  }

  if (!decoded || !decoded.id) {
    return null
  }

  return decoded.id
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  
  const userId = checkUser(token)

  if(!userId){
    ws.close()
    return
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message',async function message(data) {
    const parsedData = JSON.parse(data as unknown as string)

    if(parsedData.type === "join"){
      const user = users.find((usr) => usr.ws === ws)
      user?.rooms.push(parsedData.roomId)
    }

    if(parsedData.type === "leave"){  
      const user = users.find((usr) => usr.ws === ws)
      if(!user){
        return
      }
      user.rooms = user.rooms.filter(x => x !== parsedData.room)
    }

    if(parsedData.type === "chat"){
      const roomId = Number(parsedData.roomId);
      const message = parsedData.message;

      await prismaClient.chat.create({
        data:{
          message: message,
          roomId: roomId,
          userId: userId
        }
      })

      const searchRoomId = String(roomId)

      users.forEach(user => {
        if(user.rooms.includes(String(roomId))){
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            searchRoomId
          }))
        }
      })
    }


  });

});
