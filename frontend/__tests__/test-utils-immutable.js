import immutableArray from '../app/utils/immutableArray';
import {ImmutableHashedArray, assign, immutableSetPathProperty, immutableGetPathProperty} from '../app/utils/immutable';

describe('Immutable array', () => {
    it('should replace item', () => {
        expect(() => immutableArray.replace(null, 3, 123)).toThrow();
        expect(() => immutableArray.replace([], 3, 123)).toThrow();
        expect(() => immutableArray.replace([11, 22, 33], -1, 123)).toThrow();
        expect(immutableArray.replace([11, 22, 33], 0, 123)).toEqual([123, 22, 33]);
        expect(immutableArray.replace([11, 22, 33], 1, 123)).toEqual([11, 123, 33]);
        expect(immutableArray.replace([11, 22, 33], 2, 123)).toEqual([11, 22, 123]);
        expect(() => immutableArray.replace([11, 22, 33], 4, 123)).toThrow();
    });
    it('should assign item', () => {
        expect(() => immutableArray.assign(null, 1, 2)).toThrow();
        expect(() => immutableArray.assign([], 1, 2));
        expect(() => immutableArray.assign([11, 22, 33, 44], -1, 2)).toThrow();
        expect(immutableArray.assign(
            [11, 22, {q: 1, w: 2}, 44], 2, {w: 3, e: 4}))
            .toEqual([11, 22, {q: 1, w: 3, e: 4}, 44]);
    });
    it('should remove item', () => {
        expect(() => immutableArray.remove(null, 3)).toThrow();
        const emptyArray = [];
        const dataArray = [11, 22, 33];
        expect(immutableArray.remove(emptyArray, 3)).toBe(emptyArray);
        expect(immutableArray.remove(dataArray, -1)).toBe(dataArray);
        expect(immutableArray.remove(dataArray, 0)).toEqual([22, 33]);
        expect(immutableArray.remove(dataArray, 1)).toEqual([11, 33]);
        expect(immutableArray.remove(dataArray, 2)).toEqual([11, 22]);
        expect(immutableArray.remove(dataArray, 4)).toBe(dataArray);
    });
    it('should append item', () => {
        expect(() => immutableArray.append(null, 123)).toThrow();
        expect(immutableArray.append([], 123)).toEqual([123]);
        expect(immutableArray.append([11], 123)).toEqual([11, 123]);
        expect(immutableArray.append([11, 22, 33], 123)).toEqual([11, 22, 33, 123]);
    });
    it('should concat', () => {
        expect(() => immutableArray.concat(null, null)).toThrow();
        expect(() => immutableArray.concat([], null)).toThrow();
        expect(() => immutableArray.concat(null, [])).toThrow();
        expect(immutableArray.concat([], [])).toEqual([]);
        expect(immutableArray.concat([1, 2, 3], [])).toEqual([1, 2, 3]);
        expect(immutableArray.concat([], [4, 5])).toEqual([4, 5]);
        expect(immutableArray.concat([6, 7], [8, 9, 0])).toEqual([6, 7, 8, 9, 0]);
    })
});

describe('immutable utils', () => {
    it('should assign', () => {
        expect(assign(null, null)).toEqual({});
        expect(assign(null, {q: 1})).toEqual({q: 1});
        expect(assign({w: 2}, null)).toEqual({w: 2});
        expect(assign({e: 3, r: 4}, {r: 5, t: 6})).toEqual({e: 3, r: 5, t: 6});
    });
    it('should get path property', () => {
        expect(() => immutableGetPathProperty(null, '')).toThrow();
        expect(() => immutableGetPathProperty({q: {w: 1}}, 'a.s')).toThrow();
        expect(() => immutableGetPathProperty({q: {w: 1}}, null)).toThrow();
        expect(immutableGetPathProperty({q: {w: 1}}, 'a')).toBe(undefined);
        expect(immutableGetPathProperty({q: {w: 1}}, 'q')).toEqual({w: 1});
        expect(immutableGetPathProperty({q: {w: 1}}, 'q.w')).toBe(1);
        expect(immutableGetPathProperty({q: {w: 1}}, 'q.e')).toBe(undefined);
        expect(immutableGetPathProperty([11, {w: 111}, 22], '1.w')).toBe(111);
        expect(immutableGetPathProperty({q: [11, 22, 33]}, 'q.2')).toBe(33);
    });
    it('should set path property', () => {
        expect(immutableSetPathProperty(null, '', 1)).toBe(1);
        expect(() => immutableSetPathProperty(null, 'a', 1)).toThrow();
        expect(() => immutableSetPathProperty({q: {w: 1}}, 'a.s', 1)).toThrow();
        expect(() => immutableSetPathProperty({q: {w: 1}}, null, 1)).toThrow();
        expect(immutableSetPathProperty({q: 1}, 'q', 2)).toEqual({q: 2});
        expect(immutableSetPathProperty({q: 1}, 'e', 2)).toEqual({q: 1, e: 2});
        expect(immutableSetPathProperty([11, 22, 33], '1', 222)).toEqual([11, 222, 33]);
        expect(() => immutableSetPathProperty([11, 22, 33], '5', 222)).toThrow();
        expect(immutableSetPathProperty({q: [11, 22, 33]}, 'q.0', 111)).toEqual({q: [111, 22, 33]});
        expect(() => immutableSetPathProperty({q: [11, 22, 33]}, 'w.0', 111)).toThrow();
        expect(immutableSetPathProperty({q: [11, 22, 33]}, 'q.0.1', 111)).toEqual({q: [{'1': 111}, 22, 33]});
    })
});

describe('Immutable hashed array', () => {

    const item11 = {id: 11, content: 111};
    const item22 = {id: 22, message: 222};
    const item22_2 = {id: 22, message: 222222};
    const item33 = {id: 33, obj: {value: [11, 22], data: {q: 44, w: 55}}};
    const item55 = {id: 55, value: 555};
    const itemNoId = {some: 123, data: 456, here: 789};

    it('should make from array', () => {
        expect(() => ImmutableHashedArray.makeFromArray(
            null
        )).toThrow();
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
        expect(() => ImmutableHashedArray.makeFromArray([
            item11, item22, item11, item33
        ])).toThrow();
        expect(() => ImmutableHashedArray.makeFromArray([
            item11, item22, item33, itemNoId
        ])).toThrow();
    });

    it('should delete item', () => {
        const hashedArray = ImmutableHashedArray.makeFromArray([
            item11, item22, item33
        ]);
        expect(ImmutableHashedArray.deleteItemId(hashedArray, 123)).toBe(hashedArray);
        expect(ImmutableHashedArray.deleteItemId(hashedArray, 11)).toEqual({
            array: [item22, item33],
            hash: {'22': item22, '33': item33}
        });
        expect(ImmutableHashedArray.deleteItemId(hashedArray, 22)).toEqual({
            array: [item11, item33],
            hash: {'11': item11, '33': item33}
        });
        expect(ImmutableHashedArray.deleteItemId(hashedArray, 33)).toEqual({
            array: [item11, item22],
            hash: {'11': item11, '22': item22}
        });
    });

    it('should replace item', () => {
        const hashedArray = ImmutableHashedArray.makeFromArray([
            item11, item22, item33
        ]);
        const item55 = {id: 55, value: 555};
        expect(() => ImmutableHashedArray.replaceItemId(hashedArray, 123, item55)).toThrow();
        expect(ImmutableHashedArray.replaceItemId(hashedArray, 11, item55)).toEqual({
            array: [item55, item22, item33],
            hash: {'22': item22, '33': item33, 55: item55}
        });
        expect(ImmutableHashedArray.replaceItemId(hashedArray, 22, item55)).toEqual({
            array: [item11, item55, item33],
            hash: {'11': item11, '33': item33, 55: item55}
        });
        expect(ImmutableHashedArray.replaceItemId(hashedArray, 33, item55)).toEqual({
            array: [item11, item22, item55],
            hash: {'11': item11, '22': item22, 55: item55}
        });
        expect(() => ImmutableHashedArray.replaceItemId(hashedArray, 123, item55)).toThrow();
        expect(() => ImmutableHashedArray.replaceItemId(hashedArray, 123, itemNoId)).toThrow();
        expect(() => ImmutableHashedArray.replaceItemId(hashedArray, 22, itemNoId)).toThrow();
        expect(() => ImmutableHashedArray.replaceItemId(hashedArray, 22, item33)).toThrow();
        expect(ImmutableHashedArray.replaceItemId(hashedArray, 22, item22_2)).toEqual({
            array: [item11, item22_2, item33],
            hash: {'11': item11, '22': item22_2, '33': item33}
        });
    });

    it('should append item', () => {
        const hashedArrayFilled = ImmutableHashedArray.makeFromArray([
            item11, item22, item33
        ]);
        const hashedArrayEmpty = ImmutableHashedArray.makeFromArray([]);
        expect(ImmutableHashedArray.appendItem(hashedArrayFilled, item55)).toEqual({
            array: [item11, item22, item33, item55],
            hash: {'11': item11, '22': item22, '33': item33, 55: item55}
        });
        expect(ImmutableHashedArray.appendItem(hashedArrayEmpty, item55)).toEqual({
            array: [item55],
            hash: {55: item55}
        });
        expect(() => ImmutableHashedArray.appendItem(hashedArrayFilled, itemNoId)).toThrow();
        expect(() => ImmutableHashedArray.appendItem(hashedArrayEmpty, itemNoId)).toThrow();
        expect(() => ImmutableHashedArray.appendItem(hashedArrayFilled, item22)).toThrow();
    });
});