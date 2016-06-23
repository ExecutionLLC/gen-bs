import _ from 'lodash';
import immutableArray from './immutableArray';

export class ImmutableHashedArray {
    static makeFromArray(array) {
        const hash = _.keyBy(array, 'id');
        if (Object.keys(hash).length !== array.length) {
            throw new Error('Duplicate ids');
        }
        if (_.some(array, (item) => item.id == null)) {
            throw new Error('Missing id');
        }
        return {
            array,
            hash
        };
    }

    static _findIndexForId(array, id) {
        return _.findIndex(array, {id: id});
    }

    static deleteItemId(hashedArray, id) {
        const {array, hash} = hashedArray;
        const itemIndex = this._findIndexForId(array, id);
        if (itemIndex < 0) {
            return hashedArray;
        } else {
            return {
                array: immutableArray.remove(array, itemIndex),
                hash: _.omit(hash, id)
            };
        }
    }

    static replaceItemId({array, hash}, id, newItem) {
        if (newItem.id == null) {
            throw new Error('Missing id');
        }
        if (hash[newItem.id] && newItem.id !== id) {
            throw new Error(`Duplicate id ${newItem.id}`);
        }
        const itemIndex = this._findIndexForId(array, id);
        if (itemIndex < 0) {
            throw new Error(`Absent id ${id}`);
        }
        return {
            array: immutableArray.replace(array, itemIndex, newItem),
            hash: {..._.omit(hash, id), [newItem.id]: newItem}
        };
    }

    static appendItem({array, hash}, newItem) {
        if (newItem.id == null) {
            throw new Error('Missing id');
        }
        if (hash[newItem.id]) {
            throw new Error(`Duplicate id ${newItem.id}`);
        }
        return {
            array: immutableArray.append(array, newItem),
            hash: {...hash, [newItem.id]: newItem}
        };
    }
}

