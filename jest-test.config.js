module.exports = {
  displayName: 'jest:test',
  'testMatch': ['<rootDir>/tests/**/*.js'],
  'testEnvironment': 'node',
  'collectCoverageFrom': ['<rootDir>/lib/**/*.{js}'],
  'coverageThreshold': {
    'global': {
      'branches': 60,
      'functions': 100,
      'lines': 100,
      'statements': 100
    }
  },
  'testPathIgnorePatterns': ['mocks']
}
