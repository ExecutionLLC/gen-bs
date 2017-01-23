import _ from 'lodash';

/*
filter: {
    type: "starndard",
    text: [
        {languageId: 'en', name: 'Filter1', description: 'descr1'},
        {languageId: 'ru', name: 'фильтр1', description: 'описание1'},
        {languageId: null, text: 'хуильтр1', description: 'хуисание1'}
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

export function makeCopyOfText(copyOfWhat) {
    return `Copy of ${copyOfWhat}`;
}

export function makeDescriptionOfText(descriptionOfWhat) {
    return `Description of ${descriptionOfWhat}`;
}
