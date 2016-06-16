import immutableArray from '../app/utils/immutableArray';
import {ImmutableHashedArray} from '../app/utils/immutable';

describe('Immutable array', () => {
    it('should replace item', () => {
        expect(() => immutableArray.replace(null, 3, 123)).toThrow();
        // unexpected behavior when index out of range
        expect(immutableArray.replace([], 3, 123)).toEqual([123]);
        // unexpected behavior when index is negative
        expect(immutableArray.replace([11, 22, 33], -1, 123)).toEqual([11, 22, 123, 11, 22, 33]);
        expect(immutableArray.replace([11, 22, 33], 0, 123)).toEqual([123, 22, 33]);
        expect(immutableArray.replace([11, 22, 33], 1, 123)).toEqual([11, 123, 33]);
        expect(immutableArray.replace([11, 22, 33], 2, 123)).toEqual([11, 22, 123]);
        expect(immutableArray.replace([11, 22, 33], 4, 123)).toEqual([11, 22, 33, 123]);
    });
    it('should remove item', () => {
        expect(immutableArray.remove([], 3)).toEqual([]);
        // unexpected behavior when index is negative
        expect(immutableArray.remove([11, 22, 33], -1)).toEqual([11, 22, 11, 22, 33]);
        expect(immutableArray.remove([11, 22, 33], 0)).toEqual([22, 33]);
        expect(immutableArray.remove([11, 22, 33], 1)).toEqual([11, 33]);
        expect(immutableArray.remove([11, 22, 33], 2)).toEqual([11, 22]);
        expect(immutableArray.remove([11, 22, 33], 4)).toEqual([11, 22, 33]);
    });
    it('should append item', () => {
        expect(immutableArray.append([], 123)).toEqual([123]);
        expect(immutableArray.append([11], 123)).toEqual([11, 123]);
        expect(immutableArray.append([11, 22, 33], 123)).toEqual([11, 22, 33, 123]);
    });
});

describe('Immutable hashed array', () => {

    const item11 = {id: 11, content: 111};
    const item22 = {id: 22, message: 222};
    const item33 = {id: 33, obj: {value: [11, 22], data: {q: 44, w: 55}}};
    const item55 = {id: 55, value: 555};
    const itemNoId = {some: 123, data: 456, here: 789};

    it('should make from array', () => {
        expect(ImmutableHashedArray.makeFromArray(
            null
        )).toEqual({
            array: [],
            hash: {}
        });
        expect(ImmutableHashedArray.makeFromArray(
            []
        )).toEqual({
            array: [],
            hash: {}
        });
        expect(ImmutableHashedArray.makeFromArray([
            item11, item22, item33
        ])).toEqual({
            array: [item11, item22, item33],
            hash: {'11': item11, '22': item22, '33': item33}
        });
        // unexpected behavior when has object with no id
        expect(ImmutableHashedArray.makeFromArray([
            item11, item22, item33, itemNoId
        ])).toEqual({
            array: [item11, item22, item33, itemNoId],
            hash: {'11': item11, '22': item22, '33': item33, 'undefined': itemNoId}
        });
    });
});