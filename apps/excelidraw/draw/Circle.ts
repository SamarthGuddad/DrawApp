import { Shape } from "@/app/types";

export function Circle(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    addShape: (shape: Shape) => void,
    cleanAndRedraw: () => void
) {
    let clicked = false;
    let startX = 0;
    let startY = 0;
    let isActive = true;
    
    const handleMouseDown = (e: MouseEvent) => {
        if (!isActive) return;
        const rect = canvas.getBoundingClientRect()
        clicked = true
        startX = e.clientX - rect.left
        startY = e.clientY - rect.top
    }
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        const rect = canvas.getBoundingClientRect()
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top
        const dx = currentX - startX
        const dy = currentY - startY
        const radius = Math.sqrt(dx * dx + dy * dy)
        cleanAndRedraw()
        ctx.strokeStyle = "white"
        ctx.beginPath()
        ctx.arc(startX, startY, radius, 0, Math.PI * 2)
        ctx.stroke()
    }
    
    const handleMouseUp = (e: MouseEvent) => {
        if (!isActive || !clicked) return;
        clicked = false
        const rect = canvas.getBoundingClientRect()
        const endX = e.clientX - rect.left
        const endY = e.clientY - rect.top
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