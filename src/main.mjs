import fetchTrackCompleteHtml from './wikiwiki.mjs'
import parseTCData from './parsetcdata.mjs'
import updateSongJacketsAndNames from './songjackets.mjs'
import buildPage from './buildpage.mjs'

export default {
    run
}

async function run () {
    const { etag, html } = await fetchTrackCompleteHtml()
    const { etag: tcetag, sections, images, packs } = await parseTCData({ etag, html })
    updateSongJacketsAndNames({ tcetag, images })
    buildPage()
}

