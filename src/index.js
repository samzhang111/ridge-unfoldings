import JXG from "jsxgraph"
import {setPointColor} from "./jsxhelpers"
import {
    indicesAfterRidgeMove, getOppositePoint, absoluteIndexToDirection3d
} from "./unfoldcube"

import {initializeCanvas, performUnfolding3d, undoUnfoldingMove3d} from "./3d"

let visitedNodes=[], points3d = [], pathOrder3d = _.range(8), moved3d=false, proposed3d=false
let edges3d = [], pathLines3d = []
let treeEdges = [], internal = false

// this holds onto the current node
// start on 0
let currentNode = 0

const getName = (i, n) => {
    if (i <= n) {
        return `${i}`
    }

    return `${i - n}'`
}


const redrawBoard = (i, points, path, board) => {
    pathLines3d.forEach(line => line.remove())
    for (let j=0; j<path.length; j++) {
        pathLines3d.push(board.create("line", [points[path[j][0]], points[path[j][1]]], {
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

    path.forEach(pair => {
        let x = pair[0]
        let y = pair[1]

        setPointColor(points[x], "black")
        setPointColor(points[y], "black")

        if (x == i) {
            setPointColor(points[y], "#990000")
        }
        else if (y == i) {
            setPointColor(points[x], "#990000")
        }
    })

    let n = points.length / 2
    setPointColor(points[getOppositePoint(i, n)], "black")
    setPointColor(points[i], "blue")
    createRobertsGraphEdges(i, points, board)
}


const isUnorderedPairInArray = (pair, array) => {
    return _.find(array, function(edge) { return (Math.min(edge[0], edge[1]) == Math.min(pair[0], pair[1])) && (Math.max(edge[0], edge[1]) == Math.max(pair[0], pair[1])) })
}

const proposeMove3d = (i, points, board) => {
    // cannot propose move to opposite node
    if (i == getOppositePoint(currentNode, points.length/2)) {
        return
    }

    //cannot propose to current node
    if (i == currentNode) {
        return
    }

    internal = false

    if (isUnorderedPairInArray([i, currentNode], treeEdges)) {
        // okay, moving to another node in path
        internal = true
    }
    else if (visitedNodes.indexOf(i) != -1) {
        // cannot propose to visited node if it's not an internal move
        return
    }
    else {
        // making a totally new move:
        treeEdges.push([currentNode, i])
    }

    redrawBoard(i, points, treeEdges, board)
    const clickedNodeNewIndex = pathOrder3d.indexOf(i)

    const move = absoluteIndexToDirection3d(clickedNodeNewIndex)
    performUnfolding3d(move, internal)

    proposed3d = true
}

const unproposeMove3d = (i, points, board) => {
    if (moved3d) { 
        moved3d = false
        return 
    }

    if (!proposed3d) { return }
    if (treeEdges.length == 0) { return }
    if (!internal) {
        treeEdges.pop()
    }

    proposed3d = false

    const clickedNodeNewIndex = pathOrder3d.indexOf(i)
    const move = absoluteIndexToDirection3d(clickedNodeNewIndex)

    undoUnfoldingMove3d(move, internal)
    redrawBoard(currentNode, points, treeEdges, board)
}

const makeMove3d = (i, points, board) => {
    proposed3d = false

    // cannot make move to current node
    if (i == currentNode) {
        return
    }

    // cannot make move to opposite node
    if (i == getOppositePoint(currentNode, points.length/2)) {
        return
    }

    // cannot move to non-internal 
    if ((!internal) && visitedNodes.indexOf(i) != -1) {
        // otherwise, not allowed to visit other nodes on the path
        return
    }

    moved3d = true

    if (!internal) {
        visitedNodes.push(i)
    }

    const clickedNodeNewIndex = pathOrder3d.indexOf(i)

    let reorder = indicesAfterRidgeMove(clickedNodeNewIndex, points.length / 2)
    let newOrder = []
    for (let i = 0; i<reorder.length; i++) {
        newOrder.push(pathOrder3d[reorder[i]])
    }

    pathOrder3d = newOrder
    currentNode = i
    console.log({currentNode})
    redrawBoard(i, points, treeEdges, board)
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

    visitedNodes.push(0)
    redrawBoard(0, points, treeEdges, board)

    return points
}


const createRobertsGraphEdges = (i, points, board) => {
    let localEdges
    localEdges = edges3d
    localEdges.forEach(edge => edge.remove())

    for (let j=0; j<points.length; j++) {
        // can't move to opposite point
        if (j == getOppositePoint(i, points.length/2)) {
            continue
        }

        // can't move to self
        if (j == i) {
            continue
        }

        // can't move to visited nodes
        if (_.dropRight(visitedNodes).indexOf(j) != -1) {
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
}

JXG.Options.text.fontSize = 20;

const boardWidth = 1.1
const board3d = JXG.JSXGraph.initBoard("cubecontrols3d", {boundingbox: [-boardWidth, boardWidth, boardWidth, -boardWidth], showCopyright: false, zoomX: 0.9, zoomY: 0.9, showNavigation: false, showInfobox: false});
points3d = createPoints(4, board3d)
resizeCanvas()
initializeCanvas()

M.AutoInit();
