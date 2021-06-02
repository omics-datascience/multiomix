/**
 * Generates a regression line for the current correlation graph
 * @param values_x X values
 * @param values_y Y values
 * @returns Line points
 */
const findLineByLeastSquares = (values_x: number[], values_y: number[]): number[][] => {
    const values_length = values_x.length

    if (values_length !== values_y.length) {
        throw new Error('The parameters values_x and values_y need to have same size!')
    }

    // If it's empty, nothing to do
    if (values_length === 0) {
        return [[], []]
    }

    let sum_x = 0
    let sum_y = 0
    let sum_xy = 0
    let sum_xx = 0
    let count = 0

    // We'll use those variables for faster read/write access
    let x = 0
    let y = 0

    /*
    * Calculate the sum for each of the parts necessary.
    */
    for (let v = 0; v < values_length; v++) {
        x = values_x[v]
        y = values_y[v]
        sum_x += x
        sum_y += y
        sum_xx += x * x
        sum_xy += x * y
        count++
    }

    /*
    * Calculate m and b for the formula:
    * y = x * m + b
    */
    const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x)
    const b = (sum_y / count) - (m * sum_x) / count

    // We will make the x and y result line now
    return values_x.map((x) => [x, x * m + b])
}

export { findLineByLeastSquares }
