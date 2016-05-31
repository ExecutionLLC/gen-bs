import _ from 'lodash';
import immutableArray from './immutableArray';

export class ImmutableHashedArray {
    static makeFromArray(array) {
        return {
            array: array || [],
            hash: _.keyBy(array, 'id')
        };
    }

    static _findIndexForId(array, id) {
        return _.findIndex(array, {id: id});
    }

    static deleteItemId({array, hash}, id) {
        const itemIndex = this._findIndexForId(array, id);
        if (itemIndex < 0) {
            return null;
        } else {
            return {
                array: immutableArray.remove(array, itemIndex),
                hash: _.omit(hash, id)
            };
        }
    }

    static replaceItemId({array, hash}, id, newItem) {
        const itemIndex = this._findIndexForId(array, id);
        if (itemIndex < 0) {
            return null;
        } else {
            return {
                array: immutableArray.replace(array, itemIndex, newItem),
                hash: {..._.omit(hash, id), [newItem.id]: newItem}
            };
        }
    }

    static appendItem({array, hash}, newItem) {
        return {
            array: immutableArray.append(array, newItem),
            hash: {...hash, [newItem.id]: newItem}
        };
    }
}

