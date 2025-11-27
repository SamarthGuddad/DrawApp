"use client";
import { InitDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";

export function Canvas({roomId, socket}: {roomId: string, socket: WebSocket}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawRef = useRef<any>(null)
    const [shapeType, setShapeType] = useState<"rect" | "circle">("rect")
    const shapeTypeRef = useRef(shapeType)
    
    useEffect(() => {
        shapeTypeRef.current = shapeType
    }, [shapeType])
    
    useEffect(() => {
        if (!canvasRef.current || drawRef.current) return
        
        const draw = InitDraw(
            canvasRef.current, 
            roomId, 
            socket, 
            () => shapeTypeRef.current
        )
        
        drawRef.current = draw
        
        return () => {
            drawRef.current?.cleanup()
            drawRef.current = null
        }
    }, [roomId, socket])
    
    useEffect(() => {
        if (drawRef.current?.selectShape) {
            drawRef.current.selectShape()
        }
    }, [shapeType])
    
    return (
        <div>
            <button onClick={() => setShapeType("rect")}>Rectangle</button>
            <button onClick={() => setShapeType("circle")}>Circle</button>
            <canvas ref={canvasRef} height={1000} width={2000}></canvas>
        </div>
    )
}