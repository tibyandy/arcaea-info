{
const D = document
const { body } = D

const state = {
  renderedImageDivs: false,
  readImageSources: false,
}

APP.view = {}
APP.view.renderSkeleton = () => {
	body.appendChild(Render(
    {div:{id:'root',_:[
      {div:{id:'header'}},
      {div:{id:'songs'}},
      {div:{id:'footer',class:'minimized',_:[
        {div:{id:'subrating',_:[
          {div:{id:'zero',_:['(subrate)']}},
        ]}},
        {div:{id:'rating_picker',onclick:clickRatingPicker,_:
          ['...','7&7+','8','8+','9','9+','10','10+','11','12'].map(s => ({div:s}))
        }}
      ]}}
    ]}}
  ))
}
APP.view.renderPageContents = () => {
  console.log(data);
  ['','7﹠7+','8','8+','9','9+','10','10+','11','12'].map(level => {
    const { subratings } = data.ratings[level] || []
    songs.appendChild(Render(
      {div:{class:'level',_:[
        {h2:`${level || 'New charts'}`},

        ...Object.entries(subratings).sort(([a], [b]) => (a*1) - (b*1)).map(([sr, charts]) => (
          {div:{_:[
            {h3:`${level ? 'Level ' + level : 'New charts'} Subrating: ${sr}`},
            {div:{class:'charts',_:charts.map(c => !c ? [] : (
              {div:{class:'chart',_:[
                {div:{class:'difficulty',_:[
                  {span:c.diff},
                  {span:c.level.replace('﹠',', ')},
                  {span:`(${c.subrating})`},
                ]}},
                {div:{class:'jacket',title:c.imageId}},
                {div:{class:'info',_:[
                  {div:[
                    {span:{class:'title',_:c.title}},
                    {span:{class:'artist',_:c.artist}},
                  ]},
                  {div:{class:'pack',_:c.pack}},
                  {div:c.notes}
                ]}}
              ]}}
            ))
            }}
          ]}}
        ))

      ]}}
    ))
    // ${c.imageId} ${c.level} ${c.subrating} [${c.diff}] ${c.title} [${c.pack}] - ${c.artist} ${c.notes}
  })
  requestAnimationFrame(() => {
    state.renderedImageDivs = true
    APP.view.renderImages()
  })
}

function clickRatingPicker (e) {
  this.querySelector('.active').className = ''
  e.srcElement.className = 'active'
}

APP.view.renderImages = (readImageSources) => {
  if (state.renderedImageDivs && state.readImageSources) {
    requestAnimationFrame(() => {
      Object.entries(data.images).forEach(([i, url]) => {
        i = i.split(':')[0]
        const s = D.querySelectorAll(`div.jacket[title=${i}]`);
        [...s].forEach(i => {
          i.setAttribute('style', `background-image:url("cache/images/${url}")`)
        })
      })
    })
  } else {
    state.readImageSources = readImageSources
  }
}
}