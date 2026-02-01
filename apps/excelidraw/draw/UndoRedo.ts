import { Shape } from "@/app/types";

export class UndoRedoManager{
    private undoStack: Shape[][] = [];
    private redoStack: Shape[][] = [];
    private maxSize = 50;

    constructor(initialShapes: Shape[] = []){
        this.undoStack.push([...initialShapes])
    }

    saveState(shapes: Shape[]){
        this.undoStack.push(JSON.parse(JSON.stringify(shapes)))

        if(this.undoStack.length > this.maxSize){
            this.undoStack.shift()
        }

        this.redoStack = [];
    }

    undo(): Shape[] | null{
        if(this.undoStack.length <= 1){
            return null
        }

        const currentState = this.undoStack.pop()!;
        this.redoStack.push(currentState)

        const prevState = this.undoStack[this.undoStack.length - 1]

        return JSON.parse(JSON.stringify(prevState))
    }

    redo(): Shape[] | null{
        if(this.redoStack.length === 0){
            return null
        }

        const nextState = this.redoStack.pop()!;
        this.undoStack.push(nextState)

        return JSON.parse(JSON.stringify(nextState))
    }

    canUndo(): boolean{
        return this.undoStack.length > 1
    }

    canRedo(): boolean{
        return this.redoStack.length > 0
    }

    clear(){
        this.undoStack = [];
        this.redoStack = [];
    }
}

