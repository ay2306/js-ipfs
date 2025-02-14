'use strict'

const IPFSFactory = require('ipfsd-ctl')
const parallel = require('async/parallel')
const MockPreloadNode = require('./test/utils/mock-preload-node')
const EchoServer = require('interface-ipfs-core/src/utils/echo-http-server')
const callbackify = require('callbackify')

const ipfsdServer = IPFSFactory.createServer()
const preloadNode = MockPreloadNode.createNode()
const echoServer = EchoServer.createServer()

module.exports = {
  bundlesize: { maxSize: '650kB' },
  webpack: {
    resolve: {
      mainFields: ['browser', 'main'],
      aliasFields: ['browser', 'browser-all-ipld-formats'],
    }
  },
  karma: {
    files: [{
      pattern: 'node_modules/interface-ipfs-core/test/fixtures/**/*',
      watched: false,
      served: true,
      included: false
    }],
    browserNoActivityTimeout: 100 * 1000,
  },
  hooks: {
    node: {
      pre: (cb) => {
        parallel([
          (cb) => callbackify(preloadNode.start)(cb),
          (cb) => echoServer.start(cb)
        ], cb)
      },
      post: (cb) => {
        parallel([
          (cb) => callbackify(preloadNode.stop)(cb),
          (cb) => echoServer.stop(cb)
        ], cb)
      }
    },
    browser: {
      pre: (cb) => {
        parallel([
          (cb) => {
            ipfsdServer.start()
            cb()
          },
          (cb) => callbackify(preloadNode.start)(cb),
          (cb) => echoServer.start(cb)
        ], cb)
      },
      post: (cb) => {
        parallel([
          (cb) => {
            ipfsdServer.stop()
            cb()
          },
          (cb) => callbackify(preloadNode.stop)(cb),
          (cb) => echoServer.stop(cb)
        ], cb)
      }
    }
  }
}
