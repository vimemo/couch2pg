module.exports = {
  displayName: 'jest:test',
  'testMatch': ['<rootDir>/tests/**/*.js'],
  'testEnvironment': 'node',
  'collectCoverageFrom': ['<rootDir>/lib/**/*.{js}'],
  'coverageThreshold': {
    'global': {
      'branches': 66,
      'functions': 90,
      'lines': 90,
      'statements': 90
    }
  },
  'testPathIgnorePatterns': ['mocks']
}
