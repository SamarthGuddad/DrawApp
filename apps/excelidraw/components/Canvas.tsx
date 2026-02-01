"use client";

import { InitDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";

export function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);

  const [shapeType, setShapeType] = useState<"rect" | "circle" | "pan" | "click" | "line">("rect");
  const shapeTypeRef = useRef(shapeType);
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(800, window.innerWidth);
      const h = Math.max(600, window.innerHeight);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      engineRef.current?.selectShape?.();      
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function setup() {
      if (!canvasRef.current) return;
      const engine = await InitDraw(
        canvasRef.current,
        roomId,
        socket,
        () => shapeTypeRef.current
      );
      if (!mounted) {
        engine?.cleanup?.();
        return;
      }
      engineRef.current = engine;
      engineRef.current?.selectShape?.();
    }
    setup();

    return () => {
      mounted = false;
      engineRef.current?.cleanup?.();
      engineRef.current = null;
    };
  }, [roomId, socket]);

  useEffect(() => {
    engineRef.current?.selectShape?.();
  }, [shapeType]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#000",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 20,
          display: "flex",
          gap: 8,
        }}
      >
        <button onClick={() => setShapeType("rect")}>Rectangle</button>
        <button onClick={() => setShapeType("circle")}>Circle</button>
        <button onClick={() => setShapeType("pan")}>Move</button>
        <button onClick={() => setShapeType("click")}>Select</button>
        <button onClick={() => setShapeType("line")}>Line</button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: shapeType === "pan" ? "grab" : shapeType === "click" ? "default" : "crosshair",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}