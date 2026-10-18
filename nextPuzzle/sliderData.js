'use strict';

const even = "#f00";
const odd = "#eee";
class pieceData {
    // each element has x, y, and a fill code 0 none, 1 right, 2 up, 3 both
    // 4 left, 8 left, for non movable pieces near a border
    static shapes = {
        sq1 : [
            [0, 0]
        ],
        sq2 : [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1]
        ],
        sq3 : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
            [2, 2],
        ],
        r2x1 : [
            [0, 0],
            [1, 0],
        ],
        r1x2: [
            [0, 0],
            [0, 1],
        ],
        r3x1: [
            [0, 0],
            [1, 0],
            [2, 0],
        ],      
        r4x1: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
        ],      
        r5x1: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0],
        ],      
        r6x1: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0],
            [5, 0],
        ],      
        r7x1: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0],
            [5, 0],
            [6, 0],
        ],      
        r8x1: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0],
            [5, 0],
            [6, 0],
            [7, 0],
        ],      
        r3x2: [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
        ],
        r3x4 : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
            [2, 2],
            [0, 3],
            [1, 3],
            [2, 3],
        ],
        el2 : [
            [0, 2],
            [0, 1],
            [0, 0],
            [1, 0]
        ],
        el : [
            [0, 1],
            [0, 0],
            [1, 0]
        ],
        el90 : [
            [0, 0],
            [-1, 0],
            [0, 1],
        ],
        el180 : [
            [0, 0],
            [-1, 0],
            [0, -1],
        ],
        el270 : [
            [0, 0],
            [1, 0],
            [0, -1],
        ],
        bigel : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
        ],
        bigel90 : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 2],
            [1, 2],
        ],
        bigel180 : [
            [1, 2],
            [0, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [-1, 2],
            [0, 2],
        ],
        bigel270 : [
            [0, 0],
            [1, 0],
            [2, 2],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
        ],
        tee : [
            [-1, 0],
            [0, 0],
            [1, 0],
            [0, -1]
        ] ,
        littleDemon : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [2, 2],
        ] ,
        bigDemon : [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
            [2, 2],
            [0, 3],
            [2, 3],
        ]
    };

    // boards
    static boards = [
        { 
            name: "practice",
            boardSize: [8, 5],
            piecePos: [
                {pos: [1, 2], id: 0, color: "green", shapeData: pieceData.shapes.el90},
                {pos: [3, 2], id: 1, color: "blue", shapeData: pieceData.shapes.r3x1},
                {pos: [3, 4], id: 2, color: "red", shapeData: pieceData.shapes.r3x1},
                {pos: [0, 4], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [7, 0], id: 0, color: "green", shapeData: pieceData.shapes.el90},
                {pos: [3, 0], id: 1, color: "blue", shapeData: pieceData.shapes.r3x1},
                {pos: [0, 0], id: 2, color: "red", shapeData: pieceData.shapes.r3x1},
            ],
        },
          // /*
        
        { 
            name: "loyd42",
            boardSize: [4, 2],
            showIds: true,
            piecePos: [
                {pos: [3, 0], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 5, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 7, color: odd, shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 1], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 5, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 6, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 7, color: odd, shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "loyd33",
            boardSize: [3, 3],
            showIds: true,
            piecePos: [
                {pos: [0, 1], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 2], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 5, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 6, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 7, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 8, color: odd, shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 7, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 8, color: odd, shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "loyd43", // 5.5 seconds
            boardSize: [4, 3],
            showIds: true,
            piecePos: [
                {pos: [0, 2], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [3, 2], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 5, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 6, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 7, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 8, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 9, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 10, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 11, color: even, shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [3, 2], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 5, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 6, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 7, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 8, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 9, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 10, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 11, color: even, shapeData: pieceData.shapes.sq1},
            ],
        },

        {
            name: "smallHeart",
            boardSize: [6, 4],
            piecePos: [
                {pos: [2, 0], id: 4, color: "blue", shapeData: pieceData.shapes.el},
                {pos: [5, 0], id: 3, color: "blue", shapeData: pieceData.shapes.el90},
                {pos: [5, 3], id: 2, color: "blue", shapeData: pieceData.shapes.el180},
                {pos: [2, 3], id: 1, color: "blue", shapeData: pieceData.shapes.el270},
                {pos: [0, 1], id: 0, color: "darkred", shapeData: pieceData.shapes.sq2},
            ],
            goalPos: [
                {pos: [2, 0], id: 4, color: "blue", shapeData: pieceData.shapes.el},
                {pos: [5, 0], id: 3, color: "blue", shapeData: pieceData.shapes.el90},
                {pos: [5, 3], id: 2, color: "blue", shapeData: pieceData.shapes.el180},
                {pos: [2, 3], id: 1, color: "blue", shapeData: pieceData.shapes.el270},
                {pos: [3, 1], id: 0, color: "darkred", shapeData: pieceData.shapes.sq2},
            ],
        },

        { 
            name: "klotski", // 1 second
            boardSize: [4, 5],
            piecePos: [
                {pos: [1, 0], id: 3, color: "gray", shapeData: pieceData.shapes.sq2},
                {pos: [0, 4], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 4], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 2], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [1, 3], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 3], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 2], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [1, 2], id: 2, color: "darkred", shapeData: pieceData.shapes.r2x1},
                {pos: [0, 0], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [3, 0], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
            ],
            goalPos: [
                {pos: [1, 3], id: 3, color: "gray", shapeData: pieceData.shapes.sq2},
            ],
        },

        {
            name: "tight", // tight 'L' shapes, about 7 seconds
            boardSize: [10, 6],
            piecePos: [
                {pos: [0, 3], id: 0, color: "darkred", shapeData: pieceData.shapes.bigel90},
                {pos: [3, 3], id: 1, color: "green", shapeData: pieceData.shapes.bigel90},
                {pos: [6, 3], id: 2, color: "blue", shapeData: pieceData.shapes.bigel90},
                {pos: [0, 0], id: 3, color: "#969", shapeData: pieceData.shapes.sq2},
                {pos: [8, 0], id: 3, color: "#969", shapeData: pieceData.shapes.sq2},
                {pos: [0, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [6, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [9, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [6, 3], id: 0, color: "darkred", shapeData: pieceData.shapes.bigel90},
                {pos: [0, 3], id: 2, color: "blue", shapeData: pieceData.shapes.bigel90},
            ],
        },

        {
            name: "hanoi", // hanoi, take 93 seconds to calc
            boardSize: [15, 8],
            showIds: true,
            piecePos: [
                //{pos: [0, 9], id: 0, color: "green", shapeData: pieceData.shapes.r4x1},
                {pos: [0, 7], id: 1, color: "#0ff", shapeData: pieceData.shapes.r5x1},
                {pos: [0, 6], id: 2, color: "#0cc", shapeData: pieceData.shapes.r6x1},
                {pos: [0, 5], id: 3, color: "#099", shapeData: pieceData.shapes.r7x1},
                {pos: [0, 4], id: 4, color: "#066", shapeData: pieceData.shapes.r8x1},
            ],
            goalPos: [
                //{pos: [11, 0], id: 0, color: "green", shapeData: pieceData.shapes.r4x1},
                {pos: [10, 0], id: 1, color: "#0ff", shapeData: pieceData.shapes.r5x1},
                {pos: [9, 1], id: 2, color: "#0cc", shapeData: pieceData.shapes.r6x1},
                {pos: [8, 2], id: 3, color: "#099", shapeData: pieceData.shapes.r7x1},
                {pos: [7, 3], id: 4, color: "#066", shapeData: pieceData.shapes.r8x1},
            ],
        },

        {
            name: "largeHeart", // 3 seconds
            boardSize: [10, 6],
            piecePos: [
                {pos: [1, 2], id: 0, color: "blue", shapeData: pieceData.shapes.sq2},
                {pos: [3, 0], id: 3, color: "green", shapeData: pieceData.shapes.bigel},
                {pos: [6, 0], id: 4, color: "green", shapeData: pieceData.shapes.bigel90},
                {pos: [7, 3], id: 2, color: "green", shapeData: pieceData.shapes.bigel180},
                {pos: [3, 3], id: 1, color: "green", shapeData: pieceData.shapes.bigel270},
                {pos: [0, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [9, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [0, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [9, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [5, 2], id: 0, color: "blue", shapeData: pieceData.shapes.sq2},
                {pos: [3, 0], id: 3, color: "green", shapeData: pieceData.shapes.bigel},
                {pos: [6, 0], id: 4, color: "green", shapeData: pieceData.shapes.bigel90},
                {pos: [7, 3], id: 2, color: "green", shapeData: pieceData.shapes.bigel180},
                {pos: [3, 3], id: 1, color: "green", shapeData: pieceData.shapes.bigel270},
            ],
        },

        { 
            name: "unsolvable", // 6 seconds, no goals, exhausted
            boardSize: [3, 3],
            showIds: true,
            piecePos: [
                {pos: [0, 2], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 7, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 8, color: odd, shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: odd, shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 7, color: even, shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 8, color: odd, shapeData: pieceData.shapes.sq1},
            ],
        },
          // */

        // unused boards, take too long to solve or test boards
/*
        {
            name: "demon", // demon, takes about 4.5 minutes
            boardSize: [9, 11],
            piecePos: [
                {pos: [3, 8], id: 0, color: "darkred", shapeData: pieceData.shapes.r3x2},
                {pos: [0, 4], id: 2, color: "blue", shapeData: pieceData.shapes.sq3},
                {pos: [0, 0], id: 3, color: "blue", shapeData: pieceData.shapes.r3x4},
                {pos: [6, 0], id: 6, color: "green", shapeData: pieceData.shapes.r3x4},
                {pos: [6, 4], id: 5, color: "green", shapeData: pieceData.shapes.littleDemon},
                {pos: [0, 7], id: 1, color: "blue", shapeData: pieceData.shapes.bigDemon},
                {pos: [6, 7], id: 4, color: "green", shapeData: pieceData.shapes.bigDemon},
                {pos: [3, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [1, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [7, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [6, 4], id: 2, color: "blue", shapeData: pieceData.shapes.sq3},
                {pos: [6, 0], id: 3, color: "blue", shapeData: pieceData.shapes.r3x4},
                {pos: [0, 0], id: 6, color: "green", shapeData: pieceData.shapes.r3x4},
                {pos: [0, 4], id: 5, color: "green", shapeData: pieceData.shapes.littleDemon},
                {pos: [6, 7], id: 1, color: "blue", shapeData: pieceData.shapes.bigDemon},
                {pos: [0, 7], id: 4, color: "green", shapeData: pieceData.shapes.bigDemon},
            ],
        },

        { 
            name: "smalltest", // varies, .1 seconds, scratch
            boardSize: [8, 6],
            piecePos: [
                //{pos: [2, 1], id: 0, color: "darkred", shapeData: pieceData.shapes.sq1},
                {pos: [5, 0], id: 1, color: "green", shapeData: pieceData.shapes.sq3},
                {pos: [3, 2], id: 2, color: "blue", shapeData: pieceData.shapes.el2},
                {pos: [1, 2], id: 3, color: "yellow", shapeData: pieceData.shapes.tee},
                //{pos: [0, 0], id: 4, color: "pink", shapeData: pieceData.shapes.sq1},
                {pos: [2, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1}, // can't move this piece
            ],
            goalPos: [
            ],
        },

        {
            name: "sameids",
            boardSize: [7, 5],
            piecePos: [
                {pos: [0, 1], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 4], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 3], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [4, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 2], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [4, 2], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        // smaller test
        {
            name: "smaller",
            boardSize: [5, 4],
            piecePos: [
                {pos: [1, 2], id: 0, color: "yellow", shapeData: pieceData.shapes.tee},
                {pos: [0, 0], id: 1, color: "pink", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
            ],
        },
        // very small test
        {
            name: "verysmall",
            boardSize: [9, 1],
            piecePos: [
                {pos: [4, 0], id: 3, color: "pink", shapeData: pieceData.shapes.sq1},
                //{pos: [5, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [8, 0], id: 3, color: "pink", shapeData: pieceData.shapes.sq1},
            ],
        },
        // null test
        {
            name: "nullTest",
            boardSize: [5, 3],
            piecePos: [
            ],
            goalPos: [
            ],
        },
*/
        // can't solve for now
        // NONE
        // no boards that can't be solved !!!
    ];
};

{
    // modify some pieceData
    const touchUpHanoi = pieceData.boards.find(user => user.name === "hanoi");
    // add complicated border to hanoi, towers of hanoi puzzle
    if (touchUpHanoi) {
        // top border
        for (let j = 7; j >= 4; --j) {
            for (let i = -j + 12; i < 3 + j; ++i) {
                touchUpHanoi.piecePos.push({pos: [i, j], id: -1, color: "black", shapeData: pieceData.shapes.sq1});
            }
        }
        // bottom border
        for (let j = 0; j < 4; ++j) {
            for (let i = 0; i < 10 - j; ++i) {
                touchUpHanoi.piecePos.push({pos: [i, j], id: -1, color: "black", shapeData: pieceData.shapes.sq1});

            }
        }
    }
}

// add filler between squares of shapes
/* 
    filler directions
    1: left
    2: right
    4: down
    8: up

    16: left AND down
    32: left AND up
    64: right AND down
    128: right AND up
*/

{
    let numShapes = 0;
    const posD = vec2.create();
    for (const shapeName in pieceData.shapes) {
        //console.log("shape name = " + shapeName);
        const shape = pieceData.shapes[shapeName];
        for (let j = 0; j < shape.length; ++j) {
            const posJ = shape[j];
            posJ[2] = 0;
            for (let i = 0; i < shape.length; ++i) {
                const posI = shape[i];
                vec2.sub(posD, posI, posJ);
                if (posD[0] == 1 && posD[1] == 0) { // right
                    posJ[2] |= 2;
                }
                if (posD[0] == 0 && posD[1] == 1) { // up
                    posJ[2] |= 8;
                }
            }
        }
        // diagonal
        for (let j = 0; j < shape.length; ++j) {
            const posJ = shape[j];
            if (posJ[2] == 10) {
                for (let i = 0; i < shape.length; ++i) {
                    const posI = shape[i];
                    vec2.sub(posD, posI, posJ);
                    if (posD[0] == 1 && posD[1] == 1) { // diagonal up right
                        posJ[2] |= 128;
                    }
                }
            }
        }
        ++numShapes;
        //console.log("num shapes = " + numShapes);
    }

    // add filler for noMove pieces
    for (const board of pieceData.boards) {
        // check noMove against borders
        for (const piecePos of board.piecePos) {
            if (piecePos.id >= 0) continue;
            const pos = piecePos.pos;
            if (pos[0] == 0) piecePos.fill |= 1; // left
            if (pos[0] == board.boardSize[0] - 1) piecePos.fill |= 2; // right
            if (pos[1] == 0) piecePos.fill |= 4; // down
            if (pos[1] == board.boardSize[1] - 1) piecePos.fill |= 8; // up
            if ((piecePos.fill & 5) == 5) piecePos.fill |= 16; // left AND down
            if ((piecePos.fill & 6) == 6) piecePos.fill |= 32; // right AND down
            if ((piecePos.fill & 9) == 9) piecePos.fill |= 64; // left AND up
            if ((piecePos.fill & 10) == 10) piecePos.fill |= 128; // right AND up
        }

        // check noMove against neighbors, fill right and up
        for (let j = 0; j < board.piecePos.length; ++j) {
            const pj = board.piecePos[j];
            if (pj.id >= 0) continue;
            const pjPos = pj.pos;
            for (let i = 0; i < board.piecePos.length; ++i) {
                const pi = board.piecePos[i];
                if (pi.id >= 0) continue;
                const piPos = pi.pos;
                vec2.sub(posD, piPos, pjPos);
                if (posD[0] == 1 && posD[1] == 0) { // right
                    pj.fill |= 2;
                }
                if (posD[0] == 0 && posD[1] == 1) { // up
                    pj.fill |= 8;
                }
            }
        }
       
        // check noMove against neighbors, fill right and up diagonal
        for (let j = 0; j < board.piecePos.length; ++j) {
            const pj = board.piecePos[j];
            if (pj.id >= 0) continue;
            if ((pj.fill & 10) == 10) {
                const pjPos = pj.pos;
                for (let i = 0; i < board.piecePos.length; ++i) {
                    const pi = board.piecePos[i];
                    if (pi.id >= 0) continue;
                    const piPos = pi.pos;
                    vec2.sub(posD, piPos, pjPos);
                    if (posD[0] == 1 && posD[1] == 1) { // diagonal up right
                        pj.fill |= 128;
                    }
                }
            }
        }
        
        // check noMove against borders with neighbors, add diagonals
        for (const piecePos of board.piecePos) {
            if (piecePos.id >= 0) continue;
            const pos = piecePos.pos;
            if (pos[0] == 0 && (piecePos.fill & 8) == 8) piecePos.fill |= 64; // left AND up
            if (pos[1] == 0 && (piecePos.fill & 2) == 2) piecePos.fill |= 32; // down AND right
            if ((pos[0] == board.boardSize[0] - 1) && ((piecePos.fill & 8) == 8)) piecePos.fill |= 128; // right AND up
            if ((pos[1] == board.boardSize[1] - 1) && ((piecePos.fill & 2) == 2)) piecePos.fill |= 128; // up AND right
        }
    }
}
