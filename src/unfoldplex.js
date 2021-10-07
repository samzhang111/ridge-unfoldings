export const directionsFromCenterSign = (center, sign) => {
    let arr = ["i", "x", "y", "z", "w"]

    if (sign == -1) {
        arr = ["i", "w", "z", "y", "x"]
    }

    for (let i = 0; i<center; i++) {
        arr.unshift(arr.pop())
    }

    return arr
}

export const directionFromCenterSign = (i, center, sign) => {
    let directions = directionsFromCenterSign(center, sign)
    return directions[i]
}
