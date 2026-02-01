import { Shape } from "@/app/types";

export function Rect(
  canvas: HTMLCanvasElement,
  socket: WebSocket,
  ctx: CanvasRenderingContext2D,
  roomId: string,
  cleanAndRedraw: () => void,
  screenToWorld: (e: MouseEvent) => { x: number, y: number },
  getCamera: () => { x: number, y: number, zoom: number }
) {
  let clicked = false
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
    const width = p.x - startX;
    const height = p.y - startY;
    cleanAndRedraw();
    const dpr = window.devicePixelRatio || 1;
    const camera = getCamera();
    ctx.save();
    ctx.setTransform(dpr * camera.zoom, 0, 0, dpr * camera.zoom, -camera.x * dpr * camera.zoom, -camera.y * dpr * camera.zoom);
    ctx.strokeStyle = "rgba(255,255,255)";
    ctx.strokeRect(startX, startY, width, height);
    ctx.restore();
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (!isActive || !clicked) return;
    clicked = false
    const p = screenToWorld(e);
    const width = p.x - startX;
    const height = p.y - startY;

    const shape: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      width: width,
      height: height
    }

    console.log('Sending shape to backend:', shape);
    console.log('Room ID:', roomId);
    console.log('Room ID type:', typeof roomId);
    console.log('Socket ready state:', socket.readyState);

    // Build message object step by step to debug
    const messageObj = {
      type: "create",
      roomId: roomId,
      shape: shape
    };

    console.log('Message object:', messageObj);

    try {
      const messageStr = JSON.stringify(messageObj);
      console.log('Message string:', messageStr);
      console.log('Message string length:', messageStr?.length);

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