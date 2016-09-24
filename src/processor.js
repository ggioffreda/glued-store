function StoreProcessor(model, messageBus) {
    this._model = model;
    this._channel = messageBus;

    this.putTypeHandler = function (topicKeys, message, cb) {
        const domain = topicKeys[1],
            type = topicKeys[2];

        this._model.createType(domain, type, function (err, data) {
            if (err) {
                // send error to the message bus
            } else {
                cb();
                if ('created' === data.action) {
                    _publishMessage(domain, type, 'type.created', { domain: domain, type: type });
                }
            }
        });
    }.bind(this);

    this.postObjectHandler = function (topicKeys, message, cb) {
        const domain = topicKeys[1],
            type = topicKeys[2];

        _storeObject(domain, type, message, model, cb);
    }.bind(this);

    this.putObjectHandler = function (topicKeys, message, cb) {
        const domain = topicKeys[1],
            type = topicKeys[2];

        message.id = topicKeys[3];

        _storeObject(domain, type, message, model, cb);
    }.bind(this);

    this.patchObjectHandler = function (topicKeys, message, cb) {
        const domain = topicKeys[1],
            type = topicKeys[2],
            id = topicKeys[3],
            patch = message;

        if (!patch.items || !patch.items.length) {
            cb();
            // send error to message bus
            return;
        }

        this._model.patchObject(domain, type, id, patch, function (err, data) {
            if (err) {
                // send error to message bus
            } else {
                cb();
                _buildResponse(domain, type, patch, data);
            }
        });
    }.bind(this);

    this.deleteObjectHandler = function (topicKeys, message, cb) {
        const domain = topicKeys[1],
            type = topicKeys[2],
            id = topicKeys[3];

        this._model.deleteObject(domain, type, id, function (err, data) {
            if (err) {
                // send error to the message bus
            } else {
                cb();
                _buildResponse(domain, type, { id: id }, data);
            }
        });
    }.bind(this);

    this.subscribeHandlers = function () {
        this._channel.subscribe('*.*.*.create.store', _filterKeyAndMessage(this.putTypeHandler), 'store_put_type');
        this._channel.subscribe('*.*.*.post.store', _filterKeyAndMessage(this.postObjectHandler), 'store_post');
        this._channel.subscribe('*.*.*.*.put.store', _filterKeyAndMessage(this.putObjectHandler), 'store_put');
        this._channel.subscribe('*.*.*.*.patch.store', _filterKeyAndMessage(this.patchObjectHandler), 'store_patch');
        this._channel.subscribe('*.*.*.*.delete.store', _filterKeyAndMessage(this.deleteObjectHandler), 'store_delete');
    };

    var _filterKeyAndMessage = function (consumer) {
        return function (key, rawMessage, cb) {
            return consumer(key.split('.'), JSON.parse(rawMessage.toString()), cb);
        };
    };

    var _publishMessage = function (domain, type, action, document) {
        this._channel.publish([ 'store', domain, type, action ].join('.'), new Buffer(JSON.stringify(document)));
    }.bind(this);

    var _storeObject = function (domain, type, document, model, cb) {
        model.storeObject(domain, type, document, function (err, data) {
            if (err) {
                // send error to message bus
            } else {
                cb();
                _buildResponse(domain, type, document, data);
            }
        });
    };

    var _buildResponse = function (domain, type, document, data) {
        var id = data.id;
        if ('none' !== data.action) {
            _publishMessage(domain, type, id + '.' + data.action, document);
        }
    }
}

exports.StoreProcessor = StoreProcessor;
