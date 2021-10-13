import { Mesh, BoxGeometry, Vector3 } from 'three';
import { initializeCanvas, resetSceneObjects, getThreeObjects, currentNodeMaterial, normalMaterial } from "./shared-three"


const canvas = document.querySelector("#viz")

/****************************
 * Cube-specific data structures
****************************/

let centroid = {x: 0, y: 0, z: 0}
let currentCube, lastCube

// move = {direction, sign, cube}
let renderedCubes = []
let centroidToCubes = {}

/****************************
 * Internal logic
****************************/

const centroidToString = () => {
    return `${centroid.x}-${centroid.y}-${centroid.z}`
}

//const CUBE_SPACING = 1.1
const CUBE_SPACING = 1

const updateCentroid = move => {
    if (move.direction == 'x') {
        centroid.x += move.sign*CUBE_SPACING
    }
    else if (move.direction == 'y') {
        centroid.y += move.sign*CUBE_SPACING
    }
    else if (move.direction == 'z') {
        centroid.z += move.sign*CUBE_SPACING
    }
}

const undoUpdateCentroid = move => {
    if (move.direction == 'x') {
        centroid.x -= move.sign*CUBE_SPACING
    }
    else if (move.direction == 'y') {
        centroid.y -= move.sign*CUBE_SPACING
    }
    else if (move.direction == 'z') {
        centroid.z -= move.sign*CUBE_SPACING
    }
}


const resetMaterialOnAllCubes = () => {
    renderedCubes.forEach(cube => {
        cube.material = normalMaterial
    })
}

/****************************
 * Unfolding
****************************/

export const performUnfoldingCube = (move, internal) => {
    let {scene, controls} = getThreeObjects()

    resetMaterialOnAllCubes()
    updateCentroid(move)

    if (internal) {
        let cube = centroidToCubes[centroidToString()]
        cube.material = currentNodeMaterial

        lastCube = currentCube
        currentCube = cube
    }
    else {
        const boxGeom =  new BoxGeometry(1, 1, 1)
        //const cube = new Mesh(boxGeom, new MeshLambertMaterial({color: new Color(0x0000ff)}))
        const cube = new Mesh(boxGeom, currentNodeMaterial)
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

export const undoUnfoldingCube = (lastMove, internal) => {
    let {scene, controls} = getThreeObjects()
    if (!internal) {
        const lastRenderedCube = renderedCubes.pop()
        scene.remove(lastRenderedCube)
    }

    resetMaterialOnAllCubes()

    lastCube.material = currentNodeMaterial
    currentCube = lastCube
    undoUpdateCentroid(lastMove)
    controls.target = new Vector3(centroid.x/2, centroid.y/2, centroid.z/2)
    
    render()
}

/****************************
 * Rendering and resetting
****************************/

const render = () => {
    let { scene, camera, renderer } = getThreeObjects()
    renderer.render( scene, camera );
}

const initializeScene = () => {
    let {scene} = getThreeObjects()

    const boxGeom =  new BoxGeometry(1, 1, 1)
    //let cube = new Mesh(boxGeom, new MeshNormalMaterial(), {color: new Color(0x00ffff)});
    const cube = new Mesh(boxGeom, currentNodeMaterial)
    cube.position.set(centroid.x, centroid.y, centroid.z)
    currentCube = cube
    lastCube = cube
    renderedCubes.push(cube)
    scene.add( cube )
    centroidToCubes[centroidToString()] = cube

    render()
}

export const initializeCubeCanvas = (sceneConfig) => {
    initializeCanvas(sceneConfig)
    initializeScene()
}

export const resetSceneCube = (sceneConfig) => {
    centroid = {x: 0, y: 0, z: 0}
    renderedCubes = []
    centroidToCubes = {}

    resetSceneObjects(sceneConfig)

    initializeScene()
}

