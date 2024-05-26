const log = require('./log.js')
const x = module.exports

const { readFile, access, mkdir, writeFile, constants: { R_OK } } = require('node:fs/promises')

const pathFrom = pathLikeString => pathLikeString.split('/').slice(0, -1).join('/')

x.readCachedEtag = async({ cacheFile, cacheEtagFile }) => {
    if (!cacheEtagFile || !cacheFile) return null
    const [ cachedEtag, cacheFileExists ] = await Promise.all([ readCacheEtagFile(cacheEtagFile), isCacheFileReadable(cacheFile) ])
    return cacheFileExists ? cachedEtag : null
}

x.readContentFromFile = file => {
    log('- readContent', { file })
    return readFile(file, 'utf-8')
}

async function readCacheEtagFile (file) {
    try { return await x.readContentFromFile(file, 'utf-8') }
    catch (e) {
        log(...(
            e.code === 'ENOENT' ? ['- readCacheEtagFile', { fileDoesNotExist: file }]
                : ['- readCacheEtagFileError', { errCode: e.code, file }]
        ))
    }
}

async function isCacheFileReadable (file) {
    try { return await access(file, R_OK).then(() => true) }
    catch (e) {
        log(...(
            e.code === 'ENOENT' ? ['- isCacheFileReadable', { fileDoesNotExist: file }]
                : log('- isCacheFileReadableError', { errCode: e.code, file })
        ))
        return false
    }
}

async function createFile (fileName, data) {
    await mkdir(pathFrom(fileName), { recursive: true })
    await writeFile(fileName, data)
    return data
}

x.fetchWithEtag = async (url, fetchEtag) => {
    log('- fetchWithEtag', { etag: fetchEtag })
    try {
        const res = await fetch(url, fetchEtag ? { headers: { 'If-None-Match': fetchEtag } } : undefined)
        const { status, headers, statusText } = res
        const etag = headers.get('etag')
        log('- fetchResponse', { status, statusText, etag })
        return { status, body: await res.text(), etag }
    } catch (e) {
        log('- fetchWithEtagError', { errCode: e.code, url })
        return { status: 408, body: '', etag: undefined }
    }
}

x.fetch = async (url) => {
    log('- fetch', { url })
    const res = await fetch(url)
    const { status, statusText, body } = res
    log('- fetchResponse', { status, statusText })
    return { status, stream: res.body }
}

x.saveCache = async ({ cacheEtagFile, cacheFile, etag, body }) => {
    log('- saveCache', { cacheEtagFile, cacheFile, etag })
    createFile(cacheEtagFile, etag)
    return createFile(cacheFile, body)
}

