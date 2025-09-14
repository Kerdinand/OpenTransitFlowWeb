import { OrthographicCamera, Vector2, Raycaster, Object3D, Object3DEventMap, Intersection, Mesh, Material, WebGLRenderer } from "three";

export default class MainRaycaster {
    static raycaster: Raycaster = new Raycaster();
    static isInitialized : boolean = false;
    static pointer : Vector2;
    static camera : OrthographicCamera;
    static sceneChildren : Object3D<Object3DEventMap>[];
    static intersects : Intersection<Object3D<Object3DEventMap>>[] = [];
    static renderer : WebGLRenderer;
    static Init(camera: OrthographicCamera, pointer:Vector2,children:Object3D<Object3DEventMap>[], renderer: WebGLRenderer 
):boolean{
        if (!this.isInitialized) {
            this.camera = camera;
            this.pointer = pointer;
            this.sceneChildren = children;
            this.renderer = renderer;
            return this.isInitialized = true;
        } else return false;
    }

    static getIntersectingObjects() : Intersection<Object3D<Object3DEventMap>>[] {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        this.intersects = this.raycaster.intersectObjects(this.sceneChildren, true);
        return this.intersects;
    }

    static colorIntersectingObjects() : void{
        for (let i = 0; i < this.intersects.length; i++) {
        // Safely set color if the material supports it
            const obj = this.intersects[i].object as Mesh;
            const mat = obj.material as Material | Material[] | undefined;
            console.log("Trigger")
            if (Array.isArray(mat)) {
                mat.forEach(m => (m as any)?.color?.set?.(0xff0000));
            } else {
                (mat as any)?.color?.set?.(0xff0000);
            }
        }
    }
}