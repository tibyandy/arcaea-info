const data = { charts: {}, ratings: {}, images: {} }
const APP = {}

document.body.onload = () => {

const diffs = ['PRS', 'PST', 'FTR', 'ETR', 'BYD']

const D = document
function load (src) {
	return new Promise(resolve => {
		const s = D.createElement('script')
		s.src = `static/${src}.js`
		D.head.appendChild(s)
		s.onload = () => resolve()
	})
}



Promise.all([
	Promise.all([ load('view'), load('render') ]).then(() => APP.view.renderSkeleton()),
	fetch('cache/tcdata.json').then(t => t.json()).then(parseTcData),
	fetch('cache/imagedata.json').then(t => t.json()).then(parseImageData)
]).then(() => APP.view.renderPageContents())


function songDiff (rawtitle) {
	const index = diffs.findIndex(d => rawtitle.endsWith(`[${d}]`))
	return diffs[((index + 1) || 3) - 1]
}

function parseTcData (tcdata) {
  const { images, ...tcdataWithoutImages } = tcdata
	Object.assign(data, tcdataWithoutImages)
	tcdata.sections.forEach(({ title, charts }) => {
		let chartId = 0
		charts.forEach(arrChart => {
			const [ level, subrating, imageId, rawtitle, stitle, artist, pack, notes ] = arrChart
			const diff = songDiff((rawtitle || title))
			const title = /*stitle || */rawtitle.replace(/\[...\]$/g, '').trim()
			const chart = { chartId: ++chartId, title, pack, diff, level, subrating, imageId, artist, notes }
			const song = data.charts[title] = data.charts[title] || {}
			song[diff] = chart
      const L = data.ratings[level] = data.ratings[level] || { charts: [], subratings: {} }
			L.charts.push(chart)
			const S = L.subratings[subrating] = L.subratings[subrating] || []
			S.push(chart)
		})
	})
  APP.view.renderImages()
}

function parseImageData (imageData) {
	data.images = Object.fromEntries(Object.entries(imageData).map(
    ([i, src]) => [i.split(':')[0], encodeURIComponent(src.split('/').slice(-1)[0])])
  )
  APP.view.renderImages()
}

}