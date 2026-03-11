namespace AS5600 {

    const SENSOR_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const DEGREE_ANGLE_REG = 0x0E
    const CONFIG_REG = 0x07

    const SENSOR_RESOLUTION = 12
    const FULL_ROTATION_RAW_COUNT = (1 << SENSOR_RESOLUTION) - 1

    let previousAngle = 0
    let fullRotation = 0


    //% block="initialize AS5600"
    export function init(): void {

        pins.i2cFrequency(100000)
        previousAngle = rawAngle()

    }


    function readWire(register: number): number {

        let buf = pins.createBuffer(1)
        buf[0] = register

        pins.i2cWriteBuffer(SENSOR_ADDR, buf, true)

        let data = pins.i2cReadBuffer(SENSOR_ADDR, 2)

        let MSB = data[0]
        let LSB = data[1]

        return ((MSB << 8) | LSB) & 0x0FFF
    }


    //% block="AS5600 raw angle"
    export function rawAngle(): number {

        return readWire(RAW_ANGLE_REG)

    }


    //% block="AS5600 angle degrees"
    export function degreeAngle(): number {

        return rawAngle() * 360 / FULL_ROTATION_RAW_COUNT

    }


    function fullRotationUpdate(): number {

        let currentAngle = rawAngle()
        let angleDifference = currentAngle - previousAngle

        if (Math.abs(angleDifference) > (0.8 * FULL_ROTATION_RAW_COUNT)) {

            if (angleDifference > 0) {
                fullRotation -= 1
            } else {
                fullRotation += 1
            }

        }

        previousAngle = currentAngle

        return fullRotation

    }


    //% block="AS5600 cumulative raw angle"
    export function cumulativeRawAngle(): number {

        return (fullRotationUpdate() * FULL_ROTATION_RAW_COUNT) + previousAngle

    }


    //% block="AS5600 cumulative degrees"
    export function cumulativeDegreeAngle(): number {

        return (cumulativeRawAngle() / FULL_ROTATION_RAW_COUNT) * 360

    }


    //% block="AS5600 cumulative radians"
    export function cumulativeRadianAngle(): number {

        return (cumulativeRawAngle() / FULL_ROTATION_RAW_COUNT) * 6.28318530718

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
