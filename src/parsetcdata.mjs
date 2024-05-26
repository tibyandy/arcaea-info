import fs from 'node:fs/promises'

const cacheFile = './cache/tcdata.json'

export default async ({ etag, html }) => {
    const data = await loadCache(etag)
    const { sections, images } = data || parseHtml(html, etag)
    return { sections, images }
}

async function loadCache (etag) {
    console.log('')
    const tcdata = await fs.readFile(cacheFile, 'utf8').then(JSON.parse)
        .catch(e => console.log('Could not read TCData cache:', e.message))

    if (!tcdata || !tcdata.etag) {
        console.log('Invalidating TCData cache.\n')
        return
    } else if (tcdata.etag !== etag) {
        console.log('TCData cache expired. Cached etag:', tcdata.etag)
        return
    }

    console.log(`Read TCData from cache: ${cacheFile}`)
    console.log('Sections count:', Object.keys(tcdata.sections).length)
    console.log('Charts count:', tcdata.sections.reduce((r, { charts }) => r + charts.length, 0))
    console.log('Images count:', Object.keys(tcdata.images).length)
    return tcdata
}

function parseHtml (fullHtml, etag) {
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
    const imagesIndexed = Object.keys(images)
    const images2 = Object.fromEntries(Object.entries(images).map(([k, v], i) => ['i' + (i + 100), `${v}?rev=${k}`]))
    const packs = Object.keys(sections.reduce((r, s) => {
        s.charts.forEach(c => {
            c.img = 'i' + (imagesIndexed.indexOf(c.img) + 100)
            r[c.album] = 1
        })
        return r
    }, {}))
    console.log('Sections count:', sections.length)
    console.log('Charts count:', chartsCount)
    console.log('Images count:', Object.keys(images).length)
    console.log('Packs count:', packs.length)
    console.log(`Saving TCData cache to: ${cacheFile}`)
    const tcdata = { etag, sections, images: images2, packs }
    fs.writeFile(cacheFile, prettyJSON({ etag, sections, images: images2, packs }), { encoding: 'utf8' })
    return tcdata
}

function normalizePack (pack) {
    return pack.replaceAll(/(\.|\:.*| II|Collaboration|Ch.|Chapter )/g, '').replaceAll(/\s+/g, ' ').replaceAll(/\(\s/g, '(').trim()
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
            level, rate: rate || sectTitle, img, title, href: (href != title ? href : false), artist, album: normalizePack(pack), notes: notes || '' 
        }])
    }, [])
}

function getSectionLevelRateTitle (html) {
    const title = html[1].replaceAll(/<[^>]*>/g, '').replaceAll(/\s\s*/g, ' ').trim()
    const level = [...(title.matchAll(/level (\d+\+?)/ig) || [])].map(([,x]) => x).join('﹠')
    const rate = title.includes('特記枠') ? '!!'
        : title.includes('未反映譜面') ? 'new'
        : title.includes('詐称') ? '!!'
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
    if (images[rev]) {
        if (parts[1] != images[rev]) {
            console.log('Duplicated image rev', rev, parts)
            console.log('images[rev]', images[rev])
            process.exit(-1)
        }
    } else images[parts.slice(-1)[0]] = parts[1]
    return rev
}
