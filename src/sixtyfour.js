sixtyFour = (() => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz-_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return {
        fromNumber,
        fromHex
    }

    function fromNumber (number, maxLength = 8) {
        number = Math.abs(number)
        let s = ''
        while (number > 0 && s.length < maxLength) {
            const i = number % 64
            s = chars[i] + s
            number = Math.trunc(number / 64)
        }
        return s.padStart(maxLength, '0')
    }

    function fromHex (hex, maxLength) {
        return fromNumber(Number.parseInt(hex, 16), maxLength)
    }
})()