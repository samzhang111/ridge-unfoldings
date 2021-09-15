import { Scene, WebGLRenderer, PerspectiveCamera, Mesh, BoxGeometry, MeshNormalMaterial, MeshLambertMaterial, Color, DirectionalLight, HemisphereLight, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector("#cube3d")
let centroid = {x: 0, y: 0, z: 0}
let scene, camera, renderer, controls
let currentCube, lastCube

// move = {direction, sign, cube}
const moves3d = []
const renderedCubes = []
const centroidToCubes = {}

const centroidToString = () => {
    return `${centroid.x}-${centroid.y}-${centroid.z}`
}

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

const blueMaterial = new MeshLambertMaterial({color: new Color(0x0000ff)})
const normalMaterial = new MeshNormalMaterial()

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

    camera.position.set( 5, 6, 7 );
    camera.lookAt( 0, 0, 0 );
    controls.addEventListener( 'change', render )

    scene = new Scene();
    scene.background = null

    //const light = new DirectionalLight( 0xffffff, 0.5 )
    const light = new HemisphereLight( 0xffffff, 0x080820, 1 );
    scene.add( light )

    const boxGeom =  new BoxGeometry(1, 1, 1)
    //let cube = new Mesh(boxGeom, new MeshNormalMaterial(), {color: new Color(0x00ffff)});
    const cube = new Mesh(boxGeom, blueMaterial)
    cube.position.set(centroid.x, centroid.y, centroid.z)
    currentCube = cube
    lastCube = cube
    renderedCubes.push(cube)
    scene.add( cube )

    renderer.render( scene, camera );
}

const resetMaterialOnAllCubes = () => {
    renderedCubes.forEach(cube => {
        cube.material = normalMaterial
    })
}

export const performUnfolding3d = (move, internal) => {
    resetMaterialOnAllCubes()
    updateCentroid(move)

    if (internal) {
        let cube = centroidToCubes[centroidToString()]
        cube.material = blueMaterial

        lastCube = currentCube
        currentCube = cube
    }
    else {
        moves3d.push(move)

        const boxGeom =  new BoxGeometry(1, 1, 1)
        //const cube = new Mesh(boxGeom, new MeshLambertMaterial({color: new Color(0x0000ff)}))
        const cube = new Mesh(boxGeom, blueMaterial)
        cube.position.set(centroid.x, centroid.y, centroid.z)
        renderedCubes.push(cube)
        centroidToCubes[centroidToString()] = cube
        lastCube = currentCube
        currentCube = cube
        scene.add( cube );

        controls.target = new Vector3(centroid.x/2, centroid.y/2, centroid.z/2)
    }
    renderer.render( scene, camera );
}

export const undoUnfoldingMove3d = (lastMove, internal) => {
    if (!internal) {
        moves3d.pop()
        const lastRenderedCube = renderedCubes.pop()
        scene.remove(lastRenderedCube)
    }

    resetMaterialOnAllCubes()

    lastCube.material = blueMaterial
    currentCube = lastCube
    undoUpdateCentroid(lastMove)
    controls.target = new Vector3(centroid.x/2, centroid.y/2, centroid.z/2)
    renderer.render( scene, camera );
}
