import fs from 'node:fs/promises'
import translate from './translation.mjs'
import './sixtyfour.js'

const cacheFile = './cache/tcdata.json'

function revToB64 (rev) {
    return sixtyFour.fromHex(rev.slice(-6), 4)
}

export default async ({ etag, html }) => {
    const data = await loadCache(etag)
    const { sections, images, packs } = await (data || parseHtml(html, etag))
    return { sections, images, packs }
}

async function loadCache (etag) {
    console.log('')
    const tcdata = await fs.readFile(cacheFile, 'utf8').then(JSON.parse)
        .catch(e => console.log('Could not read TCData cache:', e.message))

    if (!tcdata || !tcdata.etag) return console.log('Invalidating TCData cache.\n')
    else if (tcdata.etag !== etag) return console.log('TCData cache expired. Cached etag:', tcdata.etag)

    console.log(`Read TCData from cache: ${cacheFile}`)
    console.log('Sections count:', Object.keys(tcdata.sections).length)
    console.log('Charts count:', tcdata.sections.reduce((r, { charts }) => r + charts.length, 0))
    console.log('Images count:', Object.keys(tcdata.images).length)
    return tcdata
}

async function parseHtml (fullHtml, etag) {
    console.log('Parsing TCData from WikiWiki HTML...')
    const interestingHtml = trimInterestedHtml(fullHtml)
    // console.log(interestingHtml); process.exit(0)

    const htmlSections =  [...interestingHtml.matchAll('<h4[^>]*>(.*?)</h4[^>]*>.*?<tbody>(.*?)</table')]
    const { chartsCount, sections, images } = htmlSections.reduce(
        ({ chartsCount, sections, images }, sectionHtml) => {
            const { title, level, rate, charts } = parseSection(sectionHtml, images)
            return {
                chartsCount: chartsCount + charts.length,
                sections: sections.concat({ title: level ? `${level}|${rate}` : title, charts}),
                images
            }
        },
        { chartsCount: 0, sections: [], images: {} }
    )
    const packs = Object.keys(sections.reduce((r, s) => {
        s.charts.forEach(c => {
            // c.img = 'i???' + (imagesIndexed.indexOf(c.img) + 100)
            r[c.album] = 1
        })
        return r
    }, {}))
    console.log('Sections count:', sections.length)
    console.log('Charts count:', chartsCount)
    console.log('Images count:', Object.keys(images).length)
    console.log('Packs count:', packs.length)
    console.log(`Saving TCData cache to: ${cacheFile}`)
    const tcdata = prettyJSON({ etag, sections, images, packs })
    await fs.writeFile(cacheFile, tcdata, { encoding: 'utf8' })
    return JSON.stringify(tcdata)
}

function normalizePack (pack) {
    return pack.replaceAll('(Lasting Eden','(').replaceAll(/(\.|\:.*|Collaboration|Ch.|Chapter )/g, '').replaceAll(/\s+/g, ' ').replaceAll(/\(\s/g, '(').trim()
}

function acronym (pack) {
    const numbers = pack.match(/\d+/)?.[0] || ''
    pack = pack.replaceAll(/(\.|\d+|\:.*|\(|\)| II|Collaboration|Ch.|Chapter )/g, '').trim()
    const initials = pack.split(' ').filter(x => x).map(([a]) => a).join('')
    const acronym = (initials.length < 2 ? pack.substring(0, 2) : initials)
    return acronym + numbers
}

function prettyJSON ({ etag, sections, images, packs }) {
    return `{ "etag":${JSON.stringify(etag)},\n  "sections": [\n  ` +
        sections.map(({title, charts}) => `{ "title":"${title}", "charts":${charts.length ? ' [\n    ' : ' ['}`
            + charts.map(chart => '[' + Object.values(chart).map(f => JSON.stringify(f)).join(',') + ']').join(',\n    ')
            + ` ] }`).join(',\n  ') +
        ` ],\n  "packs": {\n    ` + packs.map(p => `"${acronym(p)}": "${normalizePack(p)}"`).join(',\n    ')
        + `},\n  "images": {` + Object.entries(images).map(([k, v]) => `\n    "${k}":"${v}"`).join(',') + '\n} }'
}

function parseSection (sectionHtml, images) {
    const { title, level, rate } = getSectionLevelRateTitle(sectionHtml)
    const sectionTrs = sectionHtml[2].split('<tr>').slice(1)
    const charts = getChartsJson(sectionTrs, images, level, rate, title)
    return { title, level, rate, charts }
}

function trimInterestedHtml (fullHtml) {
    return fullHtml
        .split('/arcaea/?cmd=areaedit&areaedit_no=0')[1]
        .split('zawazawa')[0]
        .replaceAll(/ (style|title|rel|loading|width|height|data|class)[^=]*="[^"]*"/g, '')
        .replaceAll(/<\/t(body|head|r|d|h)>/g, '')
        .replaceAll('\n', ' ')
}

function getChartsJson (trs, images, level, rate, sectTitle) {
    return trs.reduce((charts, tr) => {
        const parts = tr.match(/src=".*\/arcaea\/(.*?)&amp[^"]*".*href="\/arcaea\/([^"]*)"[^>]*>(.*?)<td>(.*?)<td>(.*?)<td>(.*)/)
        if (!parts) return charts
        const img = parseImgUrl(parts[1], images)
        const [ href, title, artist, pack, notes ] = parts.slice(2).map(normalize)
        return charts.concat([{
            level, rate: rate || sectTitle, img, title, href: (href != title ? href : false), artist, album: normalizePack(pack),
            // notes: notes || '',
            notes: translate(notes || '')
        }])
    }, [])
}

function getSectionLevelRateTitle (html) {
    const title = html[1].replaceAll(/<[^>]*>/g, '').replaceAll(/\s\s*/g, ' ').trim()
    const level = [...(title.matchAll(/level (\d+\+?)/ig) || [])].map(([,x]) => x).join('﹠')
    const rate = title.includes('特記枠') ? 'Other (PST, PRS)'
        : (title === '新規追加楽曲') ? 'new'
        : title.includes('未反映譜面') ? 'not rated'
        : title.includes('詐称') ? 'spoof'
        : title.match(/\[([-+]*\d*).*\]/)?.[1] || title.match(/\[([^\]]*)\]/)?.[1] || ''
    return { title, level, rate }
}

function normalize (s) {
    return decodeURIComponent(s)
        .replaceAll('<br>', ' ')
        .replaceAll(/<\/?\w*>/g, '')
        .replace(/&#(\d+?);/g, (a,b) => String.fromCharCode(b))
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '＆')
}

function parseImgUrl (s, images) {
    // const parts = [...decodeURIComponent(s).match(/([^\/]*)\/([^\/]*)\/([^\.]*)(\.[^\?]*)\?rev=(.*)/)]
    const parts = [...s.match(/([^?]*)\?rev=(.*)/)].map(decodeURIComponent)
    const rev = parts.slice(-1)[0]
    parts[1] = parts[1].replace(/&#(\d+?);/g, (a,b) => String.fromCharCode(b))
    const rev64 = revToB64(rev)
    const fullUrl = `${parts[1]}?rev=${rev}`
    if (images[rev64]) {
        if (fullUrl != images[rev64]) {
            console.log('Duplicated image rev64', rev64, parts)
            console.log('images[rev64]', images[rev64])
            process.exit(-1)
        }
    } else images[rev64] = fullUrl
    return rev64
}
