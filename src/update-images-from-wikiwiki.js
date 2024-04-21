const log = require('./log')
const fs = require('./cached-fetch')

const sliceInPartsOf = (size, originalArray) => originalArray.reduce((result, elem) => {
    let lastPart = result.slice(-1)[0]
    if (lastPart.length === size) {
        lastPart = []
        result.push(lastPart)
    }
    lastPart.push(elem)
    return result
}, [[]])


module.exports.execute = async (wikiWikiTrackCompleteHtml) => {
    log('[APP.updateImages] =>', { sourceHtmlSize: wikiWikiTrackCompleteHtml.length })
    const imgSrcs = [...new Set(wikiWikiTrackCompleteHtml
        .split('<img ').slice(1).map(imgTag => imgTag
            .split('>')[0]
            .split('src="')[1]
            .split('" ')[0]
        ).filter(src => src.includes('/arcaea/')))].sort()
    const filesAndUrls = imgSrcs.map(src => [
        decodeURIComponent(src.split('/').slice(-1)[0].split('?')[0]),
        src
    ])
    log('- retrievedImageSources', { count: filesAndUrls.length })

    const parts = sliceInPartsOf(10, filesAndUrls)
    let files = parts.shift()
    while (files) {
        const n = parts.length
        log(`updateImages`, { remainingBatches: n })
        await Promise.all(files.map(async ([fileName, url]) => {
            const cacheEtagFileName = './cache/images/' + fileName.replace(/(.jpg)?(.webp)?$/, '') + '.etag'
            const cacheFileName = './cache/images/' + fileName
            const cachedEtag = await fs.readCachedEtag({ cacheEtagFile: cacheEtagFileName, cacheFile: cacheFileName })
            if (!cachedEtag) {
                const { stream } = await fs.fetch(url)
                return fs.saveCache({ cacheEtagFile: cacheEtagFileName, cacheFile: cacheFileName, etag: url, body: stream })
            } else {
                return true
            }
        }))
        files = parts.shift()
    }
}