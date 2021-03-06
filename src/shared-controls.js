import JXG from "jsxgraph"
import {setPointColor} from "./jsxhelpers"
import find from "lodash/find"

//const CURRENT_NODE_COLOR = "green"
const CURRENT_NODE_COLOR = "#FF8600"
const VISITABLE_NODE_COLOR = "#039be5"
const VISITABLE_NODE_COLOR_INTERIOR = "#026c9f"
const UNVISITABLE_NODE_COLOR = "black"
const UNVISITABLE_NODE_COLOR_INTERIOR = "#333333"


/*********
 * Handling edges:
*********/


export const createEdges = (boardObjects, config) => {
    let edges = initializeControllerEdges(boardObjects, config)
    boardObjects.validEdges = edges
    redrawBoard(0, boardObjects, config)

    return edges
}


const initializeControllerEdges = (boardObjects, config) => {
    let {board, points} = boardObjects
    let edges = []
    for (let i=0; i<points.length; i++) {
        let row = []
        for (let j=i+1; j<points.length; j++) {
            let line
            if (config.isValidMove(j, i)) {
                line = board.create("line", [points[i], points[j]], {
                    straightFirst: false,
                    straightLast: false,
                    strokeColor: 'black',
                    highlightStrokeColor: 'black',
                    strokeWidth: 0.3,
                    fixed: true,
                })
            }

            row.push(line)
        }

        edges.push(row)
    }

    return edges
}


export const createControllerEdges = (i, boardObjects, config) => {
    let { points, validEdges, treeEdges, board } = boardObjects
    for (let j=0; j<points.length; j++) {
        for (let k=j+1; k<points.length; k++) {
            let strokeWidth = 0.3
            if (!config.isValidMove(k, j)) {
                continue
            }

            // This shows the available edges that can be traversed to, but it
            // looks better without it.
            /*
            if ((_.dropRight(visitedNodes).indexOf(j) == -1 && k == i) ||
                (_.dropRight(visitedNodes).indexOf(k) == -1 && j == i)) {
                strokeWidth = 3
            }
            */

            validEdges[j][k - j - 1].setAttribute({strokeWidth, strokeColor: 'black', highlightStrokeColor: 'black'})
        }
    }

    for (let j=0; j<treeEdges.length; j++) {
        let edge = treeEdges[j]
        let x = Math.min(edge[0], edge[1])
        let y = Math.max(edge[0], edge[1])

        validEdges[x][y - x - 1].setAttribute({strokeWidth: 4, strokeColor: VISITABLE_NODE_COLOR_INTERIOR, highlightStrokeColor: VISITABLE_NODE_COLOR_INTERIOR})
    }
}

/*********
 * Handling points:
*********/

export const createPoints = (n, boardObjectGetter, config) => {
    let points = []
    let boardObjects = boardObjectGetter()
    for (let i=1; i<=n; i++) {
        let angle = (((n - 1)/2 + i) * 2 * Math.PI / n)
        if (n % 2 == 1) {
            angle = (((n - 1/2)/2 + i) * 2 * Math.PI / n)
        }
        let x = Math.cos(angle)
        let y = Math.sin(angle)
        let p = boardObjects.board.create('point',[x, y], {
            name: '',
            size:20,
            fixed: true,
            color: CURRENT_NODE_COLOR,
        });
        points.push(p)
    }

    for (let i=0; i<points.length; i++) {
        points[i].on("mouseover", () => { proposeMove3d(i, boardObjectGetter, config) } )
        points[i].on("mouseout", () => { unproposeMove3d(i, boardObjectGetter, config) } )
        points[i].on("mousedown", () => { config.mover(i, boardObjectGetter, config) } )
    }

    return points
}

/*********
 * Redraw board
*********/

export const redrawBoard = (i, boardObjects, config) => {
    let { points, treeEdges, board } = boardObjects
    points.forEach(point => {
        setPointColor(point, VISITABLE_NODE_COLOR)
    })

    for (let j = 0; j < points.length; j++) {
        if (!config.isValidMove(i, j)) {
            setPointColor(points[j], UNVISITABLE_NODE_COLOR)
        }
    }

    let validNodes = []
    treeEdges.forEach(pair => {
        let x = pair[0]
        let y = pair[1]

        if (x == i) {
            setPointColor(points[y], VISITABLE_NODE_COLOR_INTERIOR)
            validNodes.push(y)
        }
        else if (y == i) {
            setPointColor(points[x], VISITABLE_NODE_COLOR_INTERIOR)
            validNodes.push(x)
        }
        else {
            if (validNodes.indexOf(x) == -1) {
                setPointColor(points[x], UNVISITABLE_NODE_COLOR_INTERIOR)
            }

            if (validNodes.indexOf(y) == -1) {
                setPointColor(points[y], UNVISITABLE_NODE_COLOR_INTERIOR)
            }
        }
    })

    setPointColor(points[i], CURRENT_NODE_COLOR)
    createControllerEdges(i, boardObjects, config)
}


/*********
 * Proposing, unproposing, and moving:
*********/

const isUnorderedPairInArray = (pair, array) => {
    return find(array, function(edge) { return (Math.min(edge[0], edge[1]) == Math.min(pair[0], pair[1])) && (Math.max(edge[0], edge[1]) == Math.max(pair[0], pair[1])) })
}

export const unproposeMove3d = (i, boardObjectGetter, config) => {
    let boardObjects = boardObjectGetter()
    let { points, validEdges, treeEdges, board, boardState } = boardObjects
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

    config.undoUnfold(i, boardState)
    redrawBoard(boardState.currentNode, boardObjects, config)
}


export const proposeMove3d = (i, boardObjectGetter, config) => {
    let boardObjects = boardObjectGetter()
    let { points, validEdges, treeEdges, board, boardState, visitedNodes } = boardObjects

    // cannot double propose moves
    if (boardState.proposed3d) {
        return
    }

    if (!config.isValidMove(i, boardState.currentNode)) {
        return
    }

    boardState.internal = false

    if (isUnorderedPairInArray([i, boardState.currentNode], treeEdges)) {
        // okay, moving to another node in path
        boardState.internal = true
    }
    else if (visitedNodes.indexOf(i) != -1) {
        // cannot propose to visited node if it's not an internal move
        return
    }
    else {
        // making a totally new move:
        treeEdges.push([boardState.currentNode, i])
    }

    redrawBoard(i, boardObjects, config)
    config.unfolder(i, boardState)

    boardState.proposed3d = true
}

export const makeMove3d = (i, boardObjectGetter, config) => {
    let boardObjects = boardObjectGetter()
    let { points, validEdges, treeEdges, board, boardState, visitedNodes } = boardObjects
    boardState.proposed3d = false

    if (!config.isValidMove(i, boardState.currentNode)) {
        return
    }

    // cannot move to non-internal 
    if ((!boardState.internal) && visitedNodes.indexOf(i) != -1) {
        // otherwise, not allowed to visit other nodes on the path
        return
    }

    boardState.moved3d = true

    if (!boardState.internal) {
        visitedNodes.push(i)
    }

    boardState.currentNode = i
}
