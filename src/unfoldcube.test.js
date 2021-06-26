import { absoluteIndexToDirection2d, indicesAfterRidgeMove } from "./unfoldcube"

test.each([
    [1, {direction: 'x', sign: 1}],
    [2, {direction: 'y', sign: 1}],
    [4, {direction: 'x', sign: -1}],
    [5, {direction: 'y', sign: -1}]
])("Index of points corresponds to rolling in specific directions with certain signs", (ix, direction) => {
    expect(absoluteIndexToDirection2d(ix)).toEqual(direction)
})

test("Some ridge moves rotate points clockwise", () => {
    expect(indicesAfterRidgeMove(1, 3)).toEqual([1, 3, 2, 4, 0, 5])
})

test("Some ridge moves rotate points counter-clockwise", () => {
    expect(indicesAfterRidgeMove(4, 3)).toEqual([4, 0, 2, 1, 3, 5])
})
