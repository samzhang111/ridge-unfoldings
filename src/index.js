import JXG from "jsxgraph"
import {
    indicesAfterRidgeMove, getOppositePoint, absoluteIndexToDirection3d
} from "./unfoldcube"
import { createPoints, createControllerEdges, redrawBoard, proposeMove3d, unproposeMove3d, makeMove3d, createEdges } from "./shared-controls"
import {initializeCubeCanvas, performUnfolding3d, undoUnfoldingMove3d, resetScene} from "./three-cube"

/***************************
 * Initialization shared across all polytopes
***************************/

let board3d
let visitedNodes=[0], points3d = [], pathOrder3d = _.range(8)
let edges3d = [], pathLines3d = []
let treeEdges = []
let validEdges = []
let boardState = {
    currentNode: 0,
    internal: false,
    moved3d: false,
    proposed3d: false,
}
let cubeConfiguration = {}

const getBoardObjects = () => {
    return {
        points: points3d,
        pathOrder3d,
        validEdges,
        treeEdges,
        board: board3d,
        boardState,
        visitedNodes,
    }
}

const resetAll = () => {
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
    pathOrder3d = _.range(8)
    edges3d = []
    pathLines3d = []
    treeEdges = []
    validEdges = []

    let boardObjects = getBoardObjects()
    points3d = createPoints(4, getBoardObjects, cubeConfiguration)

    boardObjects = getBoardObjects()
    validEdges = createEdges(boardObjects, cubeConfiguration)
    resetScene()
}

/***************************
 * Cube specific functions
***************************/

const isValidMoveRobertsGraph = (i, j) => {
    return (i != j) && (i != getOppositePoint(j, points3d.length/2))
}

const makeCubeUnfolding = (index, boardState) => {
    const move = absoluteIndexToDirection3d(index)
    performUnfolding3d(move, boardState.internal)
}

const undoCubeUnfolding = (index, boardState) => {
    const move = absoluteIndexToDirection3d(index)
    undoUnfoldingMove3d(move, boardState.internal)
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

cubeConfiguration = {
    proposer: proposeMove3d,
    unproposer: unproposeMove3d,
    isValidMove: isValidMoveRobertsGraph,
    unfolder: makeCubeUnfolding,
    undoUnfold: undoCubeUnfolding,
    mover: makeCubeMove,
}

/***************************
 * Generic view setup
***************************/

JXG.Options.text.fontSize = 20;
const boardWidth = 1.1
board3d = JXG.JSXGraph.initBoard("controls", {boundingbox: [-boardWidth, boardWidth, boardWidth, -boardWidth], showCopyright: false, zoomX: 0.9, zoomY: 0.9, showNavigation: false, showInfobox: false});
points3d = createPoints(4, getBoardObjects, cubeConfiguration)
validEdges = createEdges(getBoardObjects(), cubeConfiguration)
initializeCubeCanvas()

M.AutoInit();

let resetButton = document.querySelector(".reset-button")
resetButton.addEventListener("click", resetAll)
