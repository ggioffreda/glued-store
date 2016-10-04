const Store = require('./store').Store

function StorePubSub () {
  this._store = null
  this._channel = null

  this.getName = function () {
    return 'store-pubsub'
  }

  this.getState = function () {
    return {}
  }

  this.requires = function (dependency) {
    return ['message-bus', 'data-layer'].indexOf(dependency) > -1
  }

  this.setUp = function (dependencies) {
    this._channel = dependencies['message-bus']
    this._store = new Store(this._channel, dependencies['data-layer'])

    this.subscribeHandlers()
  }.bind(this)

  this.putTypeHandler = function (topicKeys, message, cb) {
    const domain = topicKeys[1]
    const type = topicKeys[2]

    this._store.createType(domain, type, function (err, data) {
      if (err) {
        // send error to the message bus
      } else {
        cb()
      }
    })
  }.bind(this)

  this.postObjectHandler = function (topicKeys, message, cb) {
    const domain = topicKeys[1]
    const type = topicKeys[2]

    _storeObject(domain, type, message, this._store, cb)
  }.bind(this)

  this.putObjectHandler = function (topicKeys, message, cb) {
    const domain = topicKeys[1]
    const type = topicKeys[2]

    message.id = topicKeys[3]

    _storeObject(domain, type, message, this._store, cb)
  }.bind(this)

  this.patchObjectHandler = function (topicKeys, message, cb) {
    const domain = topicKeys[1]
    const type = topicKeys[2]
    const id = topicKeys[3]
    const patch = message

    if (!patch.items || !patch.items.length) {
      cb()
      // send error to message bus
      return
    }

    this._store.patchObject(domain, type, id, patch, function (err, data) {
      if (err) {
        // send error to message bus
      } else {
        cb()
      }
    })
  }.bind(this)

  this.deleteObjectHandler = function (topicKeys, message, cb) {
    const domain = topicKeys[1]
    const type = topicKeys[2]
    const id = topicKeys[3]

    this._store.deleteObject(domain, type, id, function (err, data) {
      if (err) {
        // send error to the message bus
      } else {
        cb()
      }
    })
  }.bind(this)

  this.subscribeHandlers = function () {
    this._channel.subscribe('*.*.*.create.store', _filterKeyAndMessage(this.putTypeHandler), 'store_put_type')
    this._channel.subscribe('*.*.*.post.store', _filterKeyAndMessage(this.postObjectHandler), 'store_post')
    this._channel.subscribe('*.*.*.*.put.store', _filterKeyAndMessage(this.putObjectHandler), 'store_put')
    this._channel.subscribe('*.*.*.*.patch.store', _filterKeyAndMessage(this.patchObjectHandler), 'store_patch')
    this._channel.subscribe('*.*.*.*.delete.store', _filterKeyAndMessage(this.deleteObjectHandler), 'store_delete')
  }

  var _filterKeyAndMessage = function (consumer) {
    return function (key, message, rawMessage, cb) {
      if (key === null) {
        // do nothing
        return cb()
      }
      return consumer(key.split('.'), message, cb)
    }
  }

  var _storeObject = function (domain, type, document, model, cb) {
    model.storeObject(domain, type, document, function (err, data) {
      if (err) {
        // send error to message bus
      } else {
        cb()
      }
    })
  }
}

exports.StorePubSub = StorePubSub
