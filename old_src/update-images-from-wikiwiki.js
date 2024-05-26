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

const replaceMap = ['\\/?%*:|"<>', '⧹⧸‽﹪＊：ǀ＂⟨⟩']

const toImageFileName = src => {
    const sParts = decodeURIComponent(src.split('/arcaea/')[1].split('?')[0].replaceAll(/\/:*(ref|attach)?\/?/g, '¢')).split('¢')
    const parts = sParts.map(p => replaceMap.reduce((r, c, i) => r.replaceAll(c, replaceMap[1][i]), p))
    if (parts.length === 1) return parts[0]
    const match = parts[0].match(/&#\d+;/g)
    if (match) parts[0] = match.reduce((p, m) => p.replace(m, String.fromCharCode(m.replace(/[&#;]/g, ''))), parts[0])
    if (parts[0] === parts[1].split('.')[0]) return parts[1]
    console.log(`${parts[0]}/${parts[1]}`)
    return `${parts[0]}/${parts[1]}`
}

module.exports.execute = async (wikiWikiTrackCompleteHtml) => {
    log('[APP.updateImages] =>', { sourceHtmlSize: wikiWikiTrackCompleteHtml.length })
    const imgSrcs = [...new Set(wikiWikiTrackCompleteHtml
        .split('<img ').slice(1).map(imgTag => imgTag
            .split('>')[0]
            .split('src="')[1]
            .split('" ')[0]
        ).filter(src => src.includes('/arcaea/')))].sort()
    const filesAndUrls = imgSrcs.map(src => [ toImageFileName(src), src ])
    log('- retrievedImageSources', { count: filesAndUrls.length })

    const parts = sliceInPartsOf(10, filesAndUrls)
    let files = parts.shift()
    while (files) {
        const n = parts.length
        log(`updateImages`, { remainingBatches: n })
        await Promise.all(files.map(async ([fileName, url]) => {
            // '../cache/images/' + 
            const cacheEtagFileName = fileName.replace(/(.jpg)?(.webp)?$/, '') + '.etag'
            const cacheFileName = fileName
            return true
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