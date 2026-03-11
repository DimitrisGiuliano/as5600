namespace AS5600 {

    const SENSOR_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const CONFIG_REG = 0x07
    const FULL_ROTATION_RAW_COUNT = 4095

    let previousAngle = 0
        let fullRotation = 0

    let prevTime = input.runningTime() // in ms
    let prevTotalDegrees = 0
    let prevSpeed = 0

    //% block="initialize AS5600"
    export function init(): void {
        previousAngle = rawAngle()
        fullRotation = 0
        prevTotalDegrees = totalDegrees()
        prevTime = input.runningTime()
        prevSpeed = 0
        
    }

    function readWire(register: number): number {
        let buf = pins.createBuffer(1)
        buf[0] = register
        pins.i2cWriteBuffer(SENSOR_ADDR, buf, true)
        let data = pins.i2cReadBuffer(SENSOR_ADDR, 2)
        return ((data[0] << 8) | data[1]) & 0x0FFF
    }

    //% block="AS5600 raw angle"
    export function rawAngle(): number {
        return readWire(RAW_ANGLE_REG)
    }

    //% block="AS5600 angle degrees"
    export function angle(): number {
        return rawAngle() * 360 / FULL_ROTATION_RAW_COUNT
    }

    function updateRotations(): void {
        let current = rawAngle()
        let diff = current - previousAngle
        if (Math.abs(diff) > 2048) {
            if (diff > 0) {
                fullRotation -= 1
            } else {
                fullRotation += 1
            }
        }
        previousAngle = current
    }

    //% block="AS5600 cumulative raw angle"
    export function cumulativeRaw(): number {
        updateRotations()
        return fullRotation * (FULL_ROTATION_RAW_COUNT + 1) + previousAngle
    }

    //% block="AS5600 cumulative degrees"
    export function totalDegrees(): number {
        return cumulativeRaw() * 360 / (FULL_ROTATION_RAW_COUNT + 1)
    }

    //% block="AS5600 cumulative radians"
    export function totalRadians(): number {
        return totalDegrees() * (Math.PI / 180)
    }

    //% block="AS5600 reset zero"
    export function resetZero(): void {
        previousAngle = rawAngle()
        fullRotation = 0
        prevTotalDegrees = totalDegrees()
        prevTime = input.runningTime()
        prevSpeed = 0
    }

    //% block="AS5600 speed (deg/sec)"
    export function speed(): number {
        let currentTime = input.runningTime()
        let dt = (currentTime - prevTime) / 1000 // seconds
        if (dt <= 0) return prevSpeed

        let dAngle = totalDegrees() - prevTotalDegrees
        // handle wrapping
        if (dAngle > 180) dAngle -= 360
        if (dAngle < -180) dAngle += 360

        let currentSpeed = dAngle / dt
        prevTime = currentTime
        prevTotalDegrees = totalDegrees()
        prevSpeed = currentSpeed
        return currentSpeed
    }

   //% block="AS5600 acceleration (deg/sec²)"
export function acceleration(): number {

    let currentTime = input.runningTime()
    let dt = (currentTime - prevTime) / 1000
    if (dt <= 0) return 0

    let currentDegrees = totalDegrees()
    let dAngle = currentDegrees - prevTotalDegrees

    // handle wrapping
    if (dAngle > 180) dAngle -= 360
    if (dAngle < -180) dAngle += 360

    let currentSpeed = dAngle / dt

    let accel = (currentSpeed - prevSpeed) / dt

    // update stored values AFTER calculation
    prevSpeed = currentSpeed
    prevTotalDegrees = currentDegrees
    prevTime = currentTime

    return accel
}

    //% block="AS5600 change power mode %mode"
    export function changePowerMode(mode: number): void {
        let buf = pins.createBuffer(3)
        buf[0] = CONFIG_REG
        buf[1] = 0
        buf[2] = mode
        pins.i2cWriteBuffer(SENSOR_ADDR, buf)
    }
}
