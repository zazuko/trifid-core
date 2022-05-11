import assert from 'assert'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, test } from '@jest/globals'

import schema from '../lib/config/schema.js'
import parser from '../lib/config/parser.js'
import handler from '../lib/config/handler.js'
import { fileCallback } from '../lib/resolvers.js'

describe('config', () => {
  test('should be an object', () => {
    assert.equal(typeof schema, 'object')
  })

  test('should not throw if the configuration is empty', () => {
    assert.doesNotThrow(() => {
      parser()
    })

    assert.doesNotThrow(() => {
      parser({})
    })
  })

  test('sould throw if we add some non-supported fields', () => {
    assert.throws(() => {
      parser({ thisFieldIsNotSupported: true })
    })
  })

  test('should not throw if supported properties are empty', () => {
    assert.doesNotThrow(() => {
      parser({
        extends: [],
        globals: {},
        server: {},
        middlewares: {}
      })
    })
  })

  test('should not throw on valid values for extends', () => {
    assert.doesNotThrow(() => {
      parser({
        extends: []
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path'
        ]
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path1',
          'path2',
          'path3'
        ]
      })
    })
  })

  test('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    assert.throws(() => {
      parser({
        extends: 'this is a string instead of an array'
      })
    })

    // this is not an array of strings, but an array of integers
    assert.throws(() => {
      parser({
        extends: [1, 2, 3]
      })
    })
  })

  test('should not throw on valid values for server', () => {
    assert.doesNotThrow(() => {
      parser({
        server: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080
          },
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080
          },
          express: {
            foo: 'bar'
          }
        }
      })
    })
  })

  test('should throw on invalid values for server', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        server: 'this is a string instead of an object'
      })
    })

    // unsupported field
    assert.throws(() => {
      parser({
        server: {
          listener: {},
          express: {},
          unsupportedField: true
        }
      })
    })

    // invalid port number
    assert.throws(() => {
      parser({
        server: {
          listener: {
            port: 808080
          },
          express: {}
        }
      })
    })

    // unsupported listener property
    assert.throws(() => {
      parser({
        server: {
          listener: {
            port: 8080,
            unsupportedField: true
          },
          express: {}
        }
      })
    })
  })

  test('should not throw on valid values for globals', () => {
    assert.doesNotThrow(() => {
      parser({
        globals: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar'
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar',
          jon: 'doe'
        }
      })
    })
  })

  test('should throw on invalid values for globals', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        globals: 'this is a string instead of an object'
      })
    })

    // complex object, keys and values should be strings
    assert.throws(() => {
      parser({
        globals: {
          foo: {
            bar: 'baz'
          }
        }
      })
    })
  })

  test('should not throw on valid values for middlewares', () => {
    assert.doesNotThrow(() => {
      parser({
        middlewares: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module'
          }
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar'
            }
          }
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar',
              baz: null
            }
          }
        }
      })
    })

    // allow complex config object
    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: {
                bar: 'baz'
              }
            }
          }
        }
      })
    })
  })

  test('should throw on invalid values for middlewares', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        middlewares: 'this is a string instead of an object'
      })
    })

    // not scoped into an object per middleware
    assert.throws(() => {
      parser({
        middlewares: {
          order: 42,
          name: 'module'
        }
      })
    })

    // missing "module" property
    assert.throws(() => {
      parser({
        middlewares: {
          module: {
            order: 42
          }
        }
      })
    })
  })

  test('should not throw when loading an empty configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/empty.json'))).resolves.not.toThrow()
  })

  test('should not throw when loading a basic configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/basic.json'))).resolves.not.toThrow()
  })

  test('should throw when trying to load a non-existant configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/non-existant.json'))).rejects.toThrow()
  })
})