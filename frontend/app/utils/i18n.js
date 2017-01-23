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

export function getEntityText(entity, languageId) {
    let text = getEntityTextTranslation(entity.text, null);
    if (!text) {
        text = getEntityTextTranslation(entity.text, languageId);
    }
    if (!text) {
        text = getEntityTextTranslation(entity.text, DEFAULT_LANGUAGE_ID);
    }
    return text;
}

export function setEntityText(entity, text) {
    return {
        ...entity,
        text: [
            {
                ...text,
                languageId: null
            }
        ]
    };
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
