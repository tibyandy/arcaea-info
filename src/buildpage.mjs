import fs from 'node:fs/promises'
import { aliases, unaliased } from './aliases.mjs'
import './hash.js'
import './sixtyfour.js'

const outputFile = './static/info.md'

const uTABLE_HEADER = `
 cc |dif|lv |sl|img |id |pack |tp| en                             | notes                       | jp | artist
----|---|---|--|----|---|-----|--|--------------------------------|-----------------------------|----|-------`

const TABLE_HEADER = `
 cc |dif|lv |sl|img |id |pack | title | notes
----|---|---|--|----|---|-----|-------|-`

const SONG_HEADER = `
id |tp|pack |title|jp|artist
---|--|-----|-----|--|-`

const IMAGE_HEADER = `
img |src
----|-`

const PACKS_HEADER = `
pack | name
-----|----------------------------`


export default async ({ songs, sections, images, packs }) => {
  if (!packs || !songs) {
    console.error('Packs or Songs is falsy', !!packs, !!songs, !!sections, !!images)
    process.exit(-1)
  }
  const songsEntries = Object.keys(songs)
  const packsRev = Object.fromEntries(Object.entries(packs).map(([k, v]) => [v, k]))

  const [outCharts,outSongs] = sections.reduce(([s,t,_lvGr], { title, charts }) => {
    if (!charts.length) return [s,t,_lvGr]
    const [lvGr,vari] = title.split('|')
    if (lvGr != _lvGr) s += `\n\n## Level ${lvGr}`.replaceAll('Level 新規追加楽曲', 'Not rated charts')
    else if (vari) s += '\n'
    vari && (s += `\n### Variation: ${vari}`)
    s += chartsTable(t, charts, songs, songsEntries, packsRev)
    return [s,t,lvGr]
  },['',{},'_'])

  const markdown = ['# Charts']
  const add = s => markdown.push(s)

  add(outCharts.trim())
  add('\n# Songs' + SONG_HEADER)
  Object.entries(outSongs).sort(([,a],[,b])=>{
    return (a[2]+'  '+a[4]).localeCompare((b[2]+'  '+b[4]))
  }).map(([x, y]) => add(([x, ...y]).join('|')))
  add('\n# Images' + IMAGE_HEADER)
  Object.entries(images).sort(([,a],[,b])=>a.localeCompare(b)).forEach(([x,y])=>add(x.split(':')[0]+'|'+y))
  add('\n# Packs' + PACKS_HEADER)
  Object.entries(packs).sort(([,a],[,b])=>a.localeCompare(b)).forEach(
    ([x,y])=>add(x.padEnd(5)+'| '+(y.replace(/\((\d)\)/g, 'Chapter $1')))
  )

  return await fs.writeFile(outputFile, markdown.join('\n').trim(), { encoding: 'utf8' })
}

function chartsTable (outSongs, charts, songs, songsEntries, packsRev) {
  return TABLE_HEADER + charts.map(chart => {
    const [lvGr, sl, img, titleDif, href, _artist, album, notes] = chart
    const jp = titleDif.replace(/\s?\[...\]$/, '')
    const dif = titleDif.match(/\[(...)\]$/)?.[1] || 'FTR'

    const alias = aliases[jp]
    const type = alias ? 'jp' : (unaliased[jp]) ? '' : 'NO'
    const en = alias?.[0] || jp
    const artist = alias?.[1] || _artist
    const songId = sixtyFour.fromNumber(hashCode(`${jp} ¨ ${artist}`), 3)

    const [, lv, cc, ccv] =
      (songs[songsEntries.find(s => s === `${en} ¨ ${artist}`)] || songs[songsEntries.find(s => s.startsWith(`${en}`))])
        ?.find(d => d.startsWith(dif))?.split('  ') || ['?', '', '?', '?']

    outSongs[songId] = [type || '  ', packsRev[album].padEnd(4).padStart(5), ' ' + en + ' ', (jp != en) ? jp : '', ' ' + artist]
    return line(cc, dif, type, `${lv || lvGr}`, sl, img, packsRev[album], en, (jp != en) ? jp : '', artist, notes || '', songId)
  }).join('')
}

function line (cc, dif, type, lv, sl, img, pack, en, jp, artist, notes, songId) {
  return '\n' + [
    cc.padStart(4),
    dif,
    `${lv}`.padEnd(2).padStart(3),
    sl.substring(0,2).padStart(2),
    img,
    songId,
    pack.padEnd(4).padStart(5),
    // type.padEnd(2),
    // ` ${en.padEnd(Math.min(30, 60 - notes.length))} | ${notes}`.padEnd(66),
    ` ${en}${notes ? '  | ' : ''}${notes}`,
    // jp,
    // ` ${artist}`,
  ].join('|').trimEnd()
}
