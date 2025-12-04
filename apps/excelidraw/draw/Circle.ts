import { Shape } from "@/app/types";

export function Circle(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    addShape: (shape: Shape) => void,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number, y: number,zoom: number}
) {
    let clicked = false;
    let startX = 0;
    let startY = 0;
    let isActive = true;

    const handleMouseDown = (e: MouseEvent) => {
        if (!isActive) return;
        clicked = true
        const p = screenToWorld(e)
        startX = p.x
        startY = p.y
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        const p = screenToWorld(e);
        const currentX = p.x
        const currentY = p.y 
        const dx = currentX - startX
        const dy = currentY - startY
        const radius = Math.sqrt(dx * dx + dy * dy)
        
        cleanAndRedraw()
        
        const dpr = window.devicePixelRatio || 1;
        const camera = getCamera();
        ctx.save();
        ctx.setTransform(dpr*camera.zoom, 0, 0, dpr*camera.zoom, -camera.x * dpr*camera.zoom, -camera.y * dpr*camera.zoom);
        
        ctx.strokeStyle = "white"
        ctx.beginPath()
        ctx.arc(startX, startY, radius, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.restore();
    }

    const handleMouseUp = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        clicked = false
        const p = screenToWorld(e)
        const endX = p.x
        const endY = p.y
        const dx = endX - startX
        const dy = endY - startY
        const radius = Math.sqrt(dx * dx + dy * dy)
        
        const shape: Shape = {
            type: "circle",
            centerX: startX,
            centerY: startY,
            radius
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