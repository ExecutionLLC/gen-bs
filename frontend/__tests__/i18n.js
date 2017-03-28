import * as i18n from '../app/utils/i18n';

// Remove to get bunch of test logs
//console.log = jest.genMockFunction();

describe('i18n', () => {
    describe('should set/get entity texts', () => {
        const INITIAL_ENTITY = {q: 1, w: 2};
        const ABSENT_LANGUAGE = 'nolanguage';
        const INITIAL_TEXTS = [
            {languageId: 'lang1', text1: 'text1_lang1', text2: 'text2_lang1'},
            {languageId: 'lang2', text1: 'text1_lang2', text2: 'text2_lang2'}
        ];
        const DEFAULT_LANGUAGE_TEXT = {languageId: i18n.DEFAULT_LANGUAGE_ID, text1: 'text1_langDefault', text2: 'text2_langDefault'};
        const INITIAL_TEXTS_WITH_DEFAULT = INITIAL_TEXTS.concat([DEFAULT_LANGUAGE_TEXT]);
        const USER_TEXT = {languageId: null, text1: 'text1_user', text2: 'text2_user'};
        const INITIAL_TEXTS_WITH_USERDATA = INITIAL_TEXTS.concat([USER_TEXT]);
        const INITIAL_TEXTS_WITH_DEFAULT_AND_USERDATA = INITIAL_TEXTS.concat([DEFAULT_LANGUAGE_TEXT, USER_TEXT]);

        it('should be correct test data', () => {
            // there must be no default and absent languages
            expect(INITIAL_TEXTS[i18n.DEFAULT_LANGUAGE_ID]).toBe(undefined);
            expect(INITIAL_TEXTS[ABSENT_LANGUAGE]).toBe(undefined);
            // there must be at least 2 languages
            expect(INITIAL_TEXTS.length >= 2).toBe(true);
            // there must not be initial texts
            expect(i18n.getEntityLanguageTexts(INITIAL_ENTITY)).not.toEqual(INITIAL_TEXTS);
        });

        it('should contain texts after set', () => {
            const newEntity = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS);
            // initial entity must be intact
            expect(i18n.getEntityLanguageTexts(INITIAL_ENTITY)).not.toEqual(INITIAL_TEXTS);
            // new entity must be with texts
            expect(i18n.getEntityLanguageTexts(newEntity)).toEqual(INITIAL_TEXTS);
        });

        it('should get entity text', () => {
            const entity = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS);
            const entityDefault = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS_WITH_DEFAULT);
            const entityUserdata = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS_WITH_USERDATA);
            const entityDefaultUserdata = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS_WITH_DEFAULT_AND_USERDATA);

            // no deafults, no userdata - get exact texts or undefined
            expect(i18n.getEntityText(entity, INITIAL_TEXTS[0].languageId)).toEqual(INITIAL_TEXTS[0]);
            expect(i18n.getEntityText(entity, INITIAL_TEXTS[1].languageId)).toEqual(INITIAL_TEXTS[1]);
            expect(i18n.getEntityText(entity, ABSENT_LANGUAGE)).toBe(undefined);

            // userdata - always return it
            expect(i18n.getEntityText(entityUserdata, INITIAL_TEXTS[0].languageId)).toEqual(USER_TEXT);
            expect(i18n.getEntityText(entityUserdata, i18n.DEFAULT_LANGUAGE_ID)).toEqual(USER_TEXT);
            expect(i18n.getEntityText(entityUserdata, ABSENT_LANGUAGE)).toEqual(USER_TEXT);

            // userdata even with defaults - return userdata
            expect(i18n.getEntityText(entityDefaultUserdata, INITIAL_TEXTS[0].languageId)).toEqual(USER_TEXT);
            expect(i18n.getEntityText(entityDefaultUserdata, i18n.DEFAULT_LANGUAGE_ID)).toEqual(USER_TEXT);
            expect(i18n.getEntityText(entityDefaultUserdata, ABSENT_LANGUAGE)).toEqual(USER_TEXT);

            // dafaults - return it if no found
            expect(i18n.getEntityText(entityDefault, INITIAL_TEXTS[0].languageId)).toEqual(INITIAL_TEXTS[0]);
            expect(i18n.getEntityText(entityDefault, i18n.DEFAULT_LANGUAGE_ID)).toEqual(DEFAULT_LANGUAGE_TEXT);
            expect(i18n.getEntityText(entityDefault, ABSENT_LANGUAGE)).toEqual(DEFAULT_LANGUAGE_TEXT);
        });

        it('should set user text', () => {
            const NEW_USER_TEXTS = {text1: 'newtext1', text2: 'newtext2'};
            const entity = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS);
            const newEntity = i18n.setEntityText(entity, NEW_USER_TEXTS);
            // initial entity must be intact
            expect(i18n.getEntityText(entity, INITIAL_TEXTS[0].languageId)).toEqual(INITIAL_TEXTS[0]);
            expect(i18n.getEntityText(entity, i18n.DEFAULT_LANGUAGE_ID)).toBe(undefined);
            expect(i18n.getEntityText(entity, ABSENT_LANGUAGE)).toBe(undefined);
            // new entity must contain user texts with language identifier
            const newUserTextsWLanguageId = {...NEW_USER_TEXTS, languageId: null};
            expect(i18n.getEntityText(newEntity, INITIAL_TEXTS[0].languageId)).toEqual(newUserTextsWLanguageId);
            expect(i18n.getEntityText(newEntity, i18n.DEFAULT_LANGUAGE_ID)).toEqual(newUserTextsWLanguageId);
            expect(i18n.getEntityText(newEntity, ABSENT_LANGUAGE)).toEqual(newUserTextsWLanguageId);
            // check if user texts can be rewrited, notice the 'text1' absense
            const NEW_NEW_USER_TEXTS = {text2: 'newnewtext2', text3: 'newnewtext3'};
            const newNewEntity = i18n.setEntityText(newEntity, NEW_NEW_USER_TEXTS);
            // new entity must contain user texts with language identifier
            const newNewUserTextsWLanguageId = {...NEW_NEW_USER_TEXTS, languageId: null};
            expect(i18n.getEntityText(newNewEntity, INITIAL_TEXTS[0].languageId)).toEqual(newNewUserTextsWLanguageId);
            expect(i18n.getEntityText(newNewEntity, i18n.DEFAULT_LANGUAGE_ID)).toEqual(newNewUserTextsWLanguageId);
            expect(i18n.getEntityText(newNewEntity, ABSENT_LANGUAGE)).toEqual(newNewUserTextsWLanguageId);
        });

        it('should change user text', () => {

            // we must check with defaults language and without and with userdata
            // each check with present and absent language

            {
                const entity = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS);

                {
                    // check with no default language, got with existing language
                    const newEntityWithLanguage = i18n.changeEntityText(entity, INITIAL_TEXTS[0].languageId, {text1: 'newText1'});
                    // initial entity must be intact
                    expect(i18n.getEntityLanguageTexts(entity)).toEqual(INITIAL_TEXTS);
                    // any language will return user data with language identifier
                    const userTextWithLanguageId = {...INITIAL_TEXTS[0], text1: 'newText1', languageId: null};
                    expect(i18n.getEntityText(newEntityWithLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextWithLanguageId);
                    expect(i18n.getEntityText(newEntityWithLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextWithLanguageId);
                    expect(i18n.getEntityText(newEntityWithLanguage, ABSENT_LANGUAGE)).toEqual(userTextWithLanguageId);
                }

                {
                    // check with no default language, got with absent language
                    const newEntityWithoutLanguage = i18n.changeEntityText(entity, ABSENT_LANGUAGE, {text2: 'newText2'});
                    // when set without language then return only setted text
                    const userTextWithLanguageIdNoLanguage = {text2: 'newText2', languageId: null};
                    expect(i18n.getEntityText(newEntityWithoutLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityWithoutLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityWithoutLanguage, ABSENT_LANGUAGE)).toEqual(userTextWithLanguageIdNoLanguage);
                }
            }

            {
                const entityDefaults = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS_WITH_DEFAULT);

                {
                    // check with default language, got with existing language
                    const newEntityDefaultsWithLanguage = i18n.changeEntityText(entityDefaults, INITIAL_TEXTS[0].languageId, {text1: 'newDefText1'});
                    // any language will return user data with language identifier
                    const userTextDefWithLanguageId = {...INITIAL_TEXTS[0], text1: 'newDefText1', languageId: null};
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextDefWithLanguageId);
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextDefWithLanguageId);
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, ABSENT_LANGUAGE)).toEqual(userTextDefWithLanguageId);
                }

                {
                    // check with default language, got with absent language
                    const newEntityDefaultsWithoutLanguage = i18n.changeEntityText(entityDefaults, ABSENT_LANGUAGE, {text2: 'newDefText2'});
                    // when set without language but with default then return with default text
                    const userTextDefWithLanguageIdNoLanguage = {...DEFAULT_LANGUAGE_TEXT, text2: 'newDefText2', languageId: null};
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextDefWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextDefWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, ABSENT_LANGUAGE)).toEqual(userTextDefWithLanguageIdNoLanguage);
                }
            }

            {
                const entityUserdata = i18n.setEntityLanguageTexts(INITIAL_ENTITY, INITIAL_TEXTS_WITH_USERDATA);

                {
                    // check with user data, got with existing language
                    const newEntityDefaultsWithLanguage = i18n.changeEntityText(entityUserdata, INITIAL_TEXTS[0].languageId, {text1: 'newUserText1'});
                    // any language will return user data with language identifier
                    const userTextDefWithLanguageId = {...USER_TEXT, text1: 'newUserText1', languageId: null};
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextDefWithLanguageId);
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextDefWithLanguageId);
                    expect(i18n.getEntityText(newEntityDefaultsWithLanguage, ABSENT_LANGUAGE)).toEqual(userTextDefWithLanguageId);
                }

                {
                    // check with user data, got with absent language
                    const newEntityDefaultsWithoutLanguage = i18n.changeEntityText(entityUserdata, ABSENT_LANGUAGE, {text2: 'newUserText2'});
                    // any language will return user data with language identifier
                    const userTextDefWithLanguageIdNoLanguage = {...USER_TEXT, text2: 'newUserText2', languageId: null};
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, INITIAL_TEXTS[0].languageId)).toEqual(userTextDefWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, INITIAL_TEXTS[1].languageId)).toEqual(userTextDefWithLanguageIdNoLanguage);
                    expect(i18n.getEntityText(newEntityDefaultsWithoutLanguage, ABSENT_LANGUAGE)).toEqual(userTextDefWithLanguageIdNoLanguage);
                }
            }

        });
    })
});
