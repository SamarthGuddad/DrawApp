import { BACKEND_URL } from "@/app/config"
import axios from "axios"
import { drawShape } from "./renderer"
import { Shape } from "@/app/types"
import { Rect } from "./Rect"
import { Circle } from "./Circle"
import { Pan } from "./Pan"
import { Zoom } from "./Zoom"

export function InitDraw(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    shapeType: () => "rect" | "circle" | "pan"
) {
    const ctx = canvas.getContext("2d")
    if(!ctx) {
        return
    }

    let camera = {x:0,y:0,zoom: 1}

    function setCamera(c: {x: number,y: number,zoom: number}){
        camera = c  
    }

    function screenToWorld(e: MouseEvent){
    const r = canvas.getBoundingClientRect()
    return {
        x: (e.clientX - r.left)/camera.zoom + camera.x,
        y: (e.clientY - r.top)/camera.zoom + camera.y,
    }
}
    
    let existingShapes: Shape[] = []
    let cleanUpTool: (() => void) | null = null
    let cleanUpZoom: (() => void) | null = null
    
    getExistingShapes(roomId).then(shapes => {
        existingShapes = shapes
        clearCanvas(existingShapes, canvas, ctx,camera)
    })
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if(message.type === "chat") {
            const parsedShape = JSON.parse(message.message)
            existingShapes.push(parsedShape)
            clearCanvas(existingShapes, canvas, ctx,camera)
        }
    }
    
    clearCanvas(existingShapes, canvas, ctx,camera)

    cleanUpZoom = Zoom(canvas,() => camera,setCamera,cleanAndRedraw)

    selectShape()
    
    function selectShape() {
        if(!ctx) {
            return
        }
        
        if(cleanUpTool) {
            cleanUpTool()
            cleanUpTool = null
        }
        
        clearCanvas(existingShapes, canvas, ctx,camera)
        
        const shape = shapeType()
        
        if(shape === "rect") {
            cleanUpTool = Rect(canvas, socket, ctx, roomId, addShape, cleanAndRedraw,screenToWorld, () => camera)
        } 
        else if(shape === "circle") {
            cleanUpTool = Circle(canvas, socket, ctx, roomId, addShape, cleanAndRedraw,screenToWorld,() => camera)
        }
        else if(shape === "pan"){
            cleanUpTool = Pan(canvas,() => camera,setCamera,cleanAndRedraw)
        }
    }
    
    function addShape(shape: Shape) {
        if(!ctx) {
            return
        }
        existingShapes.push(shape)
        clearCanvas(existingShapes, canvas, ctx,camera)
    }
    
    function cleanAndRedraw() {
        if(!ctx) {
            return
        }
        clearCanvas(existingShapes, canvas, ctx,camera)
    }
    
    return {
        selectShape,
        cleanup() {
            cleanUpTool?.() 
            cleanUpZoom?.()
        }
    }
}

function clearCanvas(
    existingShapes: Shape[],
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    camera: {x: number, y: number,zoom: number}
) {
    const dpr = window.devicePixelRatio || 1;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.setTransform(dpr*camera.zoom, 0, 0, dpr*camera.zoom, -camera.x * dpr*camera.zoom, -camera.y * dpr*camera.zoom);
                                    
    existingShapes.forEach(shape => drawShape(ctx, shape));
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