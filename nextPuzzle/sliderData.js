'use strict';

class pieceData {
    static enums = makeEnum(["sq1", "sq2", "sq3", "tee", "el", "bigHollowSq", "el90", "r3x1"]);
    static shapes = [
        // sq1
        [
            [0, 0]
        ],
        // sq2
        [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1]
        ],
        // sq3
        [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 0],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1]
        ],
        // tee
        [
            [-1, 0],
            [0, 0],
            [1, 0],
            [0, -1]
        ],
        // el
        [
            [0, 2],
            [0, 1],
            [0, 0],
            [1, 0]
        ],
        // bigHollowSq
        [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [1, 3],
            [2, 3],
            [3, 3],
            [3, 2],
            [3, 1],
            [3, 0],
            [2, 0],
            [1, 0],
            [1, 1],
        ],
        // el90
        [
            [0, 0],
            [-1, 0],
            [0, 1],
        ],
        // r3x1
        [
            [0, 0],
            [1, 0],
            [2, 0],
        ]
    ]; 

    // boards
    static pieceDataArrArr = [
        // test puzzle engw
        { 
            piecePos: [
                {pos: [0, 4], move: false, color: "black", shapeIdx: pieceData.enums.sq1},
                {pos: [1, 3], move: true, color: "green", shapeIdx: pieceData.enums.el90},
                {pos: [0, 1], move: true, color: "blue", shapeIdx: pieceData.enums.r3x1},
            ],
            boardSize: [7, 5],
            name: "levelm",
        },
        // test
        { 
            piecePos: [
                {pos: [2, 1], move: true, color: "red", shapeIdx: pieceData.enums.sq1},
                {pos: [6, 1], move: true, color: "green", shapeIdx: pieceData.enums.sq3},
                {pos: [3, 2], move: true, color: "blue", shapeIdx: pieceData.enums.el},
                {pos: [1, 2], move: true, color: "yellow", shapeIdx: pieceData.enums.tee},
                {pos: [0, 0], move: true, color: "pink", shapeIdx: pieceData.enums.sq1},
                {pos: [2, 5], move: false, color: "black", shapeIdx: pieceData.enums.sq1}, // can't move this piece
            ],
            boardSize: [8, 6],
            name: "test",
        },
        // more
        {
            piecePos: [
                {pos: [1, 2], move: true, color: "yellow", shapeIdx: pieceData.enums.tee},
                {pos: [0, 0], move: true, color: "pink", shapeIdx: pieceData.enums.sq1},
            ],
            boardSize: [5, 4],
            name: "smaller",
        }
    ];
};
