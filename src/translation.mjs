const translations = Object.entries({
  '低速・ソフランにより個人差大 人によってlv.9の+1~+2並': [
    'Lv9 (+1~2) for some (slow/bpm changes)',
    'Large individual differences depending on low speed/sofran, +1~+2 of Lv.9 depending on the person'],
  '新規追加楽曲': [
    'New',
    'Newly added songs'],
  'Beyond譜面追加楽曲': [
    'Byd★',
    'New Beyond charts'],
  'Eternal譜面追加楽曲': [
    'Etr★',
    'New Eternal charts'],
  '難易度変更楽曲': [
    'Chg⇅',
    'Difficulty change'],
  'ロングノーツの特殊な取り方を把握しなければ大きく難化': [
    'May be very hard due to long notes gimmicks',
    'If you don\'t know the special way to use long notes, it will be very difficult'],
  '譜面速度を上げることで+1まで易化 低速により個人差大': [
    'Varies due to slow speed (Easier +1 if sped up)',
    'Easier to +1 by increasing the music speed. Large individual differences due to lower speed'],
  'アーク難により個人差大 アークが苦手であれば難化': [
    'Varies a lot, may be harder due to arcs',
    'Great individual differences depending on arc difficulty If you are not good at arc, it will be difficult'],
  '非常に個人差が大きい 人によっては難化': [
    'Varies, may be harder for some',
    'Very individual differences; difficult for some people'],
  'アーク主体につき極めて個人差が大きい': [
    'Varies extremely due to arcs',
    'Extremely large individual differences due to arc main body'],
  '縦連が苦手であれば難化 個人差大': [
    'Varies a lot, may be harder due to vertical doubles',
    'Difficult if you are not good at tandem. Great individual differences'],
  '人によっては更に難化 (詐称相当)': [
    'Even harder for some (like "spoof")',
    'Even more difficult for some people (equivalent to fraud)'],
  '個人差大 (人によっては詐称相当)': [
    'Varies a lot, harder for some (like "spoof")',
    'Large individual differences (equivalent to fraud for some people)'],
  '個人差大、人によっては易化': [
    'Varies a lot, easier for some',
    'Large individual differences, easier for some people'],
  '個人差大、人によっては難化': [
    'Varies a lot, harder for some',
    'Large individual differences, difficult for some people'],
  '個人差あり 人によっては易化': [
    'Varies, easier for some',
    'Individual differences, easier for some people'],
  '譜面傾向特殊につき個人差大': [
    'Varies a lot due to gimmicks',
    'Large individual differences due to special musical score tendency'],
  '個人差大、譜面の暗記が前提': [
    'Varies a lot, requires memorization',
    'Large individual differences, memorization of musical scores is a prerequisite'],
  'トリル主体につき個人差あり': [
    'Varies for some due to drills',
    'Individual differences due to trills'],
  'アーク主体につき個人差大': [
    'Large personal differences due to arcs',
    'Large individual differences due to arc-based'],
  'トリル主体につき個人差大': [
    'Varies a lot due to drills',
    'Large individual differences due to trills'],
  'アークが苦手であれば難化': [
    'May be harder due to arcs',
    'If you are not good at arcing, it will be difficult'],
  '非常に個人差が大きい': [
    'Large personal differences',
    'Very individual differences'],
  '人によっては更に易化': [
    'Easier for some',
    'Easier for some'],
  '個人差が極めて大きい': [
    'Extremely large personal differences',
    'Extremely large individual differences'],
  '縦連が苦手だと難化': [
    'May be harder due to vertical doubles',
    'Difficult if you are not good at vertical connections'],
  '低速につき個人差大': [
    'Varies a lot due to slow speed',
    'Large individual differences due to low speed'],
  '低速により個人差大': [
    'Varies a lot due to slow speed',
    'Large individual differences due to low speed'],
  '人によっては難化': [
    'Harder for some',
    'Difficult for some people'],
  '個人差あり': [
    'Personal differences',
    'Individual differences'],
  '個人差大': [
    'Large personal differences',
    'Large individual differences'],
  '現lv7+': [
    '(7+)',
    'Currently 7+'],
  '現lv7': [
    '(7)',
    'Currently 7'],
  '人によっては易化': [
    'Easier for some',
    'Easier for some people'],
  '+2相当、': [
    'Like +2, ',
    '+2 equivalent,'],
  '+2相当': [
    'Like +2',
    'equivalent to +2'],
  '詐称相当': [
    'Like "spoof"'],
})

export default str =>
  translations.reduce(
    (result, [jp, [eng, engfull]]) => result.replaceAll(jp, eng),
    str.toLowerCase()
  )