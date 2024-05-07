import fs from 'node:fs/promises'

const cacheFile = './cache/imagedata.json'
const cachePath = './cache/images/'

export default async ({ tcetag, images }) => {
    const imagecache = await loadCache()
    const newcache = await checkChangedImages({ images, imagecache })
    fs.writeFile(cacheFile, JSON.stringify(newcache, null, 2), { encoding: 'utf8' })
}

async function loadCache () {
    console.log('')
    const imagecache = await (fs.readFile(cacheFile, 'utf8').then(JSON.parse)
        .catch(e => console.log('Could not read image cache:', e.message)))

    if (!imagecache) {
        console.log('Invalidating image cache.\n')
        return {}
    }

    
    const result = Object.fromEntries(Object.entries(imagecache).map(([id_etag, shortname]) => [shortname, id_etag.split(':')[1]]))
    console.log('Read image cache.')
    return result
}

async function checkChangedImages ({ images, imagecache }) {
    const newcache = {}
    const queue = []
    Object.entries(images).map(([id, url]) => {
        const [src, rev] = url.split('?rev=')
        const [, jp, type, en, ext] = (src.match(/([^/]*)\/(::[^/]*)\/(.*)(\.[^w][^e][^b][^p]*$|\....\.webp$)/) || [])
        if (!jp) console.log(src)
        const shortname = ((jp === en)
            ? jp : jp.includes(en)
            ? jp : en.includes(jp)
            ? en : (en + '／' + jp)) + ext
        const cacheRev = imagecache[shortname]
        if (!cacheRev) {
            console.log(`Queueing ${id}:${rev}, not cached: "${shortname}"`)
            queue.push({ src, id, rev, shortname })
        } else if (cacheRev != rev) {
            console.log(`Changed rev ${id}:${rev}, queueing "${shortname}"`)
            queue.push({ src, id, rev, shortname })
        }
        newcache[shortname] = `${id}:${rev}`
    })
    console.log('Total images:', Object.keys(images).length)
    console.log('Changed images:', queue.length)
    if (queue.length) {
        await downloadImages(queue)
    }
    const filecache = Object.fromEntries(Object.entries(newcache).sort(([a], [b]) => a.localeCompare(b)).map(([a, b]) => [b, a]))
    return filecache
}

async function downloadImages (queue) {
    const parts = sliceInPartsOf(10, queue)
    let files = parts.shift()
    let n = 0
    let t = queue.length
    while (files) {
        console.log('Downloading next', files.length, 'images...')
        await Promise.all(files.map(async file => {
            const stream = (await fetch(`https://cdn.wikiwiki.jp/to/w/arcaea/` + encodeURIComponent(`${file.src}`) + `?rev=${file.rev}`)).body
            console.log(++n, 'of', t, file.shortname)
            return fs.writeFile(cachePath + file.shortname, stream)
        }))
        files = parts.shift()
    }
}

function sliceInPartsOf (size, originalArray) {
    return originalArray.reduce((result, elem) => {
        let lastPart = result.slice(-1)[0]
        if (lastPart.length === size) {
            lastPart = []
            result.push(lastPart)
        }
        lastPart.push(elem)
        return result
    }, [[]])
}
