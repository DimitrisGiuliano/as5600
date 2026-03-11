namespace AS5600 {

    const AS5600_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const FULL_ROTATION_RAW_COUNT = 4096

    let previousAngle = 0
    let fullRotation = 0

    //% block="initialize AS5600"
    export function init(): void {
        previousAngle = rawAngle()
    }

    function readWire(register: number): number {

        let regBuf = pins.createBuffer(1)
        regBuf[0] = register

        pins.i2cWriteBuffer(AS5600_ADDR, regBuf)

        let data = pins.i2cReadBuffer(AS5600_ADDR, 2)

        return (data[0] << 8) | data[1]
    }

    function rawAngle(): number {
        return readWire(RAW_ANGLE_REG)
    }

    //% block="angle (degrees)"
    export function angleDegrees(): number {

        let raw = rawAngle()

        return raw * 360 / FULL_ROTATION_RAW_COUNT
    }

    function fullRotationUpdate(): number {

        let currentAngle = rawAngle()
        let diff = currentAngle - previousAngle

        if (Math.abs(diff) > 3000) {

            if (diff > 0) {
                fullRotation -= 1
            } else {
                fullRotation += 1
            }

        }

        previousAngle = currentAngle
        return fullRotation
    }

    //% block="total rotations"
    export function rotations(): number {

        fullRotationUpdate()
        return fullRotation

    }

    //% block="total angle (degrees)"
    export function totalDegrees(): number {

        return rotations() * 360 + angleDegrees()

    }

}
