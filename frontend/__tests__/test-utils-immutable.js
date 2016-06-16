import immutableArray from '../app/utils/immutableArray';
import {ImmutableHashedArray} from '../app/utils/immutable';

describe('Immutable array', () => {
    it('should replace item', () => {
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
