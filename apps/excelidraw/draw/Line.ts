import { Shape } from "@/app/types";

export function Line(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number,y: number,zoom: number}
){
    let clicked = false;
    let startX = 0;
    let startY = 0;
    let isActive = true;

    const handleMouseDown = (e: MouseEvent) => {
    if (!isActive) return;
    clicked = true;
    const p = screenToWorld(e);
    startX = p.x;
    startY = p.y;
  };

    const handleMouseMove = (e: MouseEvent) => {
    if (!isActive || !clicked) return;
    const p = screenToWorld(e);
    const currentX = p.x;
    const currentY = p.y;

    cleanAndRedraw();

    const dpr = window.devicePixelRatio || 1;
    const camera = getCamera();
    ctx.save();
    ctx.setTransform(
      dpr * camera.zoom,
      0,
      0,
      dpr * camera.zoom,
      -camera.x * dpr * camera.zoom,
      -camera.y * dpr * camera.zoom
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2 / camera.zoom;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.restore();
  };

    const handleMouseUp = (e: MouseEvent) => {
    if (!isActive || !clicked) return;
    clicked = false;
    const p = screenToWorld(e);
    const endX = p.x;
    const endY = p.y;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1) return;

    const shape: Shape = {
      type: "line",
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY
    };

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
  };

    canvas.addEventListener("mousedown",handleMouseDown);
    canvas.addEventListener("mousemove",handleMouseMove);
    canvas.addEventListener("mouseup",handleMouseUp);

    return () => {
        isActive = false;
        clicked = false;
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);       
        canvas.removeEventListener("mouseup", handleMouseUp);
    }
}