import _ from 'lodash';

/*
All translatable entities must have 'text' property, for example:
filter: {
    ...<some filter's properties>,
    text: [
        {languageId: 'en', name: 'Filter name in en', description: 'Filter description in en'},
        {languageId: 'ru', name: 'Filter name in en', description: 'Filter description in ru'},
        {languageId: null, text: 'User defined filter name', description: 'User defined filter description'}
    ]
}
 */

const DEFAULT_LANGUAGE_ID = 'en';

function getEntityTextTranslation(entityTexts, languageId) {
    return _.find(entityTexts, {languageId});
}

export function getEntityLanguageTexts(entity) {
    return entity.text;
}

export function setEntityLanguageTexts(entity, texts) {
    return {...entity, text: texts};
}

export function getEntityText(entity, languageId) {
    const entityLanguageTexts = getEntityLanguageTexts(entity);
    let text = getEntityTextTranslation(entityLanguageTexts, null);
    if (!text) {
        text = getEntityTextTranslation(entityLanguageTexts, languageId);
    }
    if (!text) {
        text = getEntityTextTranslation(entityLanguageTexts, DEFAULT_LANGUAGE_ID);
    }
    return text;
}

export function setEntityText(entity, text) {
    return setEntityLanguageTexts(
        entity,
        [{
            ...text,
            languageId: null
        }]
    );
}

export function changeEntityText(entity, languageId, text) {
    const entityText = getEntityText(entity, languageId);
    return setEntityText(entity, {...entityText, ...text});
}
