import fs from 'node:fs/promises'

const etagFile = './cache/wikipage.etag'
const cacheFile = './cache/wikipage.html'
const wikiWikiPage = 'https://wikiwiki.jp/arcaea/高レベル非公式難易度(TRACK%20COMPLETE基準)'

export default async (online = true) => {
    const { cachedEtag, cachedData } = await loadCache(etagFile, cacheFile, online)
    const { etag, html } = online
        && (await readUrl(wikiWikiPage, cachedEtag))
        || { etag: cachedEtag }
    console.log(
      (html?.length  || !online) ? 'Retrieved HTML from cache:' : 'Retrieved HTML from URL:',
      (html?.length  || !online) ? cacheFile : wikiWikiPage
    )
    return { etag, html: html || cachedData }
}

async function loadCache (etagFile, cacheFile, online) {
    online && console.log('Loading cache...')
    const cachedEtag = await fs.readFile(etagFile, 'utf8').catch(logErrorMsg)
    console.log('Cached etag:', cachedEtag)
    const cachedData = cachedEtag && await fs.readFile(cacheFile, 'utf8').catch(logErrorMsg)
    console.log('Cached data length:', cachedData?.length || 0)
    if (!cachedData) return {}
    return { cachedEtag, cachedData }
}

async function readUrl (url, cachedEtag) {
    console.log('\nFetching URL:', url)
    const res = await fetch(wikiWikiPage, cachedEtag ? { headers: { 'If-None-Match': cachedEtag } } : undefined)
    const etag = res.headers.get('etag')
    console.log('Fetch status:', res.status, res.statusText)
    const content = await (
        res.status === 200 ? writeCache(etag, res.text()) :
        res.status === 304 ? false :
        new Error('Invalid Status: ' + res.status)
    )
    return { etag, html: content }
}

async function writeCache (fetchEtag, body) {
    console.log('Caching etag:', fetchEtag)
    fs.writeFile(etagFile, fetchEtag).catch(logErrorMsg)
    console.log('Caching data...')
    await fs.writeFile(cacheFile, await body).catch(logErrorMsg)
    return body
}

function logErrorMsg (e) {
    console.log(e.message)
}