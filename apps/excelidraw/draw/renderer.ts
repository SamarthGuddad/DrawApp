import { Shape } from "@/app/types";

export function drawShape(ctx: CanvasRenderingContext2D,shape: Shape){
    if(shape.type === "rect"){
            ctx.strokeStyle = "rgba(255,255,255)"
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
        }
        if(shape.type === "circle"){
            ctx.strokeStyle = "white";
            ctx.beginPath()
            ctx.arc(shape.centerX,shape.centerY,shape.radius,0,Math.PI*2)
            ctx.stroke()
        }
}   