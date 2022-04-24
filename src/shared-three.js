import { Scene, WebGLRenderer, PerspectiveCamera, BoxGeometry, Vector2, Vector3, MeshNormalMaterial, MeshLambertMaterial, Color, HemisphereLight  } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector("#viz")
const container = document.querySelector("#vizcontainer")

let scene, camera, renderer, controls

//const CURRENT_NODE_COLOR = 0x222222
const CURRENT_NODE_COLOR = 0xFF8600
const NODE_COLOR = 0x039be5
const transparent = true
const opacity = 0.8
const wireframe = false
export const currentNodeMaterial = new MeshLambertMaterial({color: new Color(CURRENT_NODE_COLOR), opacity, wireframe, transparent})
export const normalMaterial = new MeshLambertMaterial({color: new Color(NODE_COLOR), opacity, wireframe, transparent})
//export const normalMaterial = new MeshNormalMaterial({opacity, wireframe, transparent})

export const getThreeObjects = () => {
    return {
        scene, camera, renderer, controls
    }
}

export const resetSceneObjects = (sceneConfig) => {
    let {cameraX, cameraY, cameraZ} = sceneConfig
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    controls.target = new Vector3(0, 0, 0)
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt( 0, 0, 0 );
    camera.zoom = 1
}

const render = () => {
    renderer.render( scene, camera );
}

export const resizeCanvas = () => {
    viz.width = container.scrollWidth * 2
    viz.height = container.scrollHeight * 2
}


export const initializeCanvas = (sceneConfig) => {
    let {cameraX, cameraY, cameraZ} = sceneConfig
    resizeCanvas()

    const width = canvas.width / 2
    const height = canvas.height / 2
    renderer = new WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setSize( width, height )

    camera = new PerspectiveCamera( 45, width / height, 1, 500 )
    controls = new OrbitControls(camera, canvas)
    controls.rotateSpeed = 1.0
    controls.panSpeed = 0.8
    controls.enableZoom = true
    controls.staticMoving = true
    controls.dynamicDampingFactor = 0.3

    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt( 0, 0, 0 );
    controls.addEventListener( 'change', render )

    scene = new Scene();
    scene.background = null

    const light = new HemisphereLight( 0xffffff, 0x080820, 1 );
    scene.add( light )
}

