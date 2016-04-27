jest.unmock('../app/utils/ChangeCaseUtil');

import ChangeCaseUtil from '../app/utils/ChangeCaseUtil';

describe(
    'ChangeCaseUtil',
    () => {
        it(
            'checks if alphanumeric or dash',
            () => {
                expect(ChangeCaseUtil._isAlphanumericOrDash('q')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('a')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('z')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('A')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('Z')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('_')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('-')).toBe(false);
                expect(ChangeCaseUtil._isAlphanumericOrDash('0')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('5')).toBe(true);
                expect(ChangeCaseUtil._isAlphanumericOrDash('9')).toBe(true);
            }
        );
    }
);