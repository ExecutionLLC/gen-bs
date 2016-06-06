export default class immutableArray {
    /**
     * @template {T}
     * @param {T[]} arr
     * @param {number} index
     * @param {T} item
     * @returns {*}
     */
    static replace(arr, index, item) {
        return [
            ...arr.slice(0, index),
            item,
            ...arr.slice(index + 1, arr.length)
        ];
    }

    /**
     * @template {T}
     * @param {T[]} arr
     * @param {number} index
     * @returns {T[]}
     */
    static remove(arr, index) {
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
}