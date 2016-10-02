const StoreModel = require('./model').StoreModel

function StoreRpc () {
  this._model = null
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
    this._channel = dependencies['message-bus']
    this._model = new StoreModel(this._channel, dependencies['data-layer'])

    this._channel.getRpc().accept('store_rpc', function (request, replier) {
      const method = request.method
      const domain = request.domain
      const type = request.type

      if (method === 'type') {
        this._model.createType(domain, type, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'post') {
        this._model.storeObject(domain, type, request.object, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'put') {
        request.object.id = request.id
        this._model.storeObject(domain, type, request.object, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'patch') {
        const id = request.id
        const patch = request.object

        if (!patch.items || !patch.items.length) {
          replier({ error: { message: 'Patch contains no items' } })
          return
        }

        this._model.patchObject(domain, type, id, patch, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'delete') {
        const id = request.id

        this._model.deleteObject(domain, type, id, function (err, data) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: data })
          }
        })
      } else if (method === 'get') {
        const id = request.id

        this._model.getObject(domain, type, id, function (err, document) {
          if (err) {
            replier({ error: { message: err.message } })
          } else {
            replier({ data: document })
          }
        })
      }
    }.bind(this))
  }.bind(this)
}

module.exports.StoreRpc = StoreRpc
