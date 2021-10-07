import range from "lodash/range"

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
    let indices = range(2*dim)
    let ix = getOppositePoint(i, dim)

    indices[0] = i
    indices[i] = dim
    indices[dim] = ix
    indices[ix] = 0

    return indices
}
