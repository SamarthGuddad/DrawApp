import { Shape } from "@/app/types";

export function drawShape(ctx: CanvasRenderingContext2D,shape: Shape){
    ctx.save()
    if(shape.type === "rect"){
        ctx.strokeStyle = "rgba(255,255,255)"
        ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
    }
    else if(shape.type === "circle"){
        ctx.strokeStyle = "white";
        ctx.beginPath()
        ctx.arc(shape.centerX,shape.centerY,shape.radius,0,Math.PI*2)
        ctx.stroke()
    }
    else if(shape.type === "line"){
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shape.x1,shape.y1);
        ctx.lineTo(shape.x2,shape.y2);
        ctx.stroke();
    }

    ctx.restore()    
}   