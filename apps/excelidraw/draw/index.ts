import { BACKEND_URL } from "@/app/config"
import axios from "axios"
import { drawShape } from "./renderer"
import { Shape } from "@/app/types"
import { Rect } from "./Rect"
import { Circle } from "./Circle"

export function InitDraw(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    shapeType: () => "rect" | "circle"
) {
    const ctx = canvas.getContext("2d")
    if(!ctx) {
        return
    }
    
    let existingShapes: Shape[] = []
    let cleanUpTool: (() => void) | null = null
    
    getExistingShapes(roomId).then(shapes => {
        existingShapes = shapes
        clearCanvas(existingShapes, canvas, ctx)
    })
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if(message.type === "chat") {
            const parsedShape = JSON.parse(message.message)
            existingShapes.push(parsedShape)
            clearCanvas(existingShapes, canvas, ctx)
        }
    }
    
    clearCanvas(existingShapes, canvas, ctx)
    selectShape()
    
    function selectShape() {
        if(!ctx) {
            return
        }
        
        if(cleanUpTool) {
            cleanUpTool()
            cleanUpTool = null
        }
        
        clearCanvas(existingShapes, canvas, ctx)
        
        const shape = shapeType()
        
        if(shape === "rect") {
            cleanUpTool = Rect(canvas, socket, ctx, roomId, addShape, cleanAndRedraw)
        } else if(shape === "circle") {
            cleanUpTool = Circle(canvas, socket, ctx, roomId, addShape, cleanAndRedraw)
        }
    }
    
    function addShape(shape: Shape) {
        if(!ctx) {
            return
        }
        existingShapes.push(shape)
        clearCanvas(existingShapes, canvas, ctx)
    }
    
    function cleanAndRedraw() {
        if(!ctx) {
            return
        }
        clearCanvas(existingShapes, canvas, ctx)
    }
    
    return {
        selectShape,
        cleanup() {
            cleanUpTool?.() 
        }
    }
}

function clearCanvas(
    existingShapes: Shape[],
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "rgba(0,0,0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    existingShapes.forEach(shape => drawShape(ctx, shape))
}

async function getExistingShapes(roomId: string) {
    const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
    const messages = res.data.messages
    const shapes = messages.map((x: {message: string}) => {
        const messageData = JSON.parse(x.message)
        return messageData
    })
    return shapes
}