namespace AS5600 {

    const SENSOR_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const CONFIG_REG = 0x07
    const FULL_ROTATION_RAW_COUNT = 4095

    let previousAngle = 0
    let rotationsCount = 0

    let lastTime = 0
    let lastAngle = 0
    let lastSpeed = 0

    let currentSpeed = 0
    let currentAcceleration = 0


    //% block="initialize AS5600"
    export function init(): void {

        pins.i2cFrequency(100000)

        previousAngle = rawAngle()
        rotationsCount = 0

        lastAngle = totalDegrees()
        lastTime = input.runningTime()

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


    function updateRotation(): void {

        let current = rawAngle()
        let diff = current - previousAngle

        if (Math.abs(diff) > 2048) {

            if (diff > 0) {
                rotationsCount -= 1
            } else {
                rotationsCount += 1
            }

        }

        previousAngle = current
    }


    //% block="AS5600 angle degrees"
    export function angle(): number {

        return rawAngle() * 360 / FULL_ROTATION_RAW_COUNT

    }


    //% block="AS5600 total degrees"
    export function totalDegrees(): number {

        updateRotation()

        return (rotationsCount * 360) + angle()

    }


    function updateMotion(): void {

        let now = input.runningTime()
        let dt = (now - lastTime) / 1000

        if (dt <= 0) return

        let angleNow = totalDegrees()

        let speed = (angleNow - lastAngle) / dt
        let accel = (speed - lastSpeed) / dt

        currentSpeed = speed
        currentAcceleration = accel

        lastAngle = angleNow
        lastSpeed = speed
        lastTime = now
    }


    //% block="AS5600 speed (deg/s)"
    export function speed(): number {

        updateMotion()
        return currentSpeed

    }


    //% block="AS5600 acceleration (deg/s²)"
    export function acceleration(): number {

        updateMotion()
        return currentAcceleration

    }


    //% block="reset AS5600 zero"
    export function reset(): void {

        previousAngle = rawAngle()
        rotationsCount = 0
        lastAngle = totalDegrees()
        lastSpeed = 0
        lastTime = input.runningTime()

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
