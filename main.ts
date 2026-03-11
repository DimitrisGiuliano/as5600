namespace AS5600 {

    const SENSOR_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const CONFIG_REG = 0x07
    const FULL_ROTATION_RAW_COUNT = 4095

    let previousAngle = 0
    let rotations = 0

    let lastTime = 0
    let lastAngle = 0
    let lastSpeed = 0

    let speedValue = 0
    let accelValue = 0


    //% block="initialize AS5600"
    export function init(): void {

        pins.i2cFrequency(100000)

        previousAngle = readRaw()
        rotations = 0

        lastAngle = totalDegrees()
        lastTime = input.runningTime()
        lastSpeed = 0

    }


    function readRaw(): number {

        let reg = pins.createBuffer(1)
        reg[0] = RAW_ANGLE_REG

        pins.i2cWriteBuffer(SENSOR_ADDR, reg, true)

        let data = pins.i2cReadBuffer(SENSOR_ADDR, 2)

        return ((data[0] << 8) | data[1]) & 0x0FFF

    }


    //% block="AS5600 raw angle"
    export function rawAngle(): number {

        return readRaw()

    }


    function updateRotation(): void {

        let current = readRaw()
        let diff = current - previousAngle

        if (diff > 2048) {
            rotations -= 1
        }

        if (diff < -2048) {
            rotations += 1
        }

        previousAngle = current

    }


    //% block="AS5600 angle degrees"
    export function angle(): number {

        return readRaw() * 360 / FULL_ROTATION_RAW_COUNT

    }


    //% block="AS5600 total degrees"
    export function totalDegrees(): number {

        updateRotation()

        return rotations * 360 + angle()

    }


    function updateMotion(): void {

        let now = input.runningTime()
        let dt = (now - lastTime) / 1000

        if (dt <= 0) return

        let angleNow = totalDegrees()

        speedValue = (angleNow - lastAngle) / dt
        accelValue = (speedValue - lastSpeed) / dt

        lastAngle = angleNow
        lastSpeed = speedValue
        lastTime = now

    }


    //% block="AS5600 speed (deg/s)"
    export function speed(): number {

        updateMotion()
        return speedValue

    }


    //% block="AS5600 acceleration (deg/s²)"
    export function acceleration(): number {

        updateMotion()
        return accelValue

    }


    //% block="reset AS5600 zero"
    export function reset(): void {

        previousAngle = readRaw()
        rotations = 0

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
