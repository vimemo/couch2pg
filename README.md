# couch2pg

[![Build Status](https://travis-ci.org/vimemo/couch2pg.svg?branch=master)](https://travis-ci.org/vimemo/couch2pg)
[![Coverage Status](https://coveralls.io/repos/github/vimemo/couch2pg/badge.svg?branch=master)](https://coveralls.io/github/vimemo/couch2pg?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/617b91fac7c0eeaed2d3/maintainability)](https://codeclimate.com/github/vimemo/couch2pg/maintainability)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### TODO

- cli/env

# Running tests

docker-compose run tests yarn test

# Running tests with coverage

docker-compose run tests yarn test --coverage

# Running tests in watch mode

docker-compose run tests yarn test --watchAll

# Running tests against local databases instead of docker-compose

```

export TEST_PG_URL=postgres://localhost:5432
export TEST_COUCH_URL=http://admin:pass@localhost:5984
yarn test --coverage --projects jest-*.config.js

```

# Helpful Commands

```

docker-compose build/ps/down/rm
docker ps/stop/rm

```

### Notes

- jest: snapshot testing, mocking support, performant

https://medium.com/airbnb-engineering/unlocking-test-performance-migrating-from-mocha-to-jest-2796c508ec50

https://www.youtube.com/watch?v=NtjyeojAOBs

- ramda

https://www.codementor.io/michelre/functional-javascript-why-i-prefer-using-ramda-over-lodash-or-underscore-dzovysq11

- async/await

https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9

- es6 classes

https://www.quora.com/What-are-the-benefits-of-using-classes-vs-function-in-ES6

https://stackoverflow.com/questions/36099721/javascript-what-is-the-difference-between-function-and-class
