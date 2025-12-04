export function Zoom(
    canvas: HTMLCanvasElement,
    getCamera:() => {x: number,y: number,zoom: number},
    setCamera: (cam: {x: number,y: number,zoom: number}) => void,
    cleanAndRedraw: () => void
){
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const camera = getCamera()

        const rect = canvas.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = mouseX/camera.zoom + camera.x;
        const worldY = mouseY/camera.zoom + camera.y;

        const zoomSpeed = 0.001;
        const zoomDelta = -e.deltaY*zoomSpeed;

        const newZoom = Math.min(Math.max(camera.zoom*(1+zoomDelta),0.1),10)

        const newCameraX = worldX - mouseX / newZoom;
        const newCameraY = worldY - mouseY / newZoom;

        setCamera({
            x: newCameraX,
            y: newCameraY,
            zoom: newZoom
        })

        cleanAndRedraw()
    }

    canvas.addEventListener("wheel",handleWheel,{passive: false})

    return () => {
        canvas.removeEventListener("wheel",handleWheel)
    }
}