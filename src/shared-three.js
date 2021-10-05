import { Scene, WebGLRenderer, PerspectiveCamera, BoxGeometry, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector("#viz")
const container = document.querySelector("#vizcontainer")
let scene, camera, renderer, controls

export const getThreeObjects = () => {
    return {
        scene, camera, renderer, controls
    }
}

export const resetSceneObjects = () => {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    controls.target = new Vector3(0, 0, 0)
    renderer.render( scene, camera );
}

const render = () => {
    renderer.render( scene, camera );
}

export const resizeCanvas = () => {
    viz.width = container.scrollWidth * 2
    viz.height = container.scrollHeight * 2
}


export const initializeCanvas = () => {
    resizeCanvas()

    const width = canvas.width / 2
    const height = canvas.height / 2
    renderer = new WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setSize( width, height );

    camera = new PerspectiveCamera( 45, width / height, 1, 500 );
    controls = new OrbitControls(camera, canvas)
    controls.rotateSpeed = 1.0;
    controls.panSpeed = 0.8;
    controls.enableZoom = false
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    camera.position.set( 5, 6, 7 );
    camera.lookAt( 0, 0, 0 );
    controls.addEventListener( 'change', render )

    scene = new Scene();
    scene.background = null
}

