import Isomer from "isomer"

const { Point, Path, Color, Canvas, Shape } = Isomer

let moves = [], iso, moves3d=[], iso3d
const flatColor = new Color(50, 60, 160);
const c = new Color(160, 60, 50);

function numericallyZero(x) {
    return Math.abs(x) <= 0.0000001
}


function pathIsFlat(path) {
    return (
        numericallyZero(path.points[0].z) &&
        numericallyZero(path.points[1].z) &&
        numericallyZero(path.points[2].z) &&
        numericallyZero(path.points[3].z)
    )
}


function applyRotations(path) {
    let centroid = new Point(0, 0, 0)
    let flat = false
    moves.forEach(move => {
        // this is what unrolling means: any flat faces remain flat
        let computations = moveToRotation(move, centroid)
        let offset = computations.offset
        let effectiveCentroid = Object.assign({}, centroid)
        effectiveCentroid.x += offset.x
        effectiveCentroid.y += offset.y

        centroid = computations.centroid

        console.log({move, moves, computations, path})

        if (pathIsFlat(path)) {
            flat = true
        }
        else {
            if (move.direction == 'x') { path = path.rotateX(effectiveCentroid, move.sign * Math.PI/2) }
            if (move.direction == 'y') { path = path.rotateY(effectiveCentroid, move.sign * Math.PI/2) }
        }
    })

    return {path, flat}
}

export const drawUnfoldedCube2d = () => {
    const canvas = new Canvas(document.getElementById("cube2d"))
    iso = new Isomer(document.getElementById("cube2d"), {
        scale: 70,
        originX: canvas.width/2, 
        originY: canvas.height/2, 
    });

    let centroid = {x: 0, y: 0}
    let flatSquare  = new Path([
        Point(0, 0, 0),
        Point(1, 0, 0),
        Point(1, 1, 0),
        Point(0, 1, 0),
    ])
    iso.add(flatSquare, flatColor)

    moves.forEach(move => {
        if (move.direction == 'x') {
            centroid.y += move.sign
        }
        else if (move.direction == 'y') {
            centroid.x += move.sign
        }

        console.log({move, centroid})

        iso.add(flatSquare.translate(centroid.x, centroid.y, 0), flatColor)
    })
}

export const drawUnfoldedCube3d = () => {
    const canvas = new Canvas(document.getElementById("cube3d"))
    iso3d = new Isomer(document.getElementById("cube3d"), {
        scale: 70,
        originX: canvas.width/2, 
        originY: canvas.height/2, 
    });

    let centroid = {x: 0, y: 0, z:0}
    let cube = Shape.Prism(new Point(0, 0, 0))
    iso3d.add(cube, flatColor)

    moves3d.forEach(move => {
        if (move.direction == 'x') {
            centroid.x += move.sign
        }
        else if (move.direction == 'y') {
            centroid.y += move.sign
        }
        else if (move.direction == 'z') {
            centroid.z += move.sign
        }


        cube = Shape.Prism(new Point(centroid.x, centroid.y, centroid.z))
        iso3d.add(cube)
    })
}


export const performUnfolding = (move) => {
    moves.push(move)
    iso.canvas.clear()
    drawUnfoldedCube2d()
}

export const undoUnfoldingMove = () => {
    moves.pop()
    iso.canvas.clear()
    drawUnfoldedCube2d()
}

export const performUnfolding3d = (move) => {
    moves3d.push(move)
    iso3d.canvas.clear()
    drawUnfoldedCube3d()
}

export const undoUnfoldingMove3d = () => {
    moves3d.pop()
    iso3d.canvas.clear()
    drawUnfoldedCube3d()
}


export const moveToRotation = (move, oldCentroid) => {
    // move = {direction: (x|y), sign: (+1 | -1)}
    let centroid = Object.assign({}, oldCentroid)
    let offset = {x: 0, y: 0}
    if (move.direction == 'x') {
        centroid.y += move.sign 

        if (move.sign == 1) {
            offset.y = 1
        }
    }
    if (move.direction == 'y') {
        centroid.x += move.sign

        if (move.sign == -1) {
            offset.x = 1
        }
    }

    return {centroid, offset}
}


export const drawCube2d = () => {
    const canvas = new Canvas(document.getElementById("cube2d"))
    iso = new Isomer(document.getElementById("cube2d"), {
        scale: 70,
        originX: canvas.width/2, 
        originY: canvas.height/2, 
    });

    var rotateProp = -0.9


    // bottom
    let rotBottom  = applyRotations(new Path([
        Point(0, 0, 0),
        Point(1, 0, 0),
        Point(1, 1, 0),
        Point(0, 1, 0),
    ]))
    let colorBottom = rotBottom.flat ? flatColor : c
    iso.add(rotBottom.path, colorBottom)


    // back right
    let rotBackRight = applyRotations(new Path([
        Point(1, 0, 0),
        Point(1, 1, 0),
        Point(1, 1, 1),
        Point(1, 0, 1),
    ]))
    let colorBackRight = rotBackRight.flat ? flatColor : c
    iso.add(rotBackRight.path, colorBackRight)


    // back left
    let rotBackLeft = applyRotations(new Path([
        Point(0, 1, 0),
        Point(1, 1, 0),
        Point(1, 1, 1),
        Point(0, 1, 1),
    ]))
    let colorBackLeft = rotBackLeft.flat ? flatColor : c
    iso.add(rotBackLeft.path, colorBackLeft)

    // front right
    let rotFrontRight = applyRotations(new Path([
        Point(0, 0, 0),
        Point(1, 0, 0),
        Point(1, 0, 1),
        Point(0, 0, 1),
    ]))
    let colorFrontRight = rotFrontRight.flat ? flatColor : c
    iso.add(rotFrontRight.path, colorFrontLeft)


    // front left
    let rotFrontLeft = applyRotations(new Path([
        Point(0, 0, 0),
        Point(0, 0, 1),
        Point(0, 1, 1),
        Point(0, 1, 0),
    ]))
    let colorFrontLeft = rotFrontLeft.flat ? flatColor : c
    iso.add(rotFrontLeft.path, colorFrontLeft)

    // top
    let rotTop = applyRotations(new Path([
        Point(0, 0, 1),
        Point(1, 0, 1),
        Point(1, 1, 1),
        Point(0, 1, 1),
    ]))
    let colorTop = rotTop.flat ? flatColor : c
    iso.add(rotTop.path, colorTop)
}

