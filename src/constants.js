const c = module.exports

c.fetchTypes = {
    HTML: Symbol('FetchType.HTML')
}

c.fetchSources = {
    STREAM: Symbol('FetchSource.STREAM'),
    LOCAL: Symbol('FetchSource.LOCAL')
}

c.remoteSources = {
    example: {
        url: 'https://example.org/',
        type: c.fetchTypes.HTML,
        cacheFile: './cache/example.html',
        cacheEtagFile: './cache/example.etag'
    },
    wikiWiki_trackCompleteHtml: {
        url: 'https://wikiwiki.jp/arcaea/%E9%AB%98%E3%83%AC%E3%83%99%E3%83%AB%E9%9D%9E%E5%85%AC%E5%BC%8F%E9%9B%A3%E6%98%93%E5%BA%A6%28TRACK%20COMPLETE%E5%9F%BA%E6%BA%96%29',
        type: c.fetchTypes.HTML,
        cacheFile: './cache/track-complete.html',
        cacheEtagFile: './cache/track-complete.etag'
    }
}
