'use strict';

require('../support/test-helper.js');

var RedisPool = require('redis-mpool');
var assert = require('assert');
var step = require('step');
var serverOptions = require('../support/server-options');
var MapStore = require('../../lib/windshaft/storages/mapstore');
var MapConfig = require('../../lib/windshaft/models/mapconfig');

var debug = require('debug')('windshaft:test');

describe('mapstore', function () {
    var redisPool = new RedisPool(serverOptions.redis);

    it('fails loading unexistent map', function (done) {
        var mapStore = new MapStore({ pool: redisPool, expire_time: 50000 });
        mapStore.load('unexistent', function (err) {
            assert.ok(err);
            assert.equal(err.message, "Invalid or nonexistent map configuration token 'unexistent'");
            done();
        });
    });

    it('can save a map and tell if it existed already', function (done) {
        var mapStore = new MapStore({ pool: redisPool, expire_time: 50000 });
        var map = MapConfig.create({
            version: '1.0.1',
            layers: [
                {
                    options: {
                        sql: 'select the_geom from test_table limit 1',
                        cartocss: '#layer { marker-fill:red }',
                        cartocss_version: '2.0.1'
                    }
                }
            ]
        });
        var mapID;
        step(
            function saveMap () {
                mapStore.save(map, this);
            },
            function checkSavedReSave (err, id, known) {
                assert.ifError(err);
                mapID = id;
                assert.ok(!known);
                mapStore.save(map, this);
            },
            function checkReSaved (err, id, known) {
                assert.ifError(err);
                assert.ok(known);
                return null;
            },
            function delMap (err) {
                var next = this;
                mapStore.del(mapID, function (e) {
                    if (e) {
                        debug('Could not delete map ' + mapID + ': ' + e);
                    }
                    next(err);
                });
            },
            function finish (err) {
                done(err);
            }
        );
    });
});