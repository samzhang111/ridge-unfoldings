import flatten from "lodash/flatten"
import round from "lodash/round"
import { matrix, multiply } from "mathjs"
import { Mesh, Vector3 } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { initializeCanvas, resetSceneObjects, getThreeObjects, currentNodeMaterial, normalMaterial } from "./shared-three"

let coordsToRendered = {}
let rendered = []
let current, last, current4d, last4d

/****************************
 * Reflecting to make new simplices
****************************/

const Ax = matrix([[-1,0,0,0],[2/3,1,0,0],[2/3,0,1,0],[2/3,0,0,1]])
const Ay = matrix([[1,2/3,0,0],[0,-1,0,0],[0,2/3,1,0],[0,2/3,0,1]])
const Az = matrix([[1,0,2/3,0],[0,1,2/3,0],[0,0,-1,0],[0,0,2/3,1]])
const Aw = matrix([[1,0,0,2/3],[0,1,0,2/3],[0,0,1,2/3],[0,0,0,-1]])

/****************************
 * Projecting from 4d coordinates to 3d
****************************/

const s = -1/3 // (1 - sqrt(dim)) / (dim - 1), and dim=4
//const s = 1/3 * (1 + Math.sqrt(3 * Math.sqrt(2) - 2))// (1 - sqrt(dim)) / (dim - 1), and dim=4
const FLATTENER = matrix([
    [1, 0, 0, s],
    [0, 1, 0, s],
    [0, 0, 1, s]
])

const toThreeJsVectors = (vec3s) => {
    /* Takes a list of arrays with 3 elements.
     * Returns a list of Vector3s constructed from those arrays*/

    let result = []
    vec3s.forEach(arr3 => {
        result.push(new Vector3(arr3[0], arr3[1], arr3[2]))
    })

    return result
}

const shrinkTowardOrthocenter = (x, orthX, factor) => {
    /* factor is between 0 and 1, and explains how much to shrink by */
    return (x - orthX)*factor + orthX
}

const project = (mat, orthocenter) => {
    return toThreeJsVectors(flattenMatrixToVertexList(mat, orthocenter))
}

//const SHRINK_FACTOR = 1 / 1.2
const SHRINK_FACTOR = 1

const flattenMatrixToVertexList = (mat, orthocenter) => {
    let mat3 = multiply(FLATTENER, mat)._data
    let verts = [
        [shrinkTowardOrthocenter(mat3[0][0], orthocenter[0], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[1][0], orthocenter[1], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[2][0], orthocenter[2], SHRINK_FACTOR)],
        [shrinkTowardOrthocenter(mat3[0][1], orthocenter[0], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[1][1], orthocenter[1], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[2][1], orthocenter[2], SHRINK_FACTOR)],
        [shrinkTowardOrthocenter(mat3[0][2], orthocenter[0], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[1][2], orthocenter[1], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[2][2], orthocenter[2], SHRINK_FACTOR)],
        [shrinkTowardOrthocenter(mat3[0][3], orthocenter[0], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[1][3], orthocenter[1], SHRINK_FACTOR), shrinkTowardOrthocenter(mat3[2][3], orthocenter[2], SHRINK_FACTOR)],
    ]

    return verts
}

const findOrthocenter = (mat) => {
    return multiply(FLATTENER, multiply(mat, [0.25, 0.25, 0.25, 0.25]))._data
}

const d = matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
])

current4d = d._data
last4d = d._data

//const faces = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]]
const faces = [[2, 1, 0,], [0, 3, 2], [1, 3, 0], [2, 3, 1]]


/****************************
 * Making and undoing moves
****************************/

const performReflection = (vertexMatrix, direction) => {
    let result

    if (direction == "x") {
        result = multiply(vertexMatrix, Ax)._data
    }
    else if (direction == "y") {
        result = multiply(vertexMatrix, Ay)._data
    }
    else if (direction == "z") {
        result = multiply(vertexMatrix, Az)._data
    }
    else if (direction == "w") {
        result = multiply(vertexMatrix, Aw)._data
    }
    else {
        console.error("Invalid move direction: ", direction)
    }
    console.log({
        direction,
        oldOrth: stringifyOrthocenter(vertexMatrix),
        newOrth: stringifyOrthocenter(result)
    })

    return result
}

export const performUnfoldingSimplex = (direction, internal) => {
    /* direction: one of "x", "y", "z", or "w" */
    let {scene, controls} = getThreeObjects()

    resetMaterial()

    let newVerts = performReflection(current4d, direction)
    let coordKey = stringifyOrthocenter(newVerts)

    last = current
    last4d = current4d
    current4d = newVerts
    if (internal) {
        let simplexRef = coordsToRendered[coordKey]
        simplexRef.material = currentNodeMaterial

        current = simplexRef
        internal = true
    }
    else {

        let orth = findOrthocenter(newVerts)
        const simplexGeom =  new ConvexGeometry(project(newVerts, orth))
        const simplex = new Mesh(simplexGeom, currentNodeMaterial)

        current = simplex
        rendered.push(simplex)
        scene.add( simplex )

        coordsToRendered[stringifyOrthocenter(newVerts)] = simplex

        render()

        controls.target = new Vector3(orth[0]/2, orth[1]/2, orth[2]/2)
        //controls.target = new Vector3(2*newVerts[0][0]/3, 2*newVerts[0][1]/3, 2*newVerts[0][2]/3)
    }
    
    render()
}

export const undoUnfoldingSimplex = (lastDirection, internal) => {
    /*
     * lastDirection: "x", "y", "z", or "w" (the last move that was made)
     * internal: true or false, whether the last move was toward an already visited node
     */

    let {scene, controls} = getThreeObjects()
    if (!internal) {
        const lastRendered = rendered.pop()
        scene.remove(lastRendered)
    }

    resetMaterial()

    last.material = currentNodeMaterial
    current = last
    current4d = last4d

    let orth = findOrthocenter(current4d)
    controls.target = new Vector3(orth[0]/2, orth[1]/2, orth[2]/2)
    //controls.target = new Vector3(2*current4d[0][0]/3, 2*current4d[0][1]/3, 2*current4d[0][2]/3)
    
    render()
}


/****************************
 * Rendering and resetting
****************************/

const resetMaterial = () => {
    rendered.forEach(obj => {
        obj.material = normalMaterial
    })
}


const stringifyOrthocenter = (vertices) => {
    let orthocenter = findOrthocenter(vertices)
    let stringified = ""
    flatten(orthocenter).forEach(coord => {
        stringified += `${round(coord, 1)},`
    })

    return stringified

}

const render = () => {
    let { scene, camera, renderer } = getThreeObjects()
    renderer.render( scene, camera );
}

const initializeSimplexScene = () => {
    let {scene} = getThreeObjects()

    let orth = findOrthocenter(d)
    const simplexGeom =  new ConvexGeometry(project(d, orth))
    const simplex = new Mesh(simplexGeom, currentNodeMaterial)
    current4d = d._data
    last4d = d._data
    current = simplex
    last = simplex
    rendered.push(simplex)
    scene.add( simplex )

    coordsToRendered[stringifyOrthocenter(d._data)] = simplex

    render()
}

export const initializeSimplexCanvas = (sceneConfig) => {
    initializeCanvas(sceneConfig)
    initializeSimplexScene()
}

export const resetSceneSimplex = (sceneConfig) => {
    rendered = []
    coordsToRendered = {}

    resetSceneObjects(sceneConfig)

    initializeSimplexScene()
}
