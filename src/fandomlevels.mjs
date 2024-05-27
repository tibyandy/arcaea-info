import fs from 'node:fs/promises'

const lastModifiedFile = './cache/fandomlevels.last'
const cacheFile = './cache/fandomlevels.html'
const fandomPage = 'https://arcaea.fandom.com/wiki/Songs_by_Level'

export default async (online = true) => {
    const { cachedLastModified, cachedData } = await loadCache(lastModifiedFile, cacheFile, online)
    const { lastModified, html } = online
        && (await readUrl(fandomPage, cachedLastModified))
        || { lastModified: cachedLastModified }
    console.log(
      (html?.length || !online) ? 'Retrieved HTML from cache:' : 'Retrieved HTML from URL:',
      (html?.length || !online) ? cacheFile : fandomPage
    )
    return { lastModified, html: html || cachedData }
}

async function loadCache (lastModifiedFile, cacheFile, online) {
    online && console.log('Loading cache...')
    const cachedLastModified = await fs.readFile(lastModifiedFile, 'utf8').catch(logErrorMsg)
    console.log('Cached lastModified:', cachedLastModified)
    const cachedData = cachedLastModified && await fs.readFile(cacheFile, 'utf8').catch(logErrorMsg)
    console.log('Cached data length:', cachedData?.length || 0)
    if (!cachedData) return {}
    return { cachedLastModified, cachedData }
}

async function readUrl (url, cachedLastModified) {
    console.log('\nFetching URL:', url)
    const res = await fetch(fandomPage)
    const lastModified = res.headers.get('last-modified')
    console.log('Fetch status:', res.status, res.statusText)
    const content = await (
        res.status === 200 ? writeCache(lastModified, res.text()) :
        res.status === 304 ? false :
        new Error('Invalid Status: ' + res.status)
    )
    return { lastModified, html: content }
}

async function writeCache (fetchLastModified, body) {
    console.log('Caching lastModified:', fetchLastModified)
    fs.writeFile(lastModifiedFile, fetchLastModified).catch(logErrorMsg)
    console.log('Caching data...')
    await fs.writeFile(cacheFile, await body).catch(logErrorMsg)
    return body
}

function logErrorMsg (e) {
    console.log(e.message)
}