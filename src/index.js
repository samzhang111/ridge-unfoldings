import JXG from "jsxgraph"
import {setPointColor} from "./jsxhelpers"
import {
    indicesAfterRidgeMove, getOppositePoint, absoluteIndexToDirection3d
} from "./unfoldcube"

import {initializeCanvas, performUnfolding3d, undoUnfoldingMove3d} from "./3d"

let path = [], path3d=[], points = [], points3d = [], pathOrder = _.range(6), pathOrder3d = _.range(8), moved=false, proposed=false, moved3d=false, proposed3d=false
let edges = [], pathLines = []
let edges3d = [], pathLines3d = []


const getName = (i, n) => {
    if (i <= n) {
        return `${i}`
    }

    return `${i - n}'`
}


const redrawBoard = (i, points, path, board) => {
    let localPathLines
    if (points.length == 6) {
        localPathLines = pathLines
    }
    else if (points.length == 8) {
        localPathLines = pathLines3d
    }

    localPathLines.forEach(line => line.remove())
    for (let j=1; j<path.length; j++) {
        localPathLines.push(board.create("line", [points[path[j - 1]], points[path[j]]], {
                    straightFirst: false,
                    straightLast: false,
                    strokeColor: 'black',
                    highlightStrokeColor: 'black',
                    dash: 0,
                    strokeWidth: 4,
        }))
    }

    points.forEach(point => {
        setPointColor(point, "red")
    })

    path.forEach(i => {
        setPointColor(points[i], "black")
    })

    let n = points.length / 2
    setPointColor(points[getOppositePoint(path[path.length - 1], n)], "black")
    setPointColor(points[i], "blue")
    createRobertsGraphEdges(i, points, board)
}



const proposeMove3d = (i, points, board) => {
    if (i == getOppositePoint(path3d[path3d.length - 1], points.length/2)) {
        return
    }

    if (path3d.indexOf(i) != -1) {
        return
    }

    path3d.push(i)

    redrawBoard(i, points, path3d, board)
    const clickedNodeNewIndex = pathOrder3d.indexOf(i)

    let reorder = indicesAfterRidgeMove(clickedNodeNewIndex, points.length / 2)

    const move = absoluteIndexToDirection3d(clickedNodeNewIndex)
    performUnfolding3d(move)

    proposed3d = true
}

const unproposeMove3d = (i, points, board) => {
    if (moved3d) { 
        moved3d = false
        return 
    }
    if (!proposed3d) { return }
    if (path3d.length == 0) { return }

    path3d.pop()
    undoUnfoldingMove3d()
    redrawBoard(path3d[path3d.length - 1], points, path3d, board)
}

const makeMove3d = (i, points, board) => {
    proposed3d = false
    if (i == getOppositePoint(path3d[path3d.length - 1], points.length/2)) {
        return
    }

    if (_.dropRight(path3d).indexOf(i) != -1) {
        return
    }

    moved3d = true

    const clickedNodeNewIndex = pathOrder3d.indexOf(i)

    let reorder = indicesAfterRidgeMove(clickedNodeNewIndex, points.length / 2)
    let newOrder = []
    for (let i = 0; i<reorder.length; i++) {
        newOrder.push(pathOrder3d[reorder[i]])
    }

    pathOrder3d = newOrder
}


const createPoints = (n, board) => {
    let proposer, unproposer, mover
    if (n == 3) {
        proposer = proposeMove
        unproposer = unproposeMove
        mover = makeMove
    }
    else if (n == 4) {
        proposer = proposeMove3d
        unproposer = unproposeMove3d
        mover = makeMove3d
    }

    let points = []
    for (let i=1; i<=2*n; i++) {
        let angle = ((i - n) * 2 * Math.PI / (2*n))
        let x = Math.cos(angle)
        let y = Math.sin(angle)
        let p = board.create('point',[x, y], {
            name: i-1,//getName(i, n),
            size:8,
            fixed: true,
        });
        points.push(p)
    }

    for (let i=0; i<points.length; i++) {
        points[i].on("mouseover", () => { proposer(i, points, board) } )
        points[i].on("mouseout", () => { unproposer(i, points, board) } )
        points[i].on("mousedown", () => { mover(i, points, board) } )
        points[i].on("touchstart", () => { mover(i, points, board) } )
    }

    if (n == 3) {
        path.push(0)
        redrawBoard(0, points, path, board)
    }
    else if (n == 4) {
        path3d.push(0)
        redrawBoard(0, points, path3d, board)
    }

    return points
}


const createRobertsGraphEdges = (i, points, board) => {
    let localEdges, localPath
    if (points.length == 6) {
        localEdges = edges
        localPath = path
    }
    else if (points.length == 8) {
        localEdges = edges3d
        localPath = path3d
    }

    localEdges.forEach(edge => edge.remove())

    for (let j=0; j<points.length; j++) {
        if ((j == getOppositePoint(i, points.length/2)) || (j == i) || _.dropRight(localPath).indexOf(j) != -1) {
            continue
        }

        let line = board.create("line", [points[i], points[j]], {
            straightFirst: false,
            straightLast: false,
            strokeColor: 'black',
            highlightStrokeColor: 'black',
            dash: 4,
            strokeWidth: 1,
        })
        localEdges.push(line)
    }

    return localEdges
}

const resizeCanvas = () => {
    const cube3dcontainer = document.getElementById("cube3dcontainer")
    const cube3d = document.getElementById("cube3d")

    cube3d.width = cube3dcontainer.scrollWidth * 2
    cube3d.height = cube3dcontainer.scrollHeight * 2

    console.log({w: cube3d.width})
}

JXG.Options.text.fontSize = 20;
// 2d
const boardWidth = 1.1
const board3d = JXG.JSXGraph.initBoard("cubecontrols3d", {boundingbox: [-boardWidth, boardWidth, boardWidth, -boardWidth], showCopyright: false, zoomX: 0.9, zoomY: 0.9, showNavigation: false, showInfobox: false});
points3d = createPoints(4, board3d)
resizeCanvas()
initializeCanvas()

M.AutoInit();
