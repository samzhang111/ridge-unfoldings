import { HemisphereLight, Mesh, BoxGeometry, MeshNormalMaterial, MeshLambertMaterial, Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initializeCanvas, resetSceneObjects, getThreeObjects } from "./shared-three"

const canvas = document.querySelector("#viz")
let centroid = {x: 0, y: 0, z: 0}
let currentCube, lastCube

// move = {direction, sign, cube}
let moves3d = []
let renderedCubes = []
let centroidToCubes = {}

const blueMaterial = new MeshLambertMaterial({color: new Color(0x0000ff)})
const normalMaterial = new MeshNormalMaterial()

export const resetScene = () => {
    centroid = {x: 0, y: 0, z: 0}
    moves3d = []
    renderedCubes = []
    centroidToCubes = {}

    resetSceneObjects()

    initializeScene()
}

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
    let { scene, camera, renderer } = getThreeObjects()
    renderer.render( scene, camera );
}

const initializeScene = () => {
    let {scene} = getThreeObjects()

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
    centroidToCubes[centroidToString()] = cube

    render()
}

export const initializeCubeCanvas = () => {
    initializeCanvas()
    initializeScene()
}

const resetMaterialOnAllCubes = () => {
    renderedCubes.forEach(cube => {
        cube.material = normalMaterial
    })
}

export const performUnfolding3d = (move, internal) => {
    let {scene, controls} = getThreeObjects()

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
    
    render()
}

export const undoUnfoldingMove3d = (lastMove, internal) => {
    let {scene, controls} = getThreeObjects()
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
    
    render()
}
