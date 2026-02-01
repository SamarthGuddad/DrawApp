import { BACKEND_URL } from "@/app/config"
import axios from "axios"
import { drawShape } from "./renderer"
import { Shape } from "@/app/types"
import { Rect } from "./Rect"
import { Circle } from "./Circle"
import { Pan } from "./Pan"
import { Zoom } from "./Zoom"
import { UndoRedoManager } from "./UndoRedo"
import { Click } from "./Click"
import { Line } from "./Line"

export function InitDraw(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    shapeType: () => "rect" | "circle" | "pan" | "click" | "line"
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
    let undoRedoManager: UndoRedoManager | null = null
    let cleanUpTool: (() => void) | null = null
    let cleanUpZoom: (() => void) | null = null
    let cleanUpKeyboard: (() => void) | null = null
    let isInitialized = false;
    
    getExistingShapes(roomId).then(shapes => {
        existingShapes = shapes || []
        undoRedoManager = new UndoRedoManager(existingShapes)
        clearCanvas(existingShapes, canvas, ctx,camera)
        isInitialized = true;
    }).catch(error => {
        console.error("Error loading shapes:", error)
        existingShapes = []
        undoRedoManager = new UndoRedoManager(existingShapes)
        clearCanvas(existingShapes, canvas, ctx, camera)
        isInitialized = true;
    })
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if(message.type === "create") {
            existingShapes.push(message.shape)
            if(isInitialized && undoRedoManager){
                undoRedoManager.saveState(existingShapes)
            }
        }
        else if(message.type === "update"){
            existingShapes = message.shapes
        }
        else if(message.type === "delete"){
            existingShapes = message.shapes
        }

        clearCanvas(existingShapes, canvas, ctx,camera)
    }

    cleanUpZoom = Zoom(canvas,() => camera,setCamera,cleanAndRedraw)
    cleanUpKeyboard = setupKeyboardShortcuts();

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
            cleanUpTool = Rect(canvas, socket, ctx, roomId, cleanAndRedraw,screenToWorld, () => camera)
        } 
        else if(shape === "circle") {
            cleanUpTool = Circle(canvas, socket, ctx, roomId, cleanAndRedraw,screenToWorld,() => camera)
        }
        else if(shape === "pan"){
            cleanUpTool = Pan(canvas,() => camera,setCamera,cleanAndRedraw)
        }
        else if(shape === "click"){
            cleanUpTool = Click(canvas,ctx,() => existingShapes,(shapes) => existingShapes = shapes,cleanAndRedraw,
                                screenToWorld,() => camera,handleShapeMoved,handleShapeDeleted)
        }
        else if(shape === "line"){
            cleanUpTool = Line(canvas,socket,ctx,roomId,cleanAndRedraw,screenToWorld,() => camera)
        }
    }

    function handleShapeMoved(shapes: Shape[]){
        undoRedoManager?.saveState(shapes);

        socket.send(JSON.stringify({
            type: "update",
            roomId,
            shapes
        }))
    }

    function handleShapeDeleted(shapes: Shape[]){
        undoRedoManager?.saveState(shapes);

        socket.send(JSON.stringify({
            type: "delete",
            roomId,
            shapes
        }))
    }
    
    function cleanAndRedraw() {
        if(!ctx) {
            return
        }
        clearCanvas(existingShapes, canvas, ctx,camera)
    }

    function setupKeyboardShortcuts(){
        const handleKeyDown = (e: KeyboardEvent) => {
            if((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey){
                e.preventDefault();
                handleUndo();
            }
            else if(((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") || (e.ctrlKey && e.key === "y")){
                e.preventDefault();
                handleRedo();
            }                                               
        } 

        window.addEventListener("keydown",handleKeyDown)

        return () => window.removeEventListener("keydown",handleKeyDown)
    }

    function handleUndo(){
        if(!undoRedoManager){
            return
        }

        if(!ctx){
            return
        }

        const prevState = undoRedoManager.undo();

        if(prevState){
            existingShapes = prevState;
            clearCanvas(existingShapes,canvas,ctx,camera)

            socket.send(JSON.stringify({
                type: "update",
                roomId,
                shapes: existingShapes
            }))
        }
    }

    function handleRedo(){
        if(!undoRedoManager){
            return
        }

        if(!ctx){
            return
        }

        const nextState = undoRedoManager.redo();

        if(nextState){
            existingShapes = nextState;
            clearCanvas(existingShapes,canvas,ctx,camera)

            socket.send(JSON.stringify({
                type: "update",
                roomId,
                shapes: existingShapes
            }))
        }
    }

    
    return {
        selectShape,
        undo: handleUndo,
        redo: handleRedo,
        canUndo: () => undoRedoManager?.canUndo() ?? false,
        canRedo: () => undoRedoManager?.canRedo() ?? false,
        cleanup() {
            cleanUpTool?.() 
            cleanUpZoom?.()
            cleanUpKeyboard?.()
        }
    }
}

function clearCanvas(
    shapes: Shape[],
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
                                    
    if (shapes && Array.isArray(shapes)) {
        shapes.forEach(shape => drawShape(ctx, shape));
    }
}

async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const res = await axios.get(`${BACKEND_URL}/room/${roomId}`)
        return (res.data.canvasState as Shape[]) || [] 
    } catch (error) {
        console.error("Error fetching shapes:", error)
        return []
    }
}