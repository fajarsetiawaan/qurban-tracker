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
    return parseInt(formattedValue.toString().replace(/\./g, '').replace(/,/g, '.')) || 0
}
