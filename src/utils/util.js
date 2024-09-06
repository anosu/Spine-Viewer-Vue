export const getById = (id) => {
    return document.getElementById(id)
}

export const createTag = (e) => {
    return document.createElement(e)
}

export const getFileUrl = (filePath) => {
    // return `http://localhost:${port}/${filePath.replaceAll('\\', '/')}`
    console.log(filePath)
    return filePath.replaceAll('\\', '/')
}

export const getUrlsByPaths = (paths) => {
    return paths.map(p => getFileUrl(p))
}

export const makeSwitcher = (initial, trueAction, falseAction) => {
    let state = initial
    return function (...args) {
        state ? trueAction(...args) : falseAction(...args)
        state = !state
    }
}

export const swap = (array, i, j) => {
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
}