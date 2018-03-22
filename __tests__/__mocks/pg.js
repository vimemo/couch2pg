export const mockInsert = jest.fn()
export const mockDelete = jest.fn()
export const mockUpdateSeq = jest.fn()

const mock = jest.fn().mockImplementation(() => {
  return {
    seq: () => 0,
    delete: mockDelete,
    insert: mockInsert,
    updateSeq: mockUpdateSeq
  }
})

export default mock
