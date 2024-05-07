const util = require('node:util')

const getWikiWikiTrackCompleteHtml = require('./get-wikiwiki-html.js')
const updateImagesFromWikiWiki = require('./update-images-from-wikiwiki.js')
const parseWikiWikiHtmlParts = require('./parse-wikiwiki-html-parts.js')
const { remoteSources } = require('./constants.js')
const c = module.exports

c.getWikiWikiTrackCompleteHtml = async () => {
    const { content } = await getWikiWikiTrackCompleteHtml.execute(remoteSources.wikiWiki_trackCompleteHtml)
    return { wikiWikiTrackCompleteHtml: content }
}

c.updateImagesFromWikiWiki = (ctx) => {
    const { wikiWikiTrackCompleteHtml } = ctx
    updateImagesFromWikiWiki.execute(wikiWikiTrackCompleteHtml)
}

c.parseSectionsFromWikiWiki = (ctx) => {
    ctx.wikiWikiSections = parseWikiWikiHtmlParts(ctx.wikiWikiTrackCompleteHtml)
}

c.convertWikiWikiSectionsToHtml = (ctx) => {
    // console.log(util.inspect(ctx.wikiWikiSections, { depth: 10, colors: true, breakLength: 180 }))
    const head = '<head><link href="css.css" rel="stylesheet"><meta name="viewport" content="width=device-width, initial-scale=1"></head>'
    const html = `<html>${head}<body>\n<div class="levels">` + ctx.wikiWikiSections.map(({ level, sublevels }) =>
        `\n <div class="level"><p>${level}<div class="subranges">`
        + sublevels.map(({ subrange, info, songs, banners }) => {
            if (info) return `\n  <div class="subrange nosongs"><p>${subrange}<p>${info}</div>`
            return `\n  <div class="subrange"><p>${subrange}<div class="songs">` + songs?.map(({ pack, title, artist, notes }, i) => {
                const banner = banners[i]
                const cachedBanner = banner.split('/').slice(-1)[0].split('?')[0]
                return `\n   <div><p>${title}<p><img src="cache/images/${cachedBanner}"><p>${pack}<p><!--${artist}--><div>${notes}</div></div>`
            }).join('') + '\n  </div></div>'
        }).join('')
        + '\n </div></div>'
    ).join('') + '\n</div>\n</body></html>'
    console.log(html)
}