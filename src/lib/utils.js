export const formatNumber = (value) => {
    if (!value) return ''
    const numberString = value.toString().replace(/[^,\d]/g, '')
    const split = numberString.split(',')
    const sisa = split[0].length % 3
    let rupiah = split[0].substr(0, sisa)
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

    if (ribuan) {
        const separator = sisa ? '.' : ''
        rupiah += separator + ribuan.join('.')
    }

    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
}

export const unformatNumber = (formattedValue) => {
    if (!formattedValue) return 0
    // Handle number type input
    if (typeof formattedValue === 'number') return formattedValue

    // Remove "Rp" and spaces
    let clean = formattedValue.toString().replace(/Rp\s?/g, '').trim()

    // If it contains ONLY digits, return parsed int
    if (/^\d+$/.test(clean)) return parseInt(clean)

    // Standard Indonesian format: 1.000.000 (dots as separators)
    // Remove dots, then parse
    if (clean.includes('.') && !clean.includes(',')) {
        return parseInt(clean.replace(/\./g, ''))
    }

    // Standard Decimal format: 1,000,000.00 or 1000000.00
    // Try to sanitize string first
    // Default strategy: remove non-numeric chars except comma and dot
    // If it looks like 1.234.567, replace dots with nothing. 
    // If it looks like 1,234,567, replace commas with nothing.

    // Simplest robust way for this app (assuming IDR input from our formatNumber):
    // Our formatNumber uses dots for thousands. So remove dots.
    return parseInt(clean.replace(/\./g, '').replace(/,/g, '.')) || 0
}
