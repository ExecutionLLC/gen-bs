export function expectItemByPredicate(collection, predicate) {
    return expect(_.find(collection, predicate));
}

export function expectCountByPredicate(collection, predicate) {
    return expect((_.filter(collection, predicate) || []).length);
}

export function installMockFunc(obj, funcName, mockFunc) {
    function mock(...args) {
        mockFunc(...args);
    }
    mock.__mockedFunction = obj[funcName];
    obj[funcName] = mock;
}

export function uninstallMock(obj, funcName) {
    const func = obj[funcName];
    const originalFunc = func.__mockedFunction;
    if (originalFunc) {
        obj[funcName] = originalFunc; 
    }
}
