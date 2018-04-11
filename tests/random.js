import * as random from './mocks/random'

describe('random', () => {
  test('docs', () => {
    const docs = random.docs(10)
    expect(docs.length).toEqual(10)
    expect(docs[0].data.split('-').length).toEqual(3)
  })
})
