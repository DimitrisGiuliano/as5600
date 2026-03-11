namespace AS5600 {

    const AS5600_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const CONFIG_REG = 0x07
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

    //% block="AS5600 raw angle"
    export function rawAngle(): number {
        return readWire(RAW_ANGLE_REG)
    }

    function fullRotationUpdate(): number {

        let currentAngle = rawAngle()
        let diff = currentAngle - previousAngle

        if (Math.abs(diff) > (0.8 * FULL_ROTATION_RAW_COUNT)) {

            if (diff > 0) {
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

    //% block="AS5600 change power mode %mode"
    export function changePowerMode(mode: number): void {

        let buf = pins.createBuffer(3)

        buf[0] = CONFIG_REG
        buf[1] = 0x00
        buf[2] = mode

        pins.i2cWriteBuffer(AS5600_ADDR, buf)

    }
}
