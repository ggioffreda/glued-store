const http = require('http')
const bodyParser = require('body-parser')
const StoreModel = require('./model').StoreModel

function StoreHttp (express) {
  express = express || require('express')
  this._model = null
  this._channel = null
  this._server = null
  this._router = null
  this._state = {}

  this.getName = function () {
    return 'store-http'
  }

  this.getState = function () {
    return this._state
  }.bind(this)

  this.requires = function (dependency) {
    return ['message-bus', 'data-layer'].indexOf(dependency) > -1
  }

  this.setUp = function (dependencies) {
    this._channel = dependencies['message-bus']
    this._model = new StoreModel(dependencies['data-layer'])

    this._app = express()
    this._app.use(bodyParser.json())
    this._app.use('/', this.getRouter())

    this._state.port = parseInt(process.env.GLUED_STORE_PORT || 9210)
    this._state.host = process.env.GLUED_STORE_HOST || '127.0.0.1'

    this._server = http.createServer(this._app)
    this._server.listen(this._state.port, this._state.host)
  }.bind(this)

  this.putTypeAction = function (req, res) {
    const domain = req.params.objectDomain
    const type = req.params.objectType

    this._model.createType(domain, type, function (err, data) {
      if (err) {
        return res.status(404).json({ message: err.message })
      } else {
        if (data.action === 'created') {
          _publishMessage(domain, type, 'type.created', { domain: domain, type: type })
          return res.status(201).end('')
        }

        return res.status(204).end('')
      }
    })
  }.bind(this)

  this.postObjectAction = function (req, res) {
    _postOrPutObject(req, res, req.body, this._model)
  }.bind(this)

  this.putObjectAction = function (req, res) {
    const document = req.body
    document.id = req.params.objectId
    _postOrPutObject(req, res, document, this._model)
  }.bind(this)

  this.patchObjectAction = function (req, res) {
    const domain = req.params.objectDomain
    const type = req.params.objectType
    const id = req.params.objectId
    const patch = req.body

    if (!patch.items || !patch.items.length) {
      res.status(400).json({ message: 'Patch contains no items' })
      return
    }

    this._model.patchObject(domain, type, id, patch, function (err, data) {
      if (err) res.status(404).json({ message: err.message })
      else {
        _storeObjectResponse(res, domain, type, patch, data)
      }
    })
  }.bind(this)

  this.getObjectAction = function (req, res) {
    this._model.getObject(req.params.objectDomain, req.params.objectType, req.params.objectId, function (err, document) {
      if (err) res.status(404).json({ message: err.message })
      else res.json(document)
    })
  }.bind(this)

  this.deleteObjectAction = function (req, res) {
    const domain = req.params.objectDomain
    const type = req.params.objectType
    const id = req.params.objectId

    this._model.deleteObject(domain, type, id, function (err, data) {
      if (err) res.status(404).json({ message: err.message })
      else {
        _publishMessage(domain, type, id + '.' + data.action, { id: id })
        res.status(204).end('')
      }
    })
  }.bind(this)

  this.getRouter = function () {
    if (this._router === null) {
      this._router = express.Router()

      this._router.put('/:objectDomain/:objectType', this.putTypeAction)
      this._router.post('/:objectDomain/:objectType', this.postObjectAction)
      this._router.put('/:objectDomain/:objectType/:objectId', this.putObjectAction)
      this._router.patch('/:objectDomain/:objectType/:objectId', this.patchObjectAction)
      this._router.get('/:objectDomain/:objectType/:objectId', this.getObjectAction)
      this._router.delete('/:objectDomain/:objectType/:objectId', this.deleteObjectAction)
    }

    return this._router
  }.bind(this)

  var _publishMessage = function (domain, type, action, document) {
    this._channel.publish(['store', domain, type, action].join('.'), new Buffer(JSON.stringify(document)))
  }.bind(this)

  var _postOrPutObject = function (req, res, document, model) {
    const domain = req.params.objectDomain
    const type = req.params.objectType
    _storeObject(res, domain, type, document, model)
  }

  var _storeObject = function (res, domain, type, document, model) {
    model.storeObject(domain, type, document, function (err, data) {
      if (err) res.status(404).json({ message: err.msg })
      else {
        _storeObjectResponse(res, domain, type, document, data)
      }
    })
  }

  var _storeObjectResponse = function (res, domain, type, document, data) {
    var id = data.id
    if (data.action !== 'none') {
      _publishMessage(domain, type, id + '.' + data.action, document)
    }
    if (data.action === 'inserted') {
      res.status(201).json({ id: id })
    } else {
      res.status(204).end('')
    }
  }
}

exports.StoreHttp = StoreHttp
