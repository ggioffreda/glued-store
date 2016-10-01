const assert = require('assert')
const sinon = require('sinon')
const dataLayer = require('glued-common').dataLayer
const m = require('../src/model')
const p = require('../src/pubsub')
const testDatabase = 'test'
const testTable = 'test_table'

var mockMBChannel = null
var model = null
var processor = null
var missingDependencies = false

const mocha = require('mocha')
const describe = mocha.describe
const beforeEach = mocha.beforeEach
const it = mocha.it
const after = mocha.after

describe('StorePubSub', function () {
  beforeEach(function (done) {
    dataLayer.connectModule(function (err, dataLayer) {
      if (err) {
        missingDependencies = true
        done()
        return
      }

      mockMBChannel = sinon.stub({ publish: function () { }, subscribe: function () { } })
      model = new m.StoreModel(mockMBChannel, dataLayer)
      processor = new p.StorePubSub()
      processor._channel = mockMBChannel
      processor._model = model

      processor.subscribeHandlers()

      done()
    })
  })

  describe('#subscribeHandlers()', function () {
    var args

    beforeEach(function () {
      args = mockMBChannel.subscribe.args.reduce(function (carry, item) {
        carry.keys.push(item[0])
        carry.queues.push(item[2])
        return carry
      }, { keys: [], queues: [] })
    })

    it('should subscribe to the type creation requests topic', function () {
      assert(args.keys.indexOf('*.*.*.create.store') > -1)
      assert(args.queues.indexOf('store_put_type') > -1)
    })

    it('should subscribe to the object post requests topic', function () {
      assert(args.keys.indexOf('*.*.*.post.store') > -1)
      assert(args.queues.indexOf('store_post') > -1)
    })

    it('should subscribe to the object put requests topic', function () {
      assert(args.keys.indexOf('*.*.*.*.put.store') > -1)
      assert(args.queues.indexOf('store_put') > -1)
    })

    it('should subscribe to the object patch requests topic', function () {
      assert(args.keys.indexOf('*.*.*.*.patch.store') > -1)
      assert(args.queues.indexOf('store_patch') > -1)
    })

    it('should subscribe to the type creation requests topic', function () {
      assert(args.keys.indexOf('*.*.*.*.delete.store') > -1)
      assert(args.queues.indexOf('store_delete') > -1)
    })
  })

  describe('#putTypeHandler()', function () {
    var publishSpy

    function initialiseSpy (done) {
      publishSpy = sinon.spy(function () {
        assert(publishSpy.calledOnce)
        assert(publishSpy.calledWith(
          ['store', testDatabase, testTable, 'type', 'created'].join('.'),
          { domain: testDatabase, type: testTable }
        ))
        done()
      })
      if (missingDependencies) return this.skip()

      mockMBChannel = { publish: publishSpy }
      model = new m.StoreModel(mockMBChannel, dataLayer)
      processor = new p.StorePubSub()
      processor._channel = mockMBChannel
      processor._model = model
    }

    it('should create a new type, and send a message to the exchange', function (done) {
      if (missingDependencies) return this.skip()

      initialiseSpy(done)

      dataLayer.tableDelete(testDatabase, testTable, function () {
        processor.putTypeHandler(['test', testDatabase, testTable, 'create', 'store'], {}, function () {
          // do nothing
        })
      })
    })
  })

  after(function (done) {
    if (missingDependencies) {
      this.skip()
      return done()
    }

    dataLayer.tableDelete(testDatabase, testTable, function () {
      done()
    })
  })
})
