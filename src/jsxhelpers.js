export const setPointColor = (p, color) => {
    p.setAttribute({
        fillColor: color,
        strokeColor: color,
        highlightStrokeColor: color,
        highlightFillColor: color,
    })
}
