import {assign} from './immutable';

export default class immutableArray {
    /**
     * @template {T}
     * @param {T[]} arr
     * @param {number} index
     * @param {T} item
     * @returns {T[]}
     */
    static replace(arr, index, item) {
        if (index < 0 || index >= arr.length) {
            throw `immutableArray.replace wrong index = ${index}, arr.length = ${arr.length}`;
        }
        return [
            ...arr.slice(0, index),
            item,
            ...arr.slice(index + 1, arr.length)
        ];
    }

    static assign(array, index, itemOrPart) {
        const originalItem = array[index];
        const resultItem = assign(originalItem, itemOrPart);
        return immutableArray.replace(array, index, resultItem);
    }

    /**
     * @template {T}
     * @param {T[]} arr
     * @param {number} index
     * @returns {T[]}
     */
    static remove(arr, index) {
        if (index < 0 || index >= arr.length) {
            return arr;
        }
        return [
            ...arr.slice(0, index),
            ...arr.slice(index + 1, arr.length)
        ];
    }

    /**
     * @template {T}
     * @param {T[]} arr
     * @param {T} data
     * @returns {T[]}
     */
    static append(arr, data) {
        return [
            ...arr,
            data
        ];
    }

    /**
     * @template {T}
     * @param {T[]} arr
     * @param {T[]} arr2
     * @returns {T[]}
     */
    static concat(arr, arr2) {
        return [
            ...arr,
            ...arr2
        ];
    }

    /**
     * @template {T}
     * @param {T[]} arr
     * @param {number} index
     * @param {T} item
     * @returns {T[]}
     */
    static insertBefore(arr, index, item) {
        if (index < 0 || index > arr.length) {
            throw `immutableArray.insertBefore wrong index = ${index}, arr.length = ${arr.length}`;
        }
        return [
            ...arr.slice(0, index),
            item,
            ...arr.slice(index, arr.length)
        ];
    }
}
