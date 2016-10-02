Glue - Store
============

Simple interface for storing objects through HTTP, Pub-Sub or RPC.

[![Build Status](https://travis-ci.org/ggioffreda/glued-store.svg?branch=master)](https://travis-ci.org/ggioffreda/glued-store)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Usage
-----

This can be used as a standalone library or server for easily storing data into
RethinkDB from different sources.

**Example: Using Logstash to centralise your logs into a RethinkDB database**

To store your logs using [Logstash](https://www.elastic.co/products/logstash) you could
configure Logstash it like so:


```
input {
    file {
        path => "/var/log/**/*.log"
        start_position => beginning
        ignore_older => 0
    }
}

output {
    rabbitmq {
        exchange => 'message_bus'
        exchange_type => 'topic'
        key => 'logstash.log.var.post.store'
        host => '127.0.0.1'
    }
}
```

**Glue entry point**

This is also the main entry point for Glue ecosystems. Every service in a way
or another listens for object events on the message bus and performs additional
operations accordingly. There are services that scan the objects and save the
information collected, others that send texts or notifications if the stored object
is recognised to be a message, others that logs everything that goes on between the
users and the store.

Interfaces
----------

To store objects there are two different interfaces available: an HTTP REST API
with POST, PUT, PATCH, DELETE and GET methods and a Pub-Sub interface thanks to a 
service subscribing to a list of topics any module can publish objects to.

### HTTP API

The REST API accepts only `application/json` content type when posting, 
putting or patching objects.

Main methods:

- `POST /:objectDomain/:objectType` stores an object and sends a
  message with topic *store.{domain}.{type}.{id}.inserted* or 
  *store.{domain}.{type}.{id}.updated* depending if the object is new or
  if it gets updated. The content of the message is the JSON encoded object. 
  Use this when you don't want to specify the ID of the object or if you want
  it returned in the response.

- `PUT /:objectDomain/:objectType/:objectId` stores an object and sends a
  message with topic *store.{domain}.{type}.{id}.inserted* or 
  *store.{domain}.{type}.{id}.updated* depending if the object is new or
  if it gets updated. No message is sent if no change is made. The content of 
  the message is the JSON encoded object. Use this if you already know the 
  object ID.

- `PATCH /:objectDomain/:objectType/:objectId` patches an object and sends
  a message with topic *store.{domain}.{type}.{id}.updated*. No message is
  sent if no change is made. This endpoint accept a list of actions to be
  executed on the requested object, for more information see
  *Store.patchObject*.

Other methods:

- `GET /:objectDomain/:objectType/:objectId` returns the requested object.

- `DELETE /:objectDomain/:objectType/:objectId` deletes the specified object
  and sends a message with topic *store.{domain}.{type}.{id}.deleted*. The 
  message contains the ID of the deleted object, JSON encoded.

- `PUT /:objectDomain/:objectType` prepare for a new domain and/or type and
  sends a message with topic *store.{domain}.{type}.type.created*. The message
  contains a JSON encoded object with two properties, domain and type.

Examples:

    $ curl --request PUT \
        --url http://127.0.0.1:9210/glued/benchmark

    $ curl --request POST \
        --url http://127.0.0.1:9210/glued/benchmark \
        --header 'content-type: application/json' \
        --data '{"payload":"test payload mesage","counter":123}'
    
    $ curl --request PUT \
        --url http://127.0.0.1:9210/glued/benchmark/f4b9fc30-7f87-4f4a-9987-5389e19cb1a0 \
        --header 'content-type: application/json' \
        --data '{"payload":"test payload mesage","counter":123}'
    
    $ curl --request PATCH \
        --url http://127.0.0.1:9210/glued/benchmark/f4b9fc30-7f87-4f4a-9987-5389e19cb1a0 \
        --header 'content-type: application/json' \
        --data '{"items":[{"action":"update","patch":{"payload":"test payload mesage","counter":234}}]}'
    
    $ curl --request DELETE \
        --url http://127.0.0.1:9210/glued/benchmark/f4b9fc30-7f87-4f4a-9987-5389e19cb1a0 \
        --header 'content-type: application/json'

### Pub-Sub API

Main methods:

- `PUBLISH ON *.{domain}.{type}.post.store` stores an object and sends a
  message with topic *store.{domain}.{type}.{id}.inserted* or 
  *store.{domain}.{type}.{id}.updated* depending if the object is new or
  if it gets updated. The content of the message is the JSON encoded object. 
  Use this when you don't want to specify the ID of the object or if you want
  it returned in the response.

- `PUBLISH ON *.{domain}.{type}.{id}.put.store` stores an object and sends a
  message with topic *store.{domain}.{type}.{id}.inserted* or 
  *store.{domain}.{type}.{id}.updated* depending if the object is new or
  if it gets updated. No message is sent if no change is made. The content of 
  the message is the JSON encoded object. Use this if you already know the 
  object ID.

- `PUBLISH ON *.{domain}.{type}.{id}.patch.store` patches an object and sends
  a message with topic *store.{domain}.{type}.{id}.updated*. No message is 
  sent if no change is made. This endpoint accept a list of actions to be
  executed on the requested object, for more information see 
  *Store.patchObject*.

- `PUBLISH ON *.{domain}.{type}.{id}.delete.store` deletes the specified 
  object and sends a message with topic *store.{domain}.{type}.{id}.deleted*.
  The message contains the ID of the deleted object, JSON encoded.

To create a domain or type:

- `PUBLISH ON *.{domain}.{type}.create.store` prepare for a new domain and/or 
  type and sends a message with topic *store.{domain}.{type}.type.created*. The
  message contains a JSON encoded object with two properties, domain and type.

Example:

```javascript
const MessageBus = require('glued-message-bus').MessageBus,
  mb = new MessageBus('amqp://localhost', 'glued_message_bus');

mb.connectModule(function (err, messageBusChannel) {
  if (err) throw err;

  messageBusChannel.publish('my_package.music.song.post', {
    artist: 'Led Zeppelin',
    title: 'Stariway To Heaven'
  });
  
  messageBusChannel.publish('my_package.music.song.a9d71caa-b946-4d0b-a5fb-3d95a6f0a3f1.put', {
    artist: 'Led Zeppelin',
    title: 'Whole Lotta Love'
  });
  
  messageBusChannel.publish('my_package.music.song.a9d71caa-b946-4d0b-a5fb-3d95a6f0a3f1.delete', {});
});
```

Installation
------------

You can install this library using `npm`:

    $ npm install --save glued-store

To run the services you can install the module with the `-g` flag and then run the
`glued-store-http` and `glued-store-amqp` commands:

    $ npm install -g glued-store
    $ glued-store-http
    $ glued-store-pubsub

The HTTP server will run by default on port `9210`. Both services will connect to 
AMQP and RethinkDB on the local machine. To change these options you can use the
environment.

To change host and/or port for the HTTP service:

- **GLUED_STORE_PORT**: the number of the port to use, default `9210`;

- **GLUED_STORE_HOST**: the host to bind the server to, default `127.0.0.1`.

To change the configuration for AMQP and/or RethinkDB:

- **GLUED_AMQP**: the URI of the AMQP server, default to `amqp://localhost`;
  
- **GLUED_MESSAGE_BUS**: the name of the AMQP exchange, default to 
  `glued_message_bus`;
  
- **GLUED_RETHINKDB**: the path to a JS/JSON file holding the configuration
  for RethinkDB, default to an empty configuration `{}`.
  
The above are inherited from
[Glue Common Utilities](https://github.com/ggioffreda/glued-common), check its
documentation for more information.

Example:

    $ GLUE_STORE_PORT=8080 GLUE_AMQP=amqp://1.2.3.4 \
        RETHINKDB=/path/to/rethinkdb.conf.json glued-store-http
    $ GLUE_AMQP=amqp://1.2.3.4 \
        RETHINKDB=/path/to/rethinkdb.conf.json glued-store-pubsub

Test
----

Run the tests with:

    $ npm test

License
-------

This software is distributed under MIT license.
