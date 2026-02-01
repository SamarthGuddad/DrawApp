import { WebSocket, WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from '@repo/db/client';
import dotenv from "dotenv"

dotenv.config({ path: "../../.env" })

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string,
  rooms: string[],
  ws: WebSocket 
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return null
    }
    if (!decoded || !decoded.id) {
      return null
    }
    return decoded.id
  } catch (error) {
    console.error("Auth error:", error);
    return null
  }
}

wss.on('connection', function connection(ws, request) {
  console.log('New WebSocket connection');
  
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token)

  if (!userId) {
    ws.close()
    return
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  console.log(`User ${userId} connected. Total users: ${users.length}`);

  ws.on('message', async function message(data) {
    try {
      const parsedData = JSON.parse(data as unknown as string)
      console.log('Received message:', parsedData.type);

      if (parsedData.type === "join") {
        const user = users.find((usr) => usr.ws === ws)
        user?.rooms.push(parsedData.roomId)
        console.log(`User joined room ${parsedData.roomId}`);
      }

      if (parsedData.type === "leave") {
        const user = users.find((usr) => usr.ws === ws)
        if (!user) {
          return
        }
        user.rooms = user.rooms.filter(x => x !== parsedData.room)
        console.log(`User left room ${parsedData.room}`);
      }

      if (parsedData.type === "create") {
        const roomId = Number(parsedData.roomId);
        const shape = parsedData.shape;

        console.log('Creating shape in room:', roomId);
        console.log('Shape data:', shape);

        // Fetch current state
        const room = await prismaClient.room.findUnique({
          where: { id: roomId },
          select: { canvasState: true }
        })

        if (!room) {
          console.error('Room not found:', roomId);
          return;
        }

        console.log('Current canvasState:', room.canvasState);
        console.log('Type:', typeof room.canvasState);
        console.log('Is array:', Array.isArray(room.canvasState));

        // Parse current state safely
        let currentState: any[] = [];
        
        if (room.canvasState === null || room.canvasState === undefined) {
          currentState = [];
        } else if (Array.isArray(room.canvasState)) {
          currentState = room.canvasState;
        } else if (typeof room.canvasState === 'object') {
          // Already a JSON object, try to convert
          currentState = Object.values(room.canvasState);
        } else if (typeof room.canvasState === 'string') {
          try {
            const parsed = JSON.parse(room.canvasState);
            currentState = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error('Failed to parse canvasState:', e);
            currentState = [];
          }
        }

        console.log('Parsed currentState:', currentState);

        // Add new shape
        const nextState = [...currentState, shape];
        console.log('Next state:', nextState);

        // Update database
        const updated = await prismaClient.room.update({
          where: { id: roomId },
          data: { canvasState: nextState }
        })

        console.log('Database updated. New canvasState:', updated.canvasState);

        // Broadcast to all users in room
        let broadcastCount = 0;
        users.forEach(user => {
          if (user.rooms.includes(String(roomId))) {
            user.ws.send(JSON.stringify({
              type: "create",
              shape
            }))
            broadcastCount++;
          }
        })
        console.log(`Broadcasted to ${broadcastCount} users`);
      }

      if (parsedData.type === "update") {
        const roomId = Number(parsedData.roomId);
        const shapes = parsedData.shapes;

        console.log('Updating room:', roomId);
        console.log('New shapes:', shapes);

        await prismaClient.room.update({
          where: { id: roomId },
          data: { canvasState: shapes }
        })

        console.log('Database updated with full state');

        users.forEach(user => {
          if (user.rooms.includes(String(roomId))) {
            user.ws.send(JSON.stringify({
              type: "update",
              shapes
            }))
          }
        })
      }

      if (parsedData.type === "delete") {
        const roomId = Number(parsedData.roomId);
        const shapes = parsedData.shapes;

        console.log('Delete operation - room:', roomId);
        console.log('Remaining shapes:', shapes);

        await prismaClient.room.update({
          where: { id: roomId },
          data: { canvasState: shapes }
        })

        console.log('Database updated after delete');

        users.forEach(user => {
          if (user.rooms.includes(String(roomId))) {
            user.ws.send(JSON.stringify({
              type: "delete",
              shapes
            }))
          }
        })
      }
    } catch (error) {
      console.error("WebSocket message error:", error)
    }
  });

  ws.on('close', () => {
    const index = users.findIndex(u => u.ws === ws);
    if (index !== -1) {
      console.log(`User ${users[index]?.userId} disconnected`);
      users.splice(index, 1);
    }
    console.log(`Total users: ${users.length}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on port 8080');