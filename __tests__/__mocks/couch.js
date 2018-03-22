export const mockDocsByIds = jest.fn()

const mock = jest.fn().mockImplementation(() => {
  const CHANGE1 = {id: '123', seq: 1}
  const CHANGE2 = {id: '345', deleted: true, seq: 2}

  return {
    changes: (limit, seq) => {
      return [[CHANGE1, CHANGE1, CHANGE2], 2]
    },
    docsByIds: mockDocsByIds
  }
})

export default mock
