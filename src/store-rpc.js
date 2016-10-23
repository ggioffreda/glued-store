const Store = require('./store').Store

function StoreRpc () {
  const self = this

  this._store = null
  this._channel = null

  this.getName = function () {
    return 'store-rpc'
  }

  this.getState = function () {
    return {}
  }

  this.requires = function (dependency) {
    return ['message-bus', 'data-layer'].indexOf(dependency) > -1
  }

  this.setUp = function (dependencies) {
    self._channel = dependencies['message-bus']
    self._store = new Store(self._channel, dependencies['data-layer'])

    self._channel.getRpc().accept('store_rpc', function (request, rawRequest, replier) {
      const method = request.method
      const domain = request.domain
      const type = request.type
      var id

      if (method === 'create') {
        self._store.createType(domain, type, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'post') {
        self._store.storeObject(domain, type, request.object, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'put') {
        request.object.id = request.id
        self._store.storeObject(domain, type, request.object, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'patch') {
        id = request.id
        const patch = request.object

        if (!patch.items || !patch.items.length) {
          replier({ error: { message: 'Patch contains no items' } })
          return
        }

        self._store.patchObject(domain, type, id, patch, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'delete') {
        id = request.id

        self._store.deleteObject(domain, type, id, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'get') {
        id = request.id

        self._store.getObject(domain, type, id, function (err, document) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: document })
          }
        })
      }
    })
  }
}

module.exports.StoreRpc = StoreRpc
