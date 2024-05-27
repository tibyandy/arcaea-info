import fetchTrackCompleteHtml from './wikiwiki.mjs'
import fetchSongsByLevelHtml from './fandomlevels.mjs'
import parseCCData from './parseccdata.mjs'
import parseTCData from './parsetcdata.mjs'
import updateSongJacketsAndNames from './songjackets.mjs'
import buildPage from './buildpage.mjs'

export default {
    run
}

async function run () {
  const { lastModified, html: levelHtml } = await fetchSongsByLevelHtml()
  console.log('')
  const { etag, html } = await fetchTrackCompleteHtml(false)
  const { songs } = await parseCCData({ lastModified, html: levelHtml })
  const { etag: tcetag, sections, images, packs } = await parseTCData({ etag, html })
  updateSongJacketsAndNames({ tcetag, images })
  buildPage()
}

