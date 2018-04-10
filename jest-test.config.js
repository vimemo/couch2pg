module.exports = {
  displayName: 'test:jest',
  // moduleNameMapper: {
  //
  // },
  // transform: {
  //   '^.+\\.js$': 'babel-jest'
  // },
  'testMatch': ['<rootDir>/tests/**/*.js'],
  'testEnvironment': 'node',
  'collectCoverageFrom': ['<rootDir>/lib/**/*.{js}'],
  'coverageThreshold': {
    'global': {
      'branches': 100,
      'functions': 100,
      'lines': 100,
      'statements': 100
    }
  },
  'testPathIgnorePatterns': ['mocks']
}
