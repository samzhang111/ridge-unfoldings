import { Scene, WebGLRenderer, PerspectiveCamera, Mesh, BoxGeometry, MeshNormalMaterial, Color, DirectionalLight } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector("#cube3d")
let centroid = {x: 0, y: 0, z: 0}
let scene, camera, renderer, controls

// move = {direction, sign, cube}
const moves3d = []
const renderedCubes = []

const updateCentroid = move => {
    if (move.direction == 'x') {
        centroid.x += move.sign*1.1
    }
    else if (move.direction == 'y') {
        centroid.y += move.sign*1.1
    }
    else if (move.direction == 'z') {
        centroid.z += move.sign*1.1
    }
}

const undoUpdateCentroid = move => {
    if (move.direction == 'x') {
        centroid.x -= move.sign*1.1
    }
    else if (move.direction == 'y') {
        centroid.y -= move.sign*1.1
    }
    else if (move.direction == 'z') {
        centroid.z -= move.sign*1.1
    }
}

const render = () => {
    renderer.render( scene, camera );
}

export const initializeCanvas = () => {
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

    camera.position.set( 7, 8, 9 );
    camera.lookAt( 0, 0, 0 );
    controls.addEventListener( 'change', render )

    scene = new Scene();
    scene.background = null

    const directionalLight = new DirectionalLight( 0xffffff, 0.5 )
    scene.add( directionalLight )

    const boxGeom =  new BoxGeometry(1, 1, 1)
    let cube = new Mesh(boxGeom, new MeshNormalMaterial(), {color: new Color(0x00ff00)});
    cube.position.set(centroid.x, centroid.y, centroid.z)
    scene.add( cube )

    renderer.render( scene, camera );
}


export const performUnfolding3d = (move, internal) => {
    updateCentroid(move)

    if (!internal) {
        moves3d.push(move)

        const boxGeom =  new BoxGeometry(1, 1, 1)
        const cube = new Mesh(boxGeom, new MeshNormalMaterial(), {color: new Color(0x00ff00)})
        cube.position.set(centroid.x, centroid.y, centroid.z)
        renderedCubes.push(cube)
        scene.add( cube );

        renderer.render( scene, camera );
    }
}

export const undoUnfoldingMove3d = (lastMove, internal) => {
    if (!internal) {
        moves3d.pop()
        const lastRenderedCube = renderedCubes.pop()
        scene.remove(lastRenderedCube)
        renderer.render( scene, camera );
    }
    undoUpdateCentroid(lastMove)
}
