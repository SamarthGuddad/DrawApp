import { Shape } from "@/app/types";
import { isPointInShape } from "./Click";

export function Eraser(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    getShapes: () => Shape[],
    setShapes: (shapes: Shape[]) => void,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number,y: number,zoom: number},
    onShapeDeleted: (shapes: Shape[]) => void
){
    let isErasing = false;
    let touchedIndices = new Set<number>();
    let isActive = true;

    const handleMouseDown = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        isErasing = true;
        touchedIndices.clear();
        canvas.style.cursor = "crosshair";

        checkAndMarkShapes(e);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        if(isErasing){
            checkAndMarkShapes(e)
        }
    }

    const handleMouseUp = (e: MouseEvent) => {
        if(!isActive || !isErasing){
            return
        }

        isErasing = false

        if(touchedIndices.size >= 1){
            const shapes = getShapes();
            const updatedShapes = shapes.filter((_, index) => !touchedIndices.has(index));

            setShapes(updatedShapes);
            cleanAndRedraw();
            onShapeDeleted(updatedShapes)
        }

        touchedIndices.clear()
        canvas.style.cursor = "default";
    }

    function checkAndMarkShapes(e: MouseEvent){
        const worldPos = screenToWorld(e);
        const shapes = getShapes();
        const camera = getCamera();

        let needsRedraw = false;

        for(let i = shapes.length - 1;i >= 0;i--){
            if(isPointInShape(worldPos,shapes[i],camera.zoom,ctx,camera)){
                if(!touchedIndices.has(i)){
                    touchedIndices.add(i);
                    needsRedraw = true
                }
            }
        }

        if(needsRedraw){
            cleanAndRedraw();
            drawFadedShapes(shapes)
        }
    }

    function drawFadedShapes(shapes: Shape[]){
        const camera = getCamera();
        const dpr = window.devicePixelRatio || 1;

        ctx.save();
        ctx.setTransform(
            dpr * camera.zoom,
            0,
            0,
            dpr * camera.zoom,
            -camera.x * dpr * camera.zoom,
            -camera.y * dpr * camera.zoom
        );

        touchedIndices.forEach(index => {
            const shape = shapes[index];

            ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; 
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 3 / camera.zoom;

            if(shape.type === "rect"){
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            else if(shape.type === "circle"){
                ctx.beginPath();
                ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            else if(shape.type === "line"){
                ctx.beginPath();
                ctx.moveTo(shape.x1, shape.y1);
                ctx.lineTo(shape.x2, shape.y2);
                ctx.stroke();
            }
            else if(shape.type === "pencil"){
                if(shape.points.length > 1){
                    ctx.beginPath();
                    ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for(let i = 1; i < shape.points.length; i++){
                        ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    ctx.stroke();
                }
            }
            else if(shape.type === "text"){
                ctx.font = `${shape.fontSize / camera.zoom}px Arial`;
                ctx.textBaseline = "top";
                const metrics = ctx.measureText(shape.content);
                const width = metrics.width;
                const height = shape.fontSize / camera.zoom;
                ctx.fillRect(shape.x, shape.y, width, height);
            }
        });

        ctx.restore()
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    canvas.style.cursor = "crosshair";

    return () => {
        isActive = false;
        isErasing = false;
        touchedIndices.clear();
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }
}