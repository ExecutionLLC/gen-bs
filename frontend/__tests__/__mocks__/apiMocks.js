import HttpStatus from 'http-status';

function mockResponse(body, status = HttpStatus.OK) {
    return {
        body,
        status
    }
}

class apiMocks {
    static TestIds = {
        historyViewId: 'historyViewId',
        historyFilterId: 'historyFilterId',
        historySampleId: 'historySampleId',

        historyEntryId: 'historyEntryId',
        nonHistoryEntryId: 'nonHistoryEntryId', // history entry which contains non-history items.

        updatedItemId: 'updatedItemId',
        createdItemId: 'createdItemId'
    };

    static createGetFieldsMock(expectedSessionId, expectedSampleId, resultFields) {
        return jest.fn((sessionId, sampleId, callback) => {
            expect(sessionId).toBe(expectedSessionId);
            expect(sampleId).toBe(expectedSampleId);
            callback(null, mockResponse(resultFields));
        });
    }
    
    static createGetAllFieldsMock(expectedSessionId, resultFields) {
        return jest.fn((sessionId, callback) => {
            expect(sessionId).toBe(expectedSessionId);
            callback(null, mockResponse(resultFields));
        });
    }

    static createAddMock() {
        return jest.fn((sessionId, languageId, item, callback) => {
            expect(item).toBeTruthy();
            expect(sessionId).toBeTruthy();
            expect(languageId).toBeTruthy();
            expect(callback).toBeTruthy();
            const createdItem = Object.assign({}, item, {id: this.TestIds.createdItemId});
            callback(null, mockResponse(createdItem));
        });
    }

    static createUpdateMock(expectedItemId) {
        return jest.fn((sessionId, item, callback) => {
            expect(item).toBeTruthy();
            expect(item.id).toBe(expectedItemId);
            expect(sessionId).toBeTruthy();
            expect(callback).toBeTruthy();
            const updatedItem = Object.assign({}, item, {id: this.TestIds.updatedItemId});
            callback(null, mockResponse(updatedItem));
        });
    }

    static createDeleteMock(expectedItemId, itemsHash) {
        return jest.fn((sessionId, itemId, callback) => {
            const item = itemsHash[itemId];
            expect(item).toBeTruthy();
            expect(item.id).toBe(expectedItemId);
            expect(sessionId).toBeTruthy();
            expect(callback).toBeTruthy();
            callback(null, mockResponse(item));
        });
    }

    static createGetMock(expectedItemId, item) {
        return jest.fn((itemId, callback) => {
            expect(itemId).toBe(expectedItemId);
            expect(callback).toBeTruthy();
            callback(null, mockResponse(item));
        });
    }

    static createSendSearchRequestMock(expectedSessionId, expectedLanguageId, expectedSampleId, 
                                     expectedViewId, expectedFilterId, resultOperationId) {
        return jest.fn((sessionId, languageId, sampleId, viewId, filterId, limit, offset, callback) => {
            expect(sessionId).toBe(expectedSessionId);
            expect(languageId).toBe(expectedLanguageId);
            expect(sampleId).toBe(expectedSampleId);
            expect(viewId).toBe(expectedViewId);
            expect(filterId).toBe(expectedFilterId);
            expect(limit).toBe(100);
            expect(offset).toBe(0);
            callback(null, {operationId: resultOperationId});
        });
    }

    static createSendSearchRequestSimpleMock(resultOperationId) {
        return jest.fn((sessionId, languageId, sampleId, viewId, filterId, limit, offset, callback) => {
            callback(null, {operationId: resultOperationId});
        });
    }
}

export default apiMocks;
