import R from 'ramda'

const WORDS = [
  ['happy', 'sad', 'angry', 'scared', 'morose', 'pensive', 'quixotic'],
  ['red', 'blue', 'green', 'orange', 'pink', 'mustard', 'vermillion'],
  ['cat', 'dog', 'panda', 'tiger', 'ant', 'lemur', 'dugong', 'vontsira']
]

const number = (max) => Math.floor(Math.random() * max)
const word = (idx) => R.nth(number(WORDS[idx].length), WORDS[idx])
export const label = () => R.join('-', [word(0), word(1), word(2)])

export const docs = (total) => {
  return R.map(
    R.compose(R.objOf('data'), () => label()),
    R.range(0, total)
  )
}
