import { Shape } from "@/app/types";

export function Click(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    getShapes: () => Shape[],
    setShapes: (shapes: Shape[]) => void,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number,y: number,zoom: number},
    onShapeMoved: (shapes: Shape[]) => void,
    onShapeDeleted: (shapes: Shape[]) => void
){
    let isDragging = false;
    let selectedIndex = -1;
    let dragStartWorld = {x: 0,y: 0};
    let shapeStartPos = {x: 0,y: 0};
    let shapeStartPos2 = {x: 0,y: 0};
    let pencilOrignalPoints: {x: number,y: number}[] = []
    let mouseDownPos = {x: 0,y: 0};
    let hasMoved = false;
    let isActive = true;

    const handleMouseDown = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        const worldPos = screenToWorld(e);
        const shapes = getShapes();
        const camera = getCamera();

        mouseDownPos = {x: e.clientX,y: e.clientY};
        hasMoved = false;
        isDragging = false;

        shapeStartPos = {x: 0, y: 0};
        shapeStartPos2 = {x: 0, y: 0};
        pencilOrignalPoints = [];

        let hitIndex = -1;

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(worldPos, shapes[i],camera.zoom,ctx,camera)) {
                hitIndex = i;
                break;
            }
        }

         if (hitIndex !== -1) {
            selectedIndex = hitIndex;
            isDragging = true;
            dragStartWorld = worldPos;

            const shape = shapes[selectedIndex];
            if (shape.type === "rect") {
                shapeStartPos = { x: shape.x, y: shape.y };
            } else if(shape.type === "circle"){
                shapeStartPos = { x: shape.centerX, y: shape.centerY };
            }
            else if(shape.type === "line"){
                shapeStartPos = {x: shape.x1,y: shape.y1};
                shapeStartPos2 = {x: shape.x2,y: shape.y2}
            }
            else if(shape.type === "pencil"){
                pencilOrignalPoints = shape.points.map(p => ({x: p.x,y: p.y}))
            }
            else if(shape.type === "text"){
                shapeStartPos = {x: shape.x, y: shape.y};
            }


            cleanAndRedraw();
            highlightShape(shape);
            canvas.style.cursor = "grabbing";
        
        }
        else {
            selectedIndex = -1;
            cleanAndRedraw();
            canvas.style.cursor = "default";
        } 
    }

    const handleMouseMove = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        const worldPos = screenToWorld(e);
        const camera = getCamera();

        if(isDragging && selectedIndex !== -1){
            const dx_screen = e.clientX - mouseDownPos.x;
            const dy_screen = e.clientY - mouseDownPos.y;
            const distance = Math.sqrt(dx_screen*dx_screen + dy_screen*dy_screen);

            if(distance > 3){
                hasMoved = true
            }

            const dx = worldPos.x - dragStartWorld.x;
            const dy = worldPos.y - dragStartWorld.y;

            const shapes = getShapes();
            const updatedShapes = [...shapes];
            const shape = shapes[selectedIndex]

            if(shape.type === "rect"){
                updatedShapes[selectedIndex] = {
                    type: "rect",
                    x: shapeStartPos.x + dx,
                    y: shapeStartPos.y + dy,
                    width: shape.width,
                    height: shape.height
                }
            }
            else if(shape.type === "circle"){
                updatedShapes[selectedIndex] = {
                    type: "circle",
                    centerX: shapeStartPos.x + dx,
                    centerY: shapeStartPos.y + dy,
                    radius: shape.radius
                }
            }
            else if(shape.type === "line"){
                updatedShapes[selectedIndex] = {
                    type: "line",
                    x1: shapeStartPos.x + dx,
                    y1: shapeStartPos.y + dy,
                    x2: shapeStartPos2.x + dx,
                    y2: shapeStartPos2.y + dy
                }
            }
            else if(shape.type === "pencil"){
                const movedPoints = pencilOrignalPoints.map(p => ({
                    x: p.x + dx,
                    y: p.y + dy
                }));

                updatedShapes[selectedIndex] = {
                    type: "pencil",
                    points: movedPoints
                }
            }
            else if(shape.type === "text"){
                updatedShapes[selectedIndex] = {
                    type: "text",
                    x: shapeStartPos.x + dx,
                    y: shapeStartPos.y + dy,
                    content: shape.content,
                    fontSize: shape.fontSize
                }
            }

            setShapes(updatedShapes);
            cleanAndRedraw();

            highlightShape(updatedShapes[selectedIndex])
        }
        else{
            const shapes = getShapes();
            let hovering = false;

            for(let i=shapes.length - 1; i >= 0; i--){
                if(isPointInShape(worldPos,shapes[i],camera.zoom,ctx,camera)){
                    hovering = true;
                    break;
                }
            }

            canvas.style.cursor = hovering ? "grab" : "default"
        }
    }

    const handleMouseUp = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        if(isDragging && hasMoved){
            onShapeMoved(getShapes());
        }

        isDragging = false; 
        hasMoved = false;

        shapeStartPos = {x: 0, y: 0};
        shapeStartPos2 = {x: 0, y: 0};
        pencilOrignalPoints = []

        if(selectedIndex !== -1){
            cleanAndRedraw();
            highlightShape(getShapes()[selectedIndex])
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if(!isActive){
            return
        }

        if((e.key === "Delete" || e.key === "Backspace") && selectedIndex !== -1){
            e.preventDefault();
            const shapes = getShapes();
            const updatedShapes = shapes.filter((_,index) => index !== selectedIndex);
            setShapes(updatedShapes);
            cleanAndRedraw();
            onShapeDeleted(updatedShapes);


            selectedIndex = -1
        }
    }

    function highlightShape(shape: Shape){
        const camera = getCamera();
        const dpr = window.devicePixelRatio || 1;

        ctx.save();
        ctx.setTransform(
            dpr*camera.zoom,
            0,
            0,
            dpr*camera.zoom,
            -camera.x*dpr*camera.zoom,
            -camera.y*dpr*camera.zoom
        );

        ctx.strokeStyle = "rgba(0, 150, 255, 0.8)";
        ctx.lineWidth = 2 / camera.zoom;
        ctx.setLineDash([5/camera.zoom,5/camera.zoom]);

        if(shape.type === "rect"){
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
        }
        else if(shape.type === "circle"){
            ctx.beginPath();
            ctx.arc(shape.centerX,shape.centerY,shape.radius,0,Math.PI*2);
            ctx.stroke();
        }
        else if(shape.type === "line"){
            ctx.beginPath();
            ctx.moveTo(shape.x1,shape.y1);
            ctx.lineTo(shape.x2,shape.y2)
            ctx.stroke();
        }
        else if(shape.type === "pencil"){
            if(shape.points.length > 1){
                ctx.beginPath();
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++){
                    ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                ctx.stroke()
            }
        }
        else if(shape.type === "text"){
            const camera = getCamera();
            ctx.font = `${shape.fontSize / camera.zoom}px Arial`;
            ctx.textBaseline = "top";
            const metrics = ctx.measureText(shape.content);
            const width = metrics.width;
            const height = shape.fontSize / camera.zoom;
            
            ctx.strokeRect(shape.x - 2/camera.zoom, shape.y - 2/camera.zoom, width + 4/camera.zoom, height + 4/camera.zoom);
        }

        ctx.restore();
    }

    canvas.addEventListener("mousedown",handleMouseDown);
    canvas.addEventListener("mousemove",handleMouseMove);
    window.addEventListener("mouseup",handleMouseUp);
    window.addEventListener("keydown",handleKeyDown);

    return () => {
        isActive = false
        isDragging = false;
        canvas.style.cursor = "default";
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("keydown", handleKeyDown);
    }

}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

export function isPointInShape(
  point: {x: number, y: number},
  shape: Shape,
  zoom: number,
  ctx: CanvasRenderingContext2D,
  getCamera: {x: number,y: number, zoom: number
  }
): boolean {
  const tolerance = 8 / zoom;

  if (shape.type === "rect") {
            let { x, y, width, height } = shape;
            
            if (width < 0) {
            x = x + width;
            width = Math.abs(width);
            }
            if (height < 0) {
            y = y + height;
            height = Math.abs(height);
            }
            
            const inOuterBounds = 
            point.x >= x - tolerance &&
            point.x <= x + width + tolerance &&
            point.y >= y - tolerance &&
            point.y <= y + height + tolerance;
            
            if (!inOuterBounds) {
            return false;
            }
            
            if (width <= 2 * tolerance || height <= 2 * tolerance) {
            return true;
            }
            
            const inInnerBounds = 
            point.x > x + tolerance &&
            point.x < x + width - tolerance &&
            point.y > y + tolerance &&
            point.y < y + height - tolerance;
            
            return !inInnerBounds;
    
  } else if (shape.type === "circle") {
            const dx = point.x - shape.centerX;
            const dy = point.y - shape.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return Math.abs(distance - shape.radius) <= tolerance;
  }
  else if (shape.type === "line") {
            const { x1, y1, x2, y2 } = shape;
            
            const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            
            if (lineLength < 0.01) {
            const dx = point.x - x1;
            const dy = point.y - y1;
            return Math.sqrt(dx * dx + dy * dy) <= tolerance;
            }
            
            const distance = Math.abs(
            (y2 - y1) * point.x - (x2 - x1) * point.y + x2 * y1 - y2 * x1
            ) / lineLength;
            
            const dotProduct = 
            ((point.x - x1) * (x2 - x1) + (point.y - y1) * (y2 - y1)) / (lineLength * lineLength);
            
            const isWithinSegment = dotProduct >= 0 && dotProduct <= 1;
            
            return distance <= tolerance && isWithinSegment;
  }
  else if(shape.type === "pencil"){
            if(shape.points.length < 2){
                return false
            }

            for(let i = 0; i < shape.points.length - 1; i++){
                const x1 = shape.points[i].x;
                const y1 = shape.points[i].y;
                const x2 = shape.points[i + 1].x;
                const y2 = shape.points[i + 1].y;

                const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

                if (lineLength < 0.01) {
                    const dx = point.x - x1;
                    const dy = point.y - y1;
                    if (Math.sqrt(dx * dx + dy * dy) <= tolerance) {
                        return true;
                    }
                    continue;
                }

                const distance = Math.abs((y2 - y1) * point.x - (x2 - x1) * point.y + x2 * y1 - y2 * x1) / lineLength;
                
                const dotProduct = ((point.x - x1) * (x2 - x1) + (point.y - y1) * (y2 - y1)) / (lineLength * lineLength);
                
                const isWithinSegment = dotProduct >= 0 && dotProduct <= 1;
                
                if (distance <= tolerance && isWithinSegment) {
                    return true;
                }
            }
  }
  else if(shape.type === "text"){
            const camera = getCamera
            ctx.font = `${shape.fontSize / camera.zoom}px Arial`;
            ctx.textBaseline = "top";
            const metrics = ctx.measureText(shape.content);
            const width = metrics.width;
            const height = shape.fontSize / camera.zoom;
            
            return (
                point.x >= shape.x &&
                point.x <= shape.x + width &&
                point.y >= shape.y &&
                point.y <= shape.y + height
            );
  }

  return false;
}