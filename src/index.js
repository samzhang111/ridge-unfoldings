import JXG from "jsxgraph"
import { createPoints, createControllerEdges, redrawBoard, makeMove3d, createEdges } from "./shared-controls"
import {resetSceneObjects } from "./shared-three"
import {initializeCubeCanvas, performUnfoldingCube, undoUnfoldingCube, resetSceneCube} from "./three-cube"
import {initializeSimplexCanvas, performUnfoldingSimplex, undoUnfoldingSimplex, resetSceneSimplex} from "./three-plex"
import { indicesAfterRidgeMove, getOppositePoint, absoluteIndexToDirection3d } from "./unfoldcube"
import { directionFromCenterSign } from "./unfoldplex"
import range from "lodash/range"

/***************************
 * Initialization shared across all polytopes
***************************/

let board3d
let visitedNodes=[0], points3d = [], pathOrder3d = range(8)
let treeEdges = []
let validEdges = []
let boardState = {
    currentNode: 0,
    internal: false,
    moved3d: false,
    proposed3d: false,
}
let cubeConfig = {}
let simplexConfig = {}
let orthoConfig = {}
let selectedShape = "cube"

const getBoardObjects = () => {
    return {
        points: points3d,
        validEdges,
        treeEdges,
        board: board3d,
        boardState,
        visitedNodes,
    }
}

const clearAll = (config) => {
    points3d.forEach(point => {
        board3d.removeObject(point)
    })

    validEdges.forEach(edge => {
        board3d.removeObject(edge)
    })

    boardState = {
        currentNode: 0,
        internal: false,
        moved3d: false,
        proposed3d: false,
    }

    visitedNodes=[0]
    points3d = []
    pathOrder3d = config.defaultPathOrder
    treeEdges = []
    validEdges = []
}

const resetAll = () => {
    selectShape(selectedShape)
}

/***************************
 * Cube specific functions
***************************/

const isValidMoveRobertsGraph = (i, j) => {
    return (i != j) && (i != getOppositePoint(j, points3d.length/2))
}

const makeCubeUnfolding = (index, boardState) => {
    const absoluteIndex = pathOrder3d.indexOf(index)
    const move = absoluteIndexToDirection3d(absoluteIndex)
    performUnfoldingCube(move, boardState.internal)
}

const undoCubeUnfolding = (index, boardState) => {
    const absoluteIndex = pathOrder3d.indexOf(index)
    const move = absoluteIndexToDirection3d(absoluteIndex)
    undoUnfoldingCube(move, boardState.internal)
}

const makeCubeMove = (i, boardObjectGetter, config) => {
    makeMove3d(i, boardObjectGetter, config)

    const clickedNodeNewIndex = pathOrder3d.indexOf(i)
    let reorder = indicesAfterRidgeMove(clickedNodeNewIndex, points3d.length / 2)
    let newOrder = []
    for (let i = 0; i<reorder.length; i++) {
        newOrder.push(pathOrder3d[reorder[i]])
    }
 
    pathOrder3d = newOrder

    redrawBoard(i, getBoardObjects(), config)
}


/***************************
 * Simplex specific functions
***************************/

const isValidMoveSimplex = (i, j) => {
    return (i != j)
}

const makeSimplexUnfolding = (index, boardState) => {
    const direction = directionFromCenterSign(index, pathOrder3d.center, pathOrder3d.sign)
    performUnfoldingSimplex(direction, boardState.internal)
}

const undoSimplexUnfolding = (index, boardState) => {
    const direction = directionFromCenterSign(index, boardState.currentNode, pathOrder3d.sign * -1)
    undoUnfoldingSimplex(direction, boardState.internal)
}

const makeSimplexMove = (i, boardObjectGetter, config) => {
    makeMove3d(i, boardObjectGetter, config)

    pathOrder3d.center = i
    pathOrder3d.sign *= -1

    redrawBoard(i, getBoardObjects(), config)
}

/***************************
 * Orthoplex specific functions
***************************/

const orthoplexCoords = [
    [0, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 0, 1, 1],
    [0, 1, 0, 0],
    [0, 1, 0, 1],
    [0, 1, 1, 0],
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 0],
    [1, 1, 0, 1],
    [1, 1, 1, 0],
    [1, 1, 1, 1],
]

const directions = ["x", "y", "z", "w"]

const whichIndexChanged = (orth1, orth2) => {
    /* orth1 and orth2 are both arrays with four elements 
     * 
     * if their hamming distance is 1, return the index that changed
     * if their hamming distance is not 1, return -1
     * */

    let changedCoord = -1
    for (let i = 0; i < orth1.length; i++) {
        if (orth1[i] != orth2[i]) {
            if (changedCoord == -1) {
                changedCoord = i
            }
            else {
                return -1
            }
        }
    }

    return changedCoord
}

const makeOrthoplexUnfolding = (index, boardState) => {
    let orth1 = orthoplexCoords[boardState.currentNode]
    let orth2 = orthoplexCoords[index]
    let changedCoord = whichIndexChanged(orth1, orth2)

    const direction = directions[changedCoord]
    performUnfoldingSimplex(direction, boardState.internal)
}

const undoOrthoplexUnfolding = (index, boardState) => {
    let orth1 = orthoplexCoords[boardState.currentNode]
    let orth2 = orthoplexCoords[index]
    let changedCoord = whichIndexChanged(orth1, orth2)

    const direction = directions[changedCoord]
    undoUnfoldingSimplex(direction, boardState.internal)
}

const makeOrthoplexMove = (i, boardObjectGetter, config) => {
    makeMove3d(i, boardObjectGetter, config)

    redrawBoard(i, getBoardObjects(), config)
}


const isValidMoveOrthoplex = (i, j) => {
    let orth1 = orthoplexCoords[i]
    let orth2 = orthoplexCoords[j]

    let changedCoord = whichIndexChanged(orth1, orth2)

    return (changedCoord != -1)
}



/***************************
 * Configurations
***************************/

cubeConfig = {
    isValidMove: isValidMoveRobertsGraph,
    unfolder: makeCubeUnfolding,
    undoUnfold: undoCubeUnfolding,
    mover: makeCubeMove,
    defaultPathOrder: range(8),
    sceneConfiguration: {
        cameraX: 5,
        cameraY: 6,
        cameraZ: 7,
    }
}

simplexConfig = {
    isValidMove: isValidMoveSimplex,
    unfolder: makeSimplexUnfolding,
    undoUnfold: undoSimplexUnfolding,
    mover: makeSimplexMove,
    defaultPathOrder: {
        center: 0,
        sign: 1,
    },
    sceneConfiguration: {
        cameraX: 3,
        cameraY: 4,
        cameraZ: 5,
    }
}

orthoConfig = {
    isValidMove: isValidMoveOrthoplex,
    unfolder: makeOrthoplexUnfolding,
    undoUnfold: undoOrthoplexUnfolding,
    mover: makeOrthoplexMove,
    defaultPathOrder: [],
    sceneConfiguration: {
        cameraX: 5,
        cameraY: 6,
        cameraZ: 7,
    }
}

/***************************
 * Generic view setup
***************************/

JXG.Options.text.fontSize = 20;
const boardWidth = 1.1
board3d = JXG.JSXGraph.initBoard("controls", {boundingbox: [-boardWidth, boardWidth, boardWidth, -boardWidth], showCopyright: false, zoomX: 0.9, zoomY: 0.9, showNavigation: false, showInfobox: false});
points3d = createPoints(8, getBoardObjects, cubeConfig)
pathOrder3d = range(8)
validEdges = createEdges(getBoardObjects(), cubeConfig)
initializeCubeCanvas(cubeConfig.sceneConfiguration)

M.AutoInit();

let resetButton = document.querySelector(".reset-button")
resetButton.addEventListener("click", resetAll)

const SELECTED_CLASS = "blue"

const selectShape = (shape) => {
    selectedShape = shape

    /*******
    // Change colors of buttons
    *******/
    document.querySelectorAll(".shape-selector").forEach(sel => {
        if (sel.classList.contains(SELECTED_CLASS)) {
            sel.classList.remove(SELECTED_CLASS)
        }
    })

    let selectedShapeElem = document.querySelector(`#select-${shape}`)
    selectedShapeElem.classList.add(SELECTED_CLASS)

    /*******
    // Reset app using relevant configuration
    *******/

    let config 
    let numPoints

    if (shape == "cube") {
        resetSceneCube(cubeConfig.sceneConfiguration)

        clearAll(cubeConfig)
        points3d = createPoints(8, getBoardObjects, cubeConfig)
        validEdges = createEdges(getBoardObjects(), cubeConfig)
        initializeCubeCanvas(cubeConfig.sceneConfiguration)
    }
    else if (shape == "simplex") {
        resetSceneSimplex(simplexConfig.sceneConfiguration)

        clearAll(simplexConfig)
        points3d = createPoints(5, getBoardObjects, simplexConfig)
        validEdges = createEdges(getBoardObjects(), simplexConfig)
        initializeSimplexCanvas(simplexConfig.sceneConfiguration)
    }
    else if (shape == "orthoplex") {
        resetSceneSimplex(orthoConfig.sceneConfiguration)

        clearAll(orthoConfig)
        points3d = createPoints(16, getBoardObjects, orthoConfig)
        validEdges = createEdges(getBoardObjects(), orthoConfig)
        initializeSimplexCanvas(orthoConfig.sceneConfiguration)
    }

}

document.querySelector("#select-cube").addEventListener("click", () => selectShape("cube"))
document.querySelector("#select-simplex").addEventListener("click", () => selectShape("simplex"))
document.querySelector("#select-orthoplex").addEventListener("click", () => selectShape("orthoplex"))
