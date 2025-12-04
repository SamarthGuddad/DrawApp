export function Pan(
  canvas: HTMLCanvasElement,
  getCamera:() => {x: number, y: number,zoom: number},
  setCamera: (cam: {x: number, y: number,zoom: number}) => void,
  cleanAndRedraw: () => void
) {
  let panning = false;
  let startX = 0;
  let startY = 0;
  let startCamX = 0;
  let startCamY = 0;

  const handleMouseDown = (e: MouseEvent) => {
    panning = true;
    startX = e.clientX;
    startY = e.clientY;

    const cam = getCamera()
    startCamX = cam.x;
    startCamY = cam.y;
    canvas.style.cursor = "grabbing";
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!panning) {
      return;
    }
    
    const cam = getCamera()
    const dx = (e.clientX - startX)/cam.zoom;
    const dy = (e.clientY - startY)/cam.zoom;
    
    const newCamera = {
      x: startCamX - dx,
      y: startCamY - dy,
      zoom: cam.zoom
    }
    
    setCamera(newCamera);
    cleanAndRedraw();
  }

  const handleMouseUp = (e: MouseEvent) => {
    panning = false;
    canvas.style.cursor = "grab";
  }

  canvas.style.cursor = "grab";
  window.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);

  return () => {
    canvas.style.cursor = "crosshair";
    window.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mousemove", handleMouseMove);
  }
}