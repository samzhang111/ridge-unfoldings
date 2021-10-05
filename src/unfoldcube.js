import _ from "lodash"

const N_2D = 3
const N_3D = 4

export const getOppositePoint = (i, n) => {
    return (i + n) % (2*n)
}

export const absoluteIndexToDirection2d = (i) => {
    // based off which ridge to unfold against,
    // return the updates in coordinates

    if (i == 1) {return {direction: 'x', sign: 1}}
    if (i == 2) {return {direction: 'y', sign: -1}}
    if (i == 4) {return {direction: 'x', sign: -1}}
    if (i == 5) {return {direction: 'y', sign: 1}}
}

export const absoluteIndexToDirection3d = (i) => {
    // based off which ridge to unfold against,
    // return the updates in coordinates

    if (i == 1) {return {direction: 'x', sign: 1}}
    if (i == 2) {return {direction: 'y', sign: 1}}
    if (i == 3) {return {direction: 'z', sign: 1}}
    if (i == 5) {return {direction: 'x', sign: -1}}
    if (i == 6) {return {direction: 'y', sign: -1}}
    if (i == 7) {return {direction: 'z', sign: -1}}
}

export const indicesAfterRidgeMove = (i, dim) => {
    // returns array of indices after moving point. dim-dimensional cube
    let indices = _.range(2*dim)
    let ix = getOppositePoint(i, dim)

    indices[0] = i
    indices[i] = dim
    indices[dim] = ix
    indices[ix] = 0

    return indices
}

export const unproposeMove3d = (i, boardObjectGetter, config) => {
    let boardObjects = boardObjectGetter()
    let { points, validEdges, treeEdges, board, boardState, pathOrder3d } = boardObjects
    if (boardState.moved3d) { 
        boardState.moved3d = false
        return 
    }

    if (!boardState.proposed3d) { return }
    if (treeEdges.length == 0) { return }
    if (!boardState.internal) {
        treeEdges.pop()
    }

    boardState.proposed3d = false

    const clickedNodeNewIndex = pathOrder3d.indexOf(i)
    const move = absoluteIndexToDirection3d(clickedNodeNewIndex)

    undoUnfoldingMove3d(move, boardState.internal)
    redrawBoard(boardState.currentNode, boardObjects, config)
}

