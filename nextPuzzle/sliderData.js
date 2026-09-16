'use strict';

class pieceData {
    static shapes = {
        sq1 :
            [
                [0, 0]
            ]
        ,
        sq2 :
            [
                [0, 0],
                [1, 0],
                [0, 1],
                [1, 1]
            ]
        ,
        sq3 :
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [1, 2],
                [2, 2],
            ]
        ,
        r2x1 :
            [
                [0, 0],
                [1, 0],
            ]
        ,
        r1x2:
            [
                [0, 0],
                [0, 1],
            ]
        ,
        r3x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
            ]
        ,      
        r4x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ]
        ,      
        r5x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
            ]
        ,      
        r6x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
            ]
        ,      
        r7x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
            ]
        ,      
        r8x1:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
                [7, 0],
            ]
        ,      
        r3x2:
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [0, 1],
                [1, 1],
                [2, 1],
            ]
        ,
        r3x4 :
            [
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
            ]
        ,
        el2 :
            [
                [0, 2],
                [0, 1],
                [0, 0],
                [1, 0]
            ]
        ,
        el :
            [
                [0, 1],
                [0, 0],
                [1, 0]
            ]
        ,
        el90 :
            [
                [0, 0],
                [-1, 0],
                [0, 1],
            ]
        ,
        el180 :
            [
                [0, 0],
                [-1, 0],
                [0, -1],
            ]
        ,
        el270 :
            [
                [0, 0],
                [1, 0],
                [0, -1],
            ]
        ,
        bigel :
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [1, 2],
            ]
        ,
        bigel90 :
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [0, 1],
                [1, 1],
                [2, 1],
                [2, 2],
                [1, 2],
            ]
        ,
        bigel180 :
            [
                [1, 2],
                [0, 0],
                [1, 0],
                [-1, 1],
                [0, 1],
                [1, 1],
                [-1, 2],
                [0, 2],
            ]
        ,
        bigel270 :
            [
                [0, 0],
                [1, 0],
                [2, 2],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [1, 2],
            ]
        ,
        tee :
            [
                [-1, 0],
                [0, 0],
                [1, 0],
                [0, -1]
            ]
        ,
        littleDemon :
            [
                [0, 0],
                [1, 0],
                [2, 0],
                [0, 1],
                [1, 1],
                [2, 1],
                [0, 2],
                [2, 2],
            ]
        ,
        bigDemon :
            [
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
    static pieceDataArrArr = [
        // test puzzle engw
        {
            name: "smallheart",
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
            name: "levele",
            boardSize: [7, 5],
            piecePos: [
                {pos: [1, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [1, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [2, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 3], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 2], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [0, 4], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 3], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 2], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [6, 4], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        {
            name: "level08",
            boardSize: [10, 6],
            piecePos: [
                {pos: [0, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [6, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [9, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [0, 3], id: 0, color: "green", shapeData: pieceData.shapes.bigel90},
                {pos: [3, 3], id: 1, color: "blue", shapeData: pieceData.shapes.bigel90},
                {pos: [6, 3], id: 2, color: "darkred", shapeData: pieceData.shapes.bigel90},
                {pos: [0, 0], id: 3, color: "blue", shapeData: pieceData.shapes.sq2},
                {pos: [8, 0], id: 3, color: "blue", shapeData: pieceData.shapes.sq2},
            ],
            goalPos: [
                {pos: [6, 3], id: 0, color: "green", shapeData: pieceData.shapes.bigel90},
                {pos: [0, 3], id: 2, color: "darkred", shapeData: pieceData.shapes.bigel90},
            ],
        },

        {
            name: "level07",
            boardSize: [15, 10],
            piecePos: [
                {pos: [0, 9], id: 0, color: "green", shapeData: pieceData.shapes.r4x1},
                {pos: [0, 8], id: 1, color: "green", shapeData: pieceData.shapes.r5x1},
                {pos: [0, 7], id: 2, color: "green", shapeData: pieceData.shapes.r6x1},
                {pos: [0, 6], id: 3, color: "green", shapeData: pieceData.shapes.r7x1},
                {pos: [0, 5], id: 4, color: "green", shapeData: pieceData.shapes.r8x1},
            ],
            goalPos: [
                {pos: [11, 0], id: 0, color: "green", shapeData: pieceData.shapes.r4x1},
                {pos: [10, 1], id: 1, color: "green", shapeData: pieceData.shapes.r5x1},
                {pos: [9, 2], id: 2, color: "green", shapeData: pieceData.shapes.r6x1},
                {pos: [8, 3], id: 3, color: "green", shapeData: pieceData.shapes.r7x1},
                {pos: [7, 4], id: 4, color: "green", shapeData: pieceData.shapes.r8x1},
            ],
        },

        {
            name: "level06",
            boardSize: [9, 11],
            piecePos: [
                {pos: [3, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 0], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [1, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [4, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [5, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [7, 10], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
                {pos: [3, 8], id: 0, color: "darkred", shapeData: pieceData.shapes.r3x2},
                {pos: [0, 4], id: 2, color: "blue", shapeData: pieceData.shapes.sq3},
                {pos: [0, 0], id: 3, color: "blue", shapeData: pieceData.shapes.r3x4},
                {pos: [6, 0], id: 6, color: "green", shapeData: pieceData.shapes.r3x4},
                {pos: [6, 4], id: 5, color: "green", shapeData: pieceData.shapes.littleDemon},
                {pos: [0, 7], id: 1, color: "blue", shapeData: pieceData.shapes.bigDemon},
                {pos: [6, 7], id: 4, color: "green", shapeData: pieceData.shapes.bigDemon},
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
            name: "level05",
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
            name: "level04",
            boardSize: [4, 5],
            piecePos: [
                {pos: [1, 3], id: 3, color: "peru", shapeData: pieceData.shapes.sq2},
                {pos: [1, 0], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 3], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [1, 1], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 0, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 3], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [1, 2], id: 2, color: "darkred", shapeData: pieceData.shapes.r2x1},
                {pos: [0, 1], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
                {pos: [3, 1], id: 1, color: "blue", shapeData: pieceData.shapes.r1x2},
            ],
            goalPos: [
                {pos: [1, 0], id: 3, color: "peru", shapeData: pieceData.shapes.sq2},
            ],
        },

        { 
            name: "level03",
            boardSize: [4, 5],
            piecePos: [
                {pos: [1, 0], id: 3, color: "peru", shapeData: pieceData.shapes.sq2},
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
                {pos: [1, 3], id: 3, color: "peru", shapeData: pieceData.shapes.sq2},
            ],
        },

        { 
            name: "level02",
            boardSize: [4, 3],
            piecePos: [
                {pos: [0, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 2], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 9, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 10, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 11, color: "green", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 2], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 9, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 10, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 11, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "level01",
            boardSize: [4, 2],
            piecePos: [
                {pos: [3, 0], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 1], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [3, 1], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 0], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "eight",
            boardSize: [3, 3],
            piecePos: [
                {pos: [0, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "aband",
            boardSize: [3, 3],
            piecePos: [
                {pos: [0, 1], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 2], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [0, 2], id: 1, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 2], id: 2, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 2], id: 3, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 1], id: 4, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 1], id: 5, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [2, 1], id: 6, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [0, 0], id: 7, color: "green", shapeData: pieceData.shapes.sq1},
                {pos: [1, 0], id: 8, color: "green", shapeData: pieceData.shapes.sq1},
            ],
        },

        { 
            name: "levelm",
            boardSize: [7, 5],
            piecePos: [
                {pos: [1, 3], id: 0, color: "green", shapeData: pieceData.shapes.el90},
                {pos: [0, 1], id: 1, color: "blue", shapeData: pieceData.shapes.r3x1},
                {pos: [0, 4], id: -1, color: "black", shapeData: pieceData.shapes.sq1},
            ],
            goalPos: [
                {pos: [6, 0], id: 0, color: "green", shapeData: pieceData.shapes.el90},
                {pos: [2, 0], id: 1, color: "blue", shapeData: pieceData.shapes.r3x1},
            ],
        },
        // test
        { 
            name: "test",
            boardSize: [8, 6],
            piecePos: [
                {pos: [2, 1], id: 0, color: "darkred", shapeData: pieceData.shapes.sq1},
                {pos: [5, 0], id: 1, color: "green", shapeData: pieceData.shapes.sq3},
                {pos: [3, 2], id: 2, color: "blue", shapeData: pieceData.shapes.el2},
                {pos: [1, 2], id: 3, color: "yellow", shapeData: pieceData.shapes.tee},
                {pos: [0, 0], id: 4, color: "pink", shapeData: pieceData.shapes.sq1},
                {pos: [2, 5], id: -1, color: "black", shapeData: pieceData.shapes.sq1}, // can't move this piece
            ],
            goalPos: [
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
        }
    ];
};
