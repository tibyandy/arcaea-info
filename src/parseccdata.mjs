import fs from 'node:fs/promises'
import './sixtyfour.js'
import './hash.js'

const cacheFile = './cache/ccdata.json'

export default async ({ lastModified, html }) => {
    const data = await loadCache(lastModified)
    const { songs } = data || parseHtml(html, lastModified)
    return { songs }
}

async function loadCache (lastModified) {
    console.log('')
    const ccdata = await fs.readFile(cacheFile, 'utf8').then(JSON.parse)
        .catch(e => console.log('Could not read TCData cache:', e.message))

    if (!ccdata || !ccdata.lastModified) {
        console.log('Invalidating TCData cache.\n')
        return
    } else if (ccdata.lastModified !== lastModified) {
        console.log('TCData cache expired. Cached lastModified:', ccdata.lastModified)
        return
    }

    console.log(`Read CCData from cache: ${cacheFile}`)
    return ccdata
}

function buildRows (interestingHtml) {
  return interestingHtml
    .replaceAll(/^<th>/g, '')
    .replaceAll(/<th>/g, '<td>')
    .replaceAll(/<td><a href="/g, '')
    .replaceAll(/">/g, '<td>')
    .split('<tr>')
    .slice(1)
    .map(row => row.trim().split('<td>').map(normalize))
}

const diffsFull = [ 'Past', 'Present', 'Future', 'Beyond', 'Eternal' ]
const diffs = [ '', 'PST', 'PRS', 'FTR', 'BYD', 'ETR' ]

function updateColumns (rows) {
  rows.forEach(cols => {
    const hash = hashCode(`${cols[1]}´${cols[2]}`.toLowerCase())
    cols[0] = sixtyFour.fromNumber(hash, 3)
    cols[3] = diffs[(diffsFull.indexOf(cols[3]) + 1)] || cols[3]
  })
  rows[0][0] = 'Hash'
}

function buildSongsAndCharts (rows) {
  return rows.slice(1).reduce((songs, [hash,title,artist,diff,cc,level,version]) => {
    const song = songs[hash] = songs[hash] || { info: {title, artist}, charts: {} }
    if (title != song.info.title || artist != song.info.artist) {
      console.log(`Conflicting hash: "${hash}" => "${title}´ ${artist}" & "${song.info.title}´ ${song.info.artist}"`)
      process.exit(-1)
    }
    song.charts[diff] = {cc,level,version}
    return songs
  }, {})
}

function buildJson (songs) {
  const { json, nsongs, ncharts } = Object.values(songs).reduce(({ json, nsongs, ncharts }, song) => {
    const { info: { title, artist }, charts } = song
    json[`${title} ¨ ${artist}`] = Object.entries(charts).map(([diff, { cc, level, version }]) => {
			if (diff === 'PST') nsongs++
			ncharts++
			return `${diff}  ${level}  ${cc}  ${version}`
		})
    return { json, nsongs, ncharts }
  }, { json: {}, nsongs: 0, ncharts: 0 })
  return { json, nsongs, ncharts }
}

function parseHtml (fullHtml, lastModified) {
    console.log('Parsing CCData from Fandom HTML...')
    const interestingHtml = trimInterestedHtml(fullHtml)
    const rows = buildRows(interestingHtml);
    updateColumns(rows)
    //rows.forEach(r => console.log(JSON.stringify(r)))
    const songs = buildSongsAndCharts(rows)
    const { json, nsongs, ncharts } = buildJson(songs)
    console.log('Songs count:', nsongs)
    console.log('Charts count:', ncharts)
    console.log('Average charts per song:', ncharts / nsongs)
    console.log(`Saving CCData cache to: ${cacheFile}`)
    fs.writeFile(cacheFile, format({ lastModified, songs: json }), { encoding: 'utf8' })
    return json
}

function format (json) {
	return JSON.stringify(json).replace(':{',':{\n\n').replaceAll(':[',':\n[').replaceAll('","','"\n,"').replaceAll('],"','],\n\n"').replaceAll(']}}',']\n}}')
}

function trimInterestedHtml (fullHtml) {
    return fullHtml
        .split('mobileonly')[1]
        .split('tbody>')[1]
        .replaceAll(/ (style|title|rel|loading|width|height|data|class|id)[^=]*="[^"]*"/g, '')
        .replaceAll(/<\/(a|t(body|head|r|d|h))>/g, '')
        .replaceAll('\n', ' ')
        .replaceAll('<tr', '\n<tr')
        .replace(/ <\/$/, '')
        .trim()
}

function normalize (s) {
    return decodeURIComponent(s)
        .replaceAll('<br>', ' ')
        .replaceAll(/<\/?\w*>/g, '')
        .replace(/&#(\d+?);/g, (a,b) => String.fromCharCode(b))
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '＆')
}
