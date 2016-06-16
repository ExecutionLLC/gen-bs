export function expectItemByPredicate(collection, predicate) {
    return expect(_.find(collection, predicate));
}

export function expectCountByPredicate(collection, predicate) {
    return expect((_.filter(collection, predicate) || []).length);
}