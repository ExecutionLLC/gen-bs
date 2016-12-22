const _ = require('lodash');
const Promise = require('bluebird');
const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

const tables = {
    Metadata: 'metadata',
    MetadataText: 'metadata_text',
    MetadataAvailableValue: 'metadata_available_value',
    MetadataAvailableValueText: 'metadata_available_value_text',
    SampleMetadata: 'sample_metadata',
    Sample: 'sample',
    Field: 'field'
};

const oldTables = {
    FieldMetadata: 'field_metadata',
    FieldText: 'field_text',
    FieldAvailableValue: 'field_available_value',
    FieldAvailableValueText: 'field_available_value_text',
    SampleEditableField: 'sample_editable_field'
};

exports.up = function (knex) {
    return createMetadataTables(knex)
        .then(() => migrateEditableFields(knex))
        .then(() => dropOldTables(knex))
        .then(() => updateFieldMetadataTable(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

var _findEditableFields = function (knex) {
    return knex.select()
        .from(oldTables.FieldMetadata)
        .where('is_editable', true)
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)));
};
function updateFieldMetadataTable(knex) {
    return _findEditableFields(knex)
        .then((fields) => {
            const fieldIds = _.map(fields, field => field.id);
            return knex(oldTables.FieldText)
                .whereIn('field_id', fieldIds)
                .del();
        })
        .then(() => {
            return knex(oldTables.FieldMetadata)
                .where('is_editable', true)
                .del()
                .then(() => knex.schema
                    .renameTable(oldTables.FieldMetadata, tables.Field)
                    .table(tables.Field, table => {
                        table.dropColumn('is_editable');
                    }));
        });
}

function dropOldTables(knex) {
    return knex.schema.dropTable(oldTables.FieldAvailableValueText)
        .dropTable(oldTables.FieldAvailableValue)
        .dropTable(oldTables.SampleEditableField);
}

function migrateEditableFields(knex) {
    return findEditableFields(knex)
        .then((fields) => {
            return Promise.mapSeries(fields, field => {
                return migrateEditableField(field, knex);
            });
        })
        .then(() => migrateSampleEditableFields(knex));
}

function migrateSampleEditableFields(knex) {
    return knex.select()
        .from(oldTables.SampleEditableField)
        .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
        .then((sampleEditableFields) => {
            return Promise.mapSeries(sampleEditableFields, sampleEditableField => {
                const {sampleId, fieldId, value} = sampleEditableField;
                const sampleMetadata = {
                    sampleId,
                    metadataId: fieldId,
                    value
                };
                return knex(tables.SampleMetadata)
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase(sampleMetadata))
            });
        })
}

function migrateEditableField(field, knex) {
    const {id, name, valueType, isInvisible, isEditable, fieldTexts, fieldAvailableValues} = field;

    const metadata = {
        id,
        name,
        valueType,
        isInvisible,
        isEditable
    };
    return knex(tables.Metadata)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase(metadata))
        .then(() => {
            return Promise.mapSeries(fieldTexts, fieldText => {
                const {fieldId, languId, description, label} = fieldText;
                const metadataText = {
                    metadataId: fieldId,
                    languageId: languId,
                    description,
                    label
                };
                return knex(tables.MetadataText)
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase(metadataText))
            });
        })
        .then(() => {
            return Promise.mapSeries(fieldAvailableValues, fieldAvailableValue => {
                const {fieldAvailableValueTexts} = fieldAvailableValue;
                const metadataAvailableValueId = Uuid.v4();
                const metadataAvailableValue = {
                    id: metadataAvailableValueId,
                    metadata_id: id
                };
                return knex(tables.MetadataAvailableValue)
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase(metadataAvailableValue))
                    .then(() => {
                        return Promise.mapSeries(fieldAvailableValueTexts, fieldAvailableValueText => {
                            const {languId, value} = fieldAvailableValueText;
                            const metadataAvailableValueText = {
                                metadataAvailableValueId: metadataAvailableValueId,
                                languageId: languId,
                                value
                            };
                            return knex(tables.MetadataAvailableValueText)
                                .insert(ChangeCaseUtil.convertKeysToSnakeCase(metadataAvailableValueText))
                        });
                    });
            });
        });
}

function findEditableFields(knex) {
    return _findEditableFields(knex)
        .then((fieldsMetadata) => {
            return Promise.mapSeries(fieldsMetadata, (fieldMetadata) => {
                return knex.select()
                    .from(oldTables.FieldText)
                    .where('field_id', fieldMetadata.id)
                    .then((results) => {
                        return Object.assign({}, fieldMetadata, {
                            fieldTexts: _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result))
                        });
                    });
            })
        })
        .then((fieldsMetadata) => {
            return Promise.mapSeries(fieldsMetadata, (fieldMetadata) => {
                return knex.select()
                    .from(oldTables.FieldAvailableValue)
                    .where('field_id', fieldMetadata.id)
                    .then((results) => _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result)))
                    .then((fieldAvailableValues) => {
                        return Promise.mapSeries(fieldAvailableValues, (fieldAvailableValue) => {
                            return knex.select()
                                .from(oldTables.FieldAvailableValueText)
                                .where('field_available_value_id', fieldAvailableValue.id)
                                .then((results) => {
                                    return Object.assign({}, fieldAvailableValue, {
                                        fieldAvailableValueTexts: _.map(results, result => ChangeCaseUtil.convertKeysToCamelCase(result))
                                    });
                                });
                        })
                    })
                    .then((fieldAvailableValues) => {
                        return Object.assign({}, fieldMetadata, {
                            fieldAvailableValues
                        });
                    });
            });
        });

}

function createMetadataTables(knex) {
    return knex.schema
        .createTable(tables.Metadata, (table) => {
            table.uuid('id')
                .primary();
            table.string('name', 50);
            table.text('value_type');
            table.boolean('is_invisible')
                .defaultTo(true);
            table.boolean('is_editable')
                .defaultTo(false);
        })
        .createTable(tables.MetadataText, (table) => {
            table.uuid('metadata_id')
                .references('id')
                .inTable(tables.Metadata)
                .onDelete('cascade')
                .onUpdate('cascade');
            table.string('language_id', 2)
                .references('id')
                .inTable('langu')
                .onDelete('cascade')
                .onUpdate('cascade');
            table.string('label', 128);
            table.text('description');
            table.primary(['metadata_id', 'language_id']);
        })
        .createTable(tables.MetadataAvailableValue, (table) => {
            table.uuid('id')
                .primary();
            table.uuid('metadata_id')
                .references('id')
                .inTable(tables.Metadata)
                .onDelete('cascade')
                .onUpdate('cascade');
        })
        .createTable(tables.MetadataAvailableValueText, (table) => {
            table.uuid('metadata_available_value_id')
                .references('id')
                .inTable(tables.MetadataAvailableValue)
                .onDelete('cascade')
                .onUpdate('cascade');
            table.string('language_id', 2)
                .references('id')
                .inTable('langu')
                .onDelete('cascade')
                .onUpdate('cascade');
            table.string('value', 100);
            table.primary(['metadata_available_value_id', 'language_id']);
        })
        .createTable(tables.SampleMetadata, (table) => {
            table.uuid('sample_id')
                .references('id')
                .inTable(tables.Sample)
                .onDelete('cascade')
                .onUpdate('cascade');
            table.uuid('metadata_id', 2)
                .references('id')
                .inTable(tables.Metadata)
                .onDelete('cascade')
                .onUpdate('cascade');
            table.string('value', 100);
            table.primary(['sample_id', 'metadata_id']);
        })
}
