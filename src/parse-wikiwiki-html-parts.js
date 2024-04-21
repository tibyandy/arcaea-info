const splitByLevelAnchors = html => html.split('class="anchor"').slice(1, -1)

const translations = Object.entries({
    'ロングノーツの特殊な取り方を把握しなければ大きく難化':  "hard if you don't know the right way to use long notes",
    'アーク主体につき極めて個人差が大きい':               'large personal differences since it is arc-based',
    'アークが苦手であれば難化':                         'difficult if you are not good at arcs',
    'アーク難により個人差大':                           'large personal differences due to arc difficulty',
    'トリル主体につき, 個人差大':                       'large personal differences as it is mainly a trill',
    'トリル主体につき個人差あり':                        'large personal differences as it is mainly a trill',
    'トリル主体につき個人差大':                          'large personal differences as it is mainly a trill',
    '人によってLv.9の+1~+2並':                         'lv.9 +1~2 depending on the person',
    '低速につき個人差大':                               'large personal differences due to low speed',
    '低速により個人差大':                               'large personal differences due to low speed',
    '旧Lv7(特記枠, 詐称相当)→Lv8':                      'changed from Lv7 (special mention, ≈ spoofing) → Lv8',
    '旧Lv7(特記枠, 詐称相当)':                          'changed from Lv7 (special mention, ≈ spoofing)',
    '旧Lv7(記載無し)':                                 'changed from Lv7',
    '旧Lv8(+2, 人によっては難化)→Lv9':                  'changed from lv8 (+2, difficult for some people) → lv9',
    '旧Lv8(+2, 人によっては難化)':                      'changed from lv8 (+2, difficult for some people)',
    '現Lv7, +2相当':                                  'currently lv7 (≈ +2)',
    '現Lv7+, +2相当':                                 'currently lv7+ (≈ +2)',
    '現Lv7+, 詐称相当':                                'currently lv7+ (≈ spoofing)',
    '人によっては易化':                                 'easier for some',
    '人によっては更に易化':                              'even easier for some',
    '人によっては更に難化 (詐称相当)':                    'even harder for some (≈ spoofing)',
    '人によっては難化':                                 'harder for some',
    '低速・ソフランにより個人差大':                       'large personal differences since it is slow and has speed changes',
    '(人によっては詐称相当)':                            '(for some, ≈ spoofing)',
    '+2相当、個人差あり':                               '≈ +2, personal differences',
    '現在議論中の譜面はありません':                       'there are no scores currently under discussion.',
    '縦連が苦手であれば難化':                            'hard if you are not good at vertical series',
    '縦連が苦手だと難化':                               'hard if you are not good at vertical series',
    '譜面速度を上げることで+1まで易化':                   'easier up to +1 if increasing speed',
    '譜面傾向特殊につき個人差大':                         'large personal differences due to chart peculiarities',
    '譜面の暗記が前提':                                 'requires memorization of chart',
    '非常に個人差が大きい人によっては難化':                 'harder for some due to very large personal differences',
    '非常に個人差が大きい':                              'large personal differences',
    '個人差が極めて大きい':                              'very large personal differences',
    '個人差あり':                                      'personal differences',
    '個人差大、':                                      'large personal differences, ',
    '個人差大':                                        'large personal differences',
    '未反映譜面':                                      'not classified',
    '最難関':                                          'the most difficult',
    '現Lv7+':                                         'currently lv7+',
    '現Lv7':                                           'currently lv7',
    '特記枠': 'special mention',
    '最下位': 'easiest',
      '下位': 'easier',
    '最上位': 'hardest',
      '上位': 'harder',
      '適正': 'appropriate',
      '詐称': 'spoofing',
      'Extend Archive ': 'W.Extend ',
      'Collaboration, (': '(',
'(Collaboration ': '(Collab.',
'Collab.Ch.': 'Chapter ',
    '&quot;': '"',
     '&amp;': '&',
        '、': ', ',
       ', (': ' (',
})

const translate = s => {
    return translations.reduce((s, [jp, en]) => s.replaceAll(jp, en), s)
}

const mapTrToSublevelData = tr => {
    const tds = tr.split('<td').slice(1).map(x => /[^>]*>(.*)<\/td>/.exec(x)[1])
    if (tds.length === 1) {
        return (/>([^<]+)</.exec(tds))?.[1]
    }
    tds[0] = (/src="([^"]*)"/.exec(tds))?.[1]?.replaceAll('&amp;', '&')
    const i = { pack: '', title: '', artist: '' }
    const s = { info: i }
    ;[ s.banner, i.title, i.artist, i.pack, i.notes ] = tds.map(td => translate(td.replaceAll('<br class="spacer">', ', ').replaceAll(/<[^>]*>/g, '')));
    return s
}

const mapSublevelHtmlToSublevelInfo = s => {
    const [ subrangeJp, tbody ] = /[^>]*>([^\]]*\]).*<tbody><tr>(.*)<\/tbody>/.exec(s).slice(1)
    const subrange = translate(subrangeJp.replaceAll(/<[^>]*>/g, ''))
    const trs = tbody.split('<tr>').map(tr => tr.replace('</tr>', ''))
    const data = trs.map(mapTrToSublevelData)
    if (data.length === 1 && typeof data[0] === 'string') {
        return { subrange, info: translate(data[0]) }
    }
    const { songs, banners } = data.reduce(({ songs, banners }, { banner, info }) => ({
        songs: songs.concat(info), banners: banners.concat(banner)
    }), { songs: [], banners: [] })
    return { subrange, songs, banners }
}


const mapToLevelAndSublevelsWithSongs = levelHtml => {
    levelHtml = levelHtml.replaceAll('\n', ' ')
    const level = /<strong>- (Level [^ ]*)/.exec(levelHtml)[1]
    const sublevels = levelHtml.split('<h4').slice(1).map(mapSublevelHtmlToSublevelInfo)
    return { level, sublevels }
}

const parseWikiWikiHtmlParts = html => {
    const levelHtmls = splitByLevelAnchors(html)
    return levelHtmls.map(mapToLevelAndSublevelsWithSongs)
}

module.exports = parseWikiWikiHtmlParts