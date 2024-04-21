const log = require('./log.js')
const { fetchSources: { STREAM, LOCAL } } = require('./constants.js')
const { readCachedEtag, fetchWithEtag, saveCache, readContentFromFile } = require('./cached-fetch.js')

async function execute ({ url, type, cacheFile, cacheEtagFile }) {
    log('[APP.fetch] =>', { url: decodeURIComponent(url), type, cacheFile, cacheEtagFile })

    const cachedEtag = await readCachedEtag({ cacheFile, cacheEtagFile })
    const { status, body, etag } = await fetchWithEtag(url, cachedEtag)

    const content = (status === 200) ? await saveCache({ cacheEtagFile, cacheFile, etag, body })
        : (status === 304) ? await readContentFromFile(cacheFile)
        : null

    const result = { source: content.length === undefined ? STREAM : LOCAL, length: content.length }
    log('<= [APP.fetch]', result)
    return { ...result, content }
}

module.exports = {
    execute
}