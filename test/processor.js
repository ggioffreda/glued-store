const assert = require('assert'),
    sinon = require('sinon'),
    dl = require('glued-data-layer'),
    dataLayer = new dl.DataLayer(),
    m = require('../src/model'),
    p = require('../src/processor'),
    testDatabase = 'test',
    testTable = 'test_table';

var mockMBChannel = null,
    model = null,
    processor = null,
    missingDependencies = false;

describe('StoreProcessor', function () {

    beforeEach(function (done) {
        dataLayer.connectModule(function (err, dataLayer) {
            if (err) {
                missingDependencies = true;
                done();
                return;
            }

            mockMBChannel = sinon.stub({ publish: function () { }, subscribe: function () { } });
            model = new m.StoreModel(dataLayer);
            processor = new p.StoreProcessor(model, mockMBChannel);
            processor.subscribeHandlers();

            done();
        });
    });

    describe('#subscribeHandlers()', function () {
        var args;

        beforeEach(function () {
            args = mockMBChannel.subscribe.args.reduce(function (carry, item) {
                carry.keys.push(item[0]);
                carry.queues.push(item[2]);
                return carry;
            }, { keys: [], queues: [] });
        });

        it('should subscribe to the type creation requests topic', function () {
            assert(args.keys.indexOf('*.*.*.create.store') > -1);
            assert(args.queues.indexOf('store_put_type') > -1);
        });

        it('should subscribe to the object post requests topic', function () {
            assert(args.keys.indexOf('*.*.*.post.store') > -1);
            assert(args.queues.indexOf('store_post') > -1);
        });

        it('should subscribe to the object put requests topic', function () {
            assert(args.keys.indexOf('*.*.*.*.put.store') > -1);
            assert(args.queues.indexOf('store_put') > -1);
        });

        it('should subscribe to the object patch requests topic', function () {
            assert(args.keys.indexOf('*.*.*.*.patch.store') > -1);
            assert(args.queues.indexOf('store_patch') > -1);
        });

        it('should subscribe to the type creation requests topic', function () {
            assert(args.keys.indexOf('*.*.*.*.delete.store') > -1);
            assert(args.queues.indexOf('store_delete') > -1);
        });
    });

    describe('#putTypeHandler()', function () {
        var publishSpy;

        function initialiseSpy(done) {
            publishSpy = sinon.spy(function () {
                assert(publishSpy.calledOnce);
                assert(publishSpy.calledWith(
                    [ 'store', testDatabase, testTable, 'type', 'created' ].join('.'),
                    new Buffer(JSON.stringify({ domain: testDatabase, type: testTable }))
                ));
                done();
            });
            if (missingDependencies) return this.skip();

            mockMBChannel = { publish: publishSpy };
            model = new m.StoreModel(dataLayer);
            processor = new p.StoreProcessor(model, mockMBChannel);
        }

        it('should create a new type, and send a message to the exchange', function (done) {
            if (missingDependencies) return this.skip();

            initialiseSpy(done);

            dataLayer.tableDelete(testDatabase, testTable, function () {
                processor.putTypeHandler(['test', testDatabase, testTable, 'create', 'store'], {}, function () {
                    // do nothing
                });
            });
        });
    });

    after(function (done) {
        if (missingDependencies) {
            this.skip();
            return done();
        }

        dataLayer.tableDelete(testDatabase, testTable, function () {
            done();
        });
    });

});
