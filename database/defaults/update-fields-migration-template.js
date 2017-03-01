const _ = require('lodash');
const BluebirdPromise = require('bluebird');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');
const Uuid = require('node-uuid');

// const jsonFiles = require('./20170227163220_update-fields/1000genomes.txt.dif.json');
console.log(__dirname);
const jsonFiles = [];
const jsonDir = 'MIGRATION_DATA_FOLDER_PATH'; //'20170227163220_update-fields';

require('fs').readdirSync(`${__dirname}/${jsonDir}`).forEach(function(file) {
    if (file.match(/\.json$/) !== null) {
        jsonFiles.push({
            name: file,
            data: require(`./${jsonDir}/${file}`)
        });
    }
});

const languages = ['en', 'ru'];

function addNewFieldText(knex, fieldId, languageId, label, description) {
    return knex('field_text')
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            fieldId,
            languageId,
            label,
            description
        }));
}

function addNewField(field, knex) {
    const fieldData = {
        id: Uuid.v4(),
        name: field.column_name,
        sourceName: field.source_name,
        valueType: field.value_type,
        isMandatory: false,
        isInvisible: null,
        dimension: field.dimension,
        isHyperlink: false, // TODO: add support
        hyperlinkTemplate: null // TODO: add support
    };
    return knex('field')
        .returning('id')
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(fieldData))
        .then((res) => {
            console.log(`==> insert field ${fieldData.name}... OK`);
            return BluebirdPromise.mapSeries(languages, languageId => {
                if (field[languageId] && !_.isEmpty(field[languageId])) {
                    return addNewFieldText(knex, res[0], languageId, field[languageId].label || '', field[languageId].description || '')
                        .then(() => {
                            console.log(`==> insert ${languageId} translation for field: ${fieldData.name}... OK`);
                        });
                }
            });
        });
}

function updateFieldText(translation, knex, skipEmptyValues = true) {
    return BluebirdPromise.mapSeries(languages, languageId => {
        let fieldTextData = {};
        if (translation[languageId] && !_.isEmpty(translation[languageId])) {
            if (!_.isNil(translation[languageId].newLabel) && (!skipEmptyValues || !_.isEmpty(translation[languageId].newLabel))) {
                fieldTextData.label = translation[languageId].newLabel;
            }
            if (!_.isNil(translation[languageId].newDescription) && (!skipEmptyValues || !_.isEmpty(translation[languageId].newDescription))) {
                fieldTextData.description =  translation[languageId].newDescription;
            }
        }
        if (_.isEmpty(fieldTextData)) {
            return null;
        } else {
            return knex('field_text')
                .where({
                    'field_id': translation.id,
                    'language_id': languageId
                })
                .update(ChangeCaseUtil.convertKeysToSnakeCase(fieldTextData))
                .then((cnt) => {
                    if (cnt) {
                        console.log(`==> update ${languageId} translation for field: ${translation.column_name}... OK`);
                    } else {
                        return addNewFieldText(knex, translation.id, languageId, fieldTextData.label, fieldTextData.description)
                            .then(() => {
                                console.log(`==> insert ${languageId} translation for field: ${translation.column_name}... OK`);
                            });
                    }
                });
        }
    });
}

exports.up = function(knex) {
    console.log('Update fields auto-generated migration... STARTED');

    return BluebirdPromise.mapSeries(jsonFiles, jsonFile => {

        const newFields = jsonFile.data.newFields;
        const newTranslations = jsonFile.data.newTranslations;

        console.log(`=> Processing file '${jsonFile.name}'(${jsonFile.data.generated})`);

        return BluebirdPromise.mapSeries(newFields, field => {
            return addNewField(field, knex);
        }).then(() => {
            return BluebirdPromise.mapSeries(newTranslations, translation => {
                return updateFieldText(translation, knex);
            });
        });

    }).then(() => {
        console.log('Update fields auto-generated migration... COMPLETE');
    });


};

exports.down = function() {
    throw new Error('Not implemented');
};
