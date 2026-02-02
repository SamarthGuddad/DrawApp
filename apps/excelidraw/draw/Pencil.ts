import { Shape } from "@/app/types";

export function Pencil(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number,y: number,zoom: number}
){
    let isDrawing = false;
    let points: {x: number,y: number}[] = []
    let isActive = true;

    const handleMouseDown = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        isDrawing = true;

        const p = screenToWorld(e);
        points = [{x: p.x,y: p.y}]
    }

    const handleMouseMove = (e: MouseEvent) => {
        if(!isActive || !isDrawing){
            return
        }

        const p = screenToWorld(e);

        points.push({x: p.x,y: p.y});

        cleanAndRedraw();

        const dpr = window.devicePixelRatio || 1;
        const camera = getCamera();
        ctx.save();
        ctx.setTransform(
            dpr*camera.zoom,
            0,
            0,
            dpr*camera.zoom,
            -camera.x*dpr*camera.zoom,
            -camera.y*dpr*camera.zoom
        )

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2/camera.zoom;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(points[0].x,points[0].y);
        for(let i=1;i<points.length;i++){
            ctx.lineTo(points[i].x,points[i].y)
        }
        ctx.stroke();

        ctx.restore();
    }

    const handleMouseUp = (e: MouseEvent) => {
        if(!isActive || !isDrawing){
            return
        }

        isDrawing = false;

        if(points.length < 2){
            return
        }

        const shape: Shape = {
            type: "pencil",
            points: points
        }

        const messageObj = {
            type: "create",
            roomId: roomId,
            shape: shape
        }

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

        points = []
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove",handleMouseMove);
    window.addEventListener("mouseup",handleMouseUp);

    return () => {
        isActive = false;
        isDrawing = false;
        points = [];
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }
}