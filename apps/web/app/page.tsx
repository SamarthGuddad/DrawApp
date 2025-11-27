"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useRef } from "react";

export default function Home() {

  const roomIdRef = useRef<HTMLInputElement>(null)  
  const router = useRouter()

  return (
    <div className={styles.page}>
            <input ref={roomIdRef} type="text" placeholder="Room Id"></input>

            <button onClick={() => {
              router.push(`/room/${roomIdRef.current?.value}`)
            }}>Join Room</button>
    </div>
  ); 
}
