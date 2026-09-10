'use strict';

class pieceData {
    static enums = makeEnum(["sq1", "sq2", "sq3", "tee", "el", "bigHollowSq"]);
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
    ]; 

    // boards
    static pieceDataArrArr = [
        // test
        { 
            piecePos: [
                {pos: [2, 1], color: "red", shapeIdx: pieceData.enums.sq1},
                {pos: [6, 1], color: "green", shapeIdx: pieceData.enums.sq3},
                {pos: [3, 2], color: "blue", shapeIdx: pieceData.enums.el},
                {pos: [1, 2], color: "yellow", shapeIdx: pieceData.enums.tee},
                {pos: [0, 0], color: "pink", shapeIdx: pieceData.enums.sq1},
                //{pos: [1, 1], color: "peru", shapeIdx: pieceData.enums.bigHollowSq},
            ],
            boardSize: [8, 6],
            name: "test",
        },
        // more
        {
            piecePos: [
                {pos: [1, 2], color: "yellow", shapeIdx: pieceData.enums.tee},
                {pos: [0, 0], color: "pink", shapeIdx: pieceData.enums.sq1},
            ],
            boardSize: [5, 4],
            name: "smaller",
        }
    ];
};
