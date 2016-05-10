'use strict';

const assert = require('assert');
const _ = require('lodash');

class CollectionUtils {
    static checkCollectionIsValid(collection, expectedCollection, isDemoUser, checkType) {
        assert.ok(!_.isEmpty(collection));
        if (expectedCollection) {
            assert.equal(collection.length, expectedCollection.length);
        }
        _.each(collection, item => {
            if (expectedCollection) {
                assert.ok(_.any(expectedCollection, expectedItem => expectedItem.id === item.id),
                    'Item with id ' + item.id + ' is not found in the expected collection.');
            }
            if (checkType) {
                const itemTypes = isDemoUser ? ['standard', 'advanced'] : ['standard', 'advanced', 'user'];
                assert.ok(_.includes(itemTypes, item.type),
                    'Unexpected item type found: ' + item.type + ', expected: ' + JSON.stringify(itemTypes));
            }
        });
    }
}

module.exports = CollectionUtils;
