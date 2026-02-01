import { Shape } from "@/app/types";

export function Circle(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
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

        const messageObj = {
            type: "create",
            roomId: roomId,
            shape: shape
        };
        
        try {
      const messageStr = JSON.stringify(messageObj);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
        console.log('Message sent successfully');
      } else {
        console.error('WebSocket not open. ReadyState:', socket.readyState);
      }
    } catch (error) {
      console.error('Error stringifying or sending message:', error);
    }
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