import { Shape } from "@/app/types";

export function Rect(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    addShape: (shape: Shape) => void,
    cleanAndRedraw: () => void
) {
    let clicked = false
    let startX = 0;
    let startY = 0;
    let isActive = true;
    
    const handleMouseDown = (e: MouseEvent) => {
        if (!isActive) return;
        const rect = canvas.getBoundingClientRect();  
        e.preventDefault(); 
        clicked = true
        startX = e.clientX - rect.left
        startY = e.clientY - rect.top
    }
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        const rect = canvas.getBoundingClientRect();
        const width = (e.clientX - rect.left) - startX;
        const height = (e.clientY - rect.top) - startY;
        cleanAndRedraw();
        ctx.strokeStyle = "rgba(255,255,255)"
        ctx.strokeRect(startX, startY, width, height)
    }
    
    const handleMouseUp = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        const rect = canvas.getBoundingClientRect();
        clicked = false
        const width = (e.clientX - rect.left) - startX;
        const height = (e.clientY - rect.top) - startY;  
        const shape: Shape = {
            type: "rect",
            x: startX,
            y: startY,
            width: width,
            height: height
        }
        
        socket.send(JSON.stringify({
            type: "chat",
            roomId,
            message: JSON.stringify(shape)
        }))
    }
    
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    
    return () => {
        isActive = false;
        clicked = false;
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
    }
}
