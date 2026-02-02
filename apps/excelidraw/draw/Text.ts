import { Shape } from "@/app/types";

export function Text(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    ctx: CanvasRenderingContext2D,
    roomId: string,
    cleanAndRedraw: () => void,
    screenToWorld: (e: MouseEvent) => {x: number,y: number},
    getCamera: () => {x: number,y: number,zoom: number}
){
    let isActive = true;
    let inputElement: HTMLInputElement | null = null;
    let clickPosition = {x: 0,y: 0};

    const handleMouseDown = (e: MouseEvent) => {
        if(!isActive){
            return
        }

        const p = screenToWorld(e);
        clickPosition = {x: p.x,y:p.y};

        createTextInput(e.clientX,e.clientY);
    }

    function createTextInput(screenX: number,screenY: number){
        if(inputElement){
            inputElement.remove();
        }

        inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.style.position = "fixed";
        inputElement.style.left = `${screenX}px`;
        inputElement.style.top = `${screenY}px`;
        inputElement.style.font = "16px Arial";
        inputElement.style.border = "none";  
        inputElement.style.background = "transparent"; 
        inputElement.style.color = "white";
        inputElement.style.padding = "0";  
        inputElement.style.margin = "0";
        inputElement.style.outline = "none";  
        inputElement.style.zIndex = "10000";
        inputElement.style.minWidth = "300px";  
        inputElement.style.width = "auto";  
        inputElement.style.boxShadow = "none"; 
        inputElement.autocomplete = "off";


        document.body.appendChild(inputElement);

        const updateWidth = () => {
            if(inputElement) {
                const minWidth = 300;
                const textWidth = inputElement.value.length * 10 + 20; 
                inputElement.style.width = Math.max(minWidth, textWidth) + "px";
            }
        };

        inputElement.addEventListener("input", updateWidth);
        
        requestAnimationFrame(() => {
            if(inputElement){
                inputElement.focus();
                inputElement.select()
            }
        })

        const handleComplete = (save: boolean) => {
            if(!inputElement){
                return
            }

            const text = inputElement.value.trim();
            inputElement.remove();
            inputElement = null;

            if(save && text.length > 0){
                const shape: Shape = {
                    type: "text",
                    x: clickPosition.x,
                    y: clickPosition.y,
                    content: text,
                    fontSize: 16
                };

                const messageObj = {
                    type: "create",
                    roomId: roomId,
                    shape: shape
                }

                try {
                    const messageStr = JSON.stringify(messageObj);
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
        }

        inputElement.addEventListener("keydown",(e) => {
            e.stopPropagation()

            if(e.key === "Enter"){
                e.preventDefault();
                handleComplete(true);
            }
            else if(e.key === "Escape"){
                e.preventDefault();
                handleComplete(false)
            }
        })

        inputElement.addEventListener("keyup", (e) => {
            e.stopPropagation();
        });

        inputElement.addEventListener("keypress", (e) => {
            e.stopPropagation();
        });

        inputElement.addEventListener("blur", () => {
            handleComplete(true);
        })
    }

    canvas.addEventListener("mousedown",handleMouseDown);

    canvas.style.cursor = "text"

    return () => {
        isActive = false;
        canvas.style.cursor = "default";
        if(inputElement){
            inputElement.remove();
            inputElement = null
        }
        canvas.removeEventListener("mousedown",handleMouseDown)
    }
}