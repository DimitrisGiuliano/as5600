namespace AS5600 {

    const AS5600_ADDR = 0x36
    const RAW_ANGLE_REG = 0x0C
    const FULL_ROTATION = 4096

    let previousAngle = 0
    let rotationsCount = 0
    let filteredAngle = 0
    let initialized = false


    //% block="initialize AS5600"
    export function init(): void {

        previousAngle = readRaw()
        filteredAngle = previousAngle
        rotationsCount = 0
        initialized = true

    }


    function readRaw(): number {

        let reg = pins.createBuffer(1)
        reg[0] = RAW_ANGLE_REG

        pins.i2cWriteBuffer(AS5600_ADDR, reg, true)

        let data = pins.i2cReadBuffer(AS5600_ADDR, 2)

        let value = (data[0] << 8) | data[1]

        return value & 0x0FFF

    }


    function filteredRaw(): number {

        let raw = readRaw()

        filteredAngle = (filteredAngle * 3 + raw) >> 2

        return filteredAngle

    }


    function updateRotations(): void {

        let current = filteredRaw()

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


    //% block="AS5600 raw value"
    export function raw(): number {

        return filteredRaw()

    }


    //% block="AS5600 angle degrees"
    export function angle(): number {

        return filteredRaw() * 360 / FULL_ROTATION

    }


    //% block="AS5600 rotations"
    export function rotations(): number {

        updateRotations()
        return rotationsCount

    }


    //% block="AS5600 total angle degrees"
    export function totalDegrees(): number {

        updateRotations()

        return rotationsCount * 360 + angle()

    }


    //% block="reset AS5600 zero"
    export function reset(): void {

        previousAngle = filteredRaw()
        rotationsCount = 0

    }

}
