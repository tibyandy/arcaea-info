const app = require('./src/main');

(async () => {
    let ctx = await app.getWikiWikiTrackCompleteHtml()
    app.updateImagesFromWikiWiki(ctx)
    // app.parseSectionsFromWikiWiki(ctx)
    // app.convertWikiWikiSectionsToHtml(ctx)
})()
