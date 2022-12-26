// ===================================================================
// Distance Calculation Helper Functions
// -------------------------------------
// Coordinates are Cartesian: (x,y)
// ===================================================================

const [NEST_X, NEST_Y] = [normaliseToMeter(250000), normaliseToMeter(250000)]
const NDZ_RADIUS = 100

function normaliseToMeter(millimeter) {
    return millimeter / 1000
}

function calculateDistanceToNest(dronePosition) {
    const [droneX, droneY] = dronePosition
    return Math.sqrt((droneX - NEST_X) ** 2 + (droneY - NEST_Y) ** 2)
}

function violatesNDZ(distance) {
    return distance <= NDZ_RADIUS
}

module.exports = {calculateDistanceToNest, normaliseToMeter, violatesNDZ}