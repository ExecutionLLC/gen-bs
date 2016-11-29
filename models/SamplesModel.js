'use strict';

const _ = require('lodash');
const async = require('async');

const {ENTITY_TYPES} = require('../utils/Enums');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');
const SecureModelBase = require('./SecureModelBase');
const Config = require('../utils/Config');

const mappedColumns = [
    'id',
    'fileName',
    'hash',
    'type',
    'isAnalyzed',
    'isDeleted',
    'values',
    'timestamp'
];

const SampleTableNames = {
    Metadata: 'vcf_file_sample',
    Genotypes: 'sample_genotype',
    Versions: 'genotype_version',
    Values: 'vcf_file_sample_value',
    Fields: 'genotype_field',
    Text: 'genotype_text'
};

class SamplesModel extends SecureModelBase {
    constructor(models) {
        super(models, SampleTableNames.Metadata, mappedColumns);
    }

    find(userId, genotypeVersionId, callback) {
        this.db.transactionally((trx, callback) => {
            const genotypeVersionIds = [genotypeVersionId];
            async.waterfall([
                (callback) => this._findManyInTransaction(trx, userId, genotypeVersionIds, callback),
                (samples, callback) => callback(null, samples[0])
            ], callback);
        }, callback);
    }

    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                // Find all sample ids belonging to the user.
                (callback) => this._findSamplesMetadata(trx, userId, null, true, callback),
                (samplesMetadata, callback) => {
                    const sampleIds = _(samplesMetadata)
                        .map(sample => sample.id)
                        .uniq()
                        .value();
                    callback(null, sampleIds);
                },
                (sampleIds, callback) => {
                    this._findGenotypeIdsForSampleIds(sampleIds, true, trx, callback);
                },
                // Find last version for each genotype
                (genotypeIds, callback) => {
                    this._findLastVersionsByGenotypeIds(trx, genotypeIds, callback);
                },
                // Use the find-many method to build the samples.
                (versions, callback) => {
                    const versionIds = versions.map(version => version.versionId);
                    this._findManyInTransaction(trx, userId, versionIds, callback)
                }
            ], callback);
        }, callback);
    }

    findMany(userId, sampleVersionIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findManyInTransaction(trx, userId, sampleVersionIds, callback);
        }, callback);
    }

    remove(userId, genotypeVersionId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findGenotypeIdByVersionId(trx, genotypeVersionId, callback),
                (genotypeId, callback) => this._deleteGenotype(trx, genotypeId, callback)
            ], callback);
        }, callback);

    }

    _deleteGenotype(trx, genotypeId, callback) {
        trx(SampleTableNames.Genotypes)
            .where('id', genotypeId)
            .update({is_deleted: true})
            .asCallback((error) => {
                callback(error, genotypeId);
            });
    }

    attachSampleFields(userId, languId, sampleId, sampleFields, genotypes, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) =>
                    this.models.fields.addMissingFields(languId, sampleFields, trx, (error, fieldsWithIds) => {
                        const fieldIds = _.map(fieldsWithIds, fieldWithId => ({
                            fieldId: fieldWithId.id,
                        }));
                        callback(error, fieldIds);
                    }),
                (fieldIds, callback) => this._findGenotypeIdsForSampleIds([sampleId], false, trx, (error, genotypeIds) => callback(error, fieldIds, genotypeIds)),
                (fieldIds, genotypeIds, callback) => {
                    async.each(genotypeIds, (genotypeId, callback) => {
                        this._addGenotypeFields(trx, genotypeId, fieldIds, callback)
                    }, (error) => callback(error, genotypeIds))
                },
                (genotypeIds, callback) => this._findLastVersionsByGenotypeIds(trx, genotypeIds, callback),
                (sampleVersionsIds, callback) => callback(null, _.map(sampleVersionsIds, sampleVersionsId => sampleVersionsId.versionId))
            ], callback)
        }, callback);
    }

    /**
     * Adds sample with specified params, if it doesn't already exist in database.
     *
     * @param {Uuid}userId The owner
     * @param {string}languId Language to use for texts.
     * @param {object}sample Sample metadata
     * @param {Array<Object>}fields Fields metadata. New fields will be added, existing fields will be reused.
     * @param {Array<string>}genotypes List of genotype names found in the sample
     * @param {function(Error, string)} callback (error, sampleVersionId)
     * */
    addSamplesWithFields(userId, languId, sample, fields, genotypes, callback) {
        // To insert samples we need to:
        // 0. check that sample doesn't exist in the database
        // (in case message has already been consumed but wasn't marked as complete in RMQ)
        // 1. insert sample metadata
        // 2. insert genotypes list and retrieve their ids
        // 3. create versions for each of the genotypes
        // 4. add fields for each version created
        const sampleId = sample.id;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                // Add all fields that aren't exist yet and get ids and metadata of all the fields for the sample.
                (callback) =>
                    this.models.fields.addMissingFields(languId, fields, trx, (error, fieldsWithIds) => {
                        const mappedFields = _.map(fieldsWithIds, fieldWithId => ({
                            id: fieldWithId.id,
                            fieldWithId
                        }));
                        callback(error, mappedFields);
                    }),
                // Add editable fields to the field list.
                (fieldsWithIds, callback) => {
                    this.models.fields.findEditableFieldsInTransaction(trx, (error, fieldsMetadata) => {
                        const editableFields = _.map(fieldsMetadata || [], fieldMetadata => ({
                            id: fieldMetadata.id,
                            fieldMetadata
                        }));
                        callback(error, {
                            fieldsWithIds,
                            editableFields
                        });
                    });
                },
                // Create entries for 'vcf_file_sample_values' table to keep field-to-sample connection.
                ({fieldsWithIds, editableFields}, callback) => {
                    const sampleWithValues = Object.assign({}, sample, {
                        sampleFields: _.map(fieldsWithIds, fieldWithId => ({
                            fieldId: fieldWithId.id
                        })),
                        editableFields: _.map(editableFields, fieldWithId => ({
                            fieldId: fieldWithId.id,
                            value: null
                        }))
                    });

                    // Add sample entries and return version id.
                    this._addInTransaction(userId, sampleWithValues, genotypes, false, trx, callback);
                }
            ], callback);
        }, callback);
    }

    /**
     * Marks sample as analyzed and reduces available sample count for the user,
     * if sample is not yet marked as analyzed.
     *
     * @param userId Id of the user doing request.
     * @param sampleVersionId Id of the sample version in request.
     * @param callback (error, isSampleMarkedAsAnalyzed)
     * */
    makeSampleIsAnalyzedIfNeeded(userId, sampleVersionId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this.find(userId, sampleVersionId, callback),
                (sample, callback) => {
                    const isAnalyzed = sample.isAnalyzed || false;
                    if (!isAnalyzed) {
                        async.waterfall([
                            (callback) => {
                                this._setAnalyzed(sample.id, true, trx, callback);
                            },
                            (sampleId, callback) => {
                                this.models.users.reduceForOnePaidSample(userId, trx, callback);
                            },
                            (paidSamplesCount, callback) => {
                                callback(null, true);
                            }
                        ], callback);
                    } else {
                        callback(null, false);
                    }
                }
            ], callback);
        }, callback);
    }

    update(userId, sampleVersionId, sampleToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureVersionIsLatest(trx, sampleVersionId, callback),
                (callback) => this._findGenotypeIdByVersionId(trx, sampleVersionId, callback),
                (genotypeId, callback) => {
                    const dataToUpdate = {
                        fileName: sampleToUpdate.fileName
                    };
                    this._unsafeUpdate(genotypeId, dataToUpdate, trx, (error) => callback(error, genotypeId));
                },
                (genotypeId, callback) => this._addNewGenotypeVersion(genotypeId, trx, callback),
                (versionId, callback) => this._addGenotypeValues(trx, versionId, sampleToUpdate.editableFields.fields,
                    (error) => callback(error, versionId)),
                (versionId, callback) => {
                    const {description, name} = sampleToUpdate.editableFields;
                    const genotypeText = {
                        genotypeVersionId: versionId,
                        name,
                        description
                    };
                    this._addGenotypeVersionText(trx, genotypeText, (error) => callback(error, versionId))
                },
                (versionId, callback) => this._findManyInTransaction(trx, userId, [versionId], callback),
                (samples, callback) => callback(null, samples[0])
            ], callback);
        }, callback);
    }

    _setAnalyzed(sampleId, value, trx, callback) {
        trx(SampleTableNames.Metadata)
            .where('id', sampleId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                isAnalyzed: value,
                analyzedTimestamp: value ? new Date() : null
            }))
            .asCallback((error) => {
                callback(error, sampleId);
            });
    }

    _add(userId, languId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addInTransaction(userId, sample, null, shouldGenerateId, trx, callback);
        }, callback);
    }

    findGenotypeIdsForSampleIds(sampleIds, shouldExcludeDeletedEntries, callback) {
        this.db.transactionally((trx, callback) => {
            this._findGenotypeIdsForSampleIds(sampleIds, shouldExcludeDeletedEntries, trx, callback)
        }, callback);
    }

    _findGenotypeIdsForSampleIds(sampleIds, shouldExcludeDeletedEntries, trx, callback) {
        let baseQuery = trx(SampleTableNames.Genotypes)
            .select('id')
            .whereIn('vcf_file_sample_id', sampleIds);
        if (shouldExcludeDeletedEntries) {
            baseQuery = baseQuery.andWhereNot('is_deleted', true);
        }
        async.waterfall([
            (callback) => baseQuery.asCallback((error, results) => callback(error, results)),
            (results, callback) => callback(null, _.map(results, result => result.id))
        ], callback);
    }

    /**
     * @param {Uuid} userId The owner
     * @param {Object} sample Sample metadata to add.
     * @param {?Array<string>}genotypesOrNull List of genotype names in the sample.
     * If null, one genotype with NULL-name will be added.
     * @param {boolean} shouldGenerateId If true, id will be generated.
     * @param {KnexTransaction} trx Knex transaction
     * @param {function(Error, Uuid)} callback (error, sampleVersionId)
     * */
    _addInTransaction(userId, sample, genotypesOrNull, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = this._createDataToInsert(userId, sample, shouldGenerateId);
                this._insert(dataToInsert, trx, callback);
            },
            (sampleId, callback) => this._setAnalyzed(sampleId, sample.isAnalyzed || false, trx, callback),
            (sampleId, callback) => this._createGenotypes(sampleId, genotypesOrNull, trx,
                (error, genotypes) => callback(error, sampleId, genotypes)),
            (sampleId, genotypes, callback) => {
                async.each(genotypes, (genotype, callback) => {
                    this._addGenotypeFields(trx, genotype.genotypeId, sample.sampleFields, callback)
                }, (error) => callback(error, sampleId, genotypes))
            },
            (sampleId, genotypes, callback) => async.map(
                genotypes,
                (genotype, callback) => this._addNewGenotypeVersion(
                    genotype.genotypeId,
                    trx,
                    (error, genotypeVersionId) =>
                        callback(
                            error,
                            {
                                genotypeId: genotype.genotypeId,
                                genotypeVersionId,
                                genotypeName: genotype.genotypeName,
                            }
                        )
                ),
                (error, genotypeVersions) => callback(error, sampleId, genotypeVersions)),
            (sampleId, genotypeVersions, callback) => async.map(genotypeVersions,
                (genotype, callback) => {
                    const {fileName, description} =sample;
                    const {genotypeVersionId, genotypeName} =genotype;
                    const name = this._createGenotypeName(fileName, genotypeName);
                    const genotypeText = {
                        genotypeVersionId,
                        name,
                        description
                    };
                    this._addGenotypeVersionText(trx, genotypeText, callback)
                },
                (error) => callback(error, sampleId, genotypeVersions)),
            (sampleId, genotypeVersions, callback) => {
                // Each genotype should have different fields.
                async.map(genotypeVersions, (genotypeVersion, callback) => {
                    this._addGenotypeValues(
                        trx,
                        genotypeVersion.genotypeVersionId,
                        sample.editableFields,
                        (error) => callback(error, genotypeVersion.genotypeVersionId)
                    );
                }, callback)
            }
        ], callback);
    }

    _createGenotypeName(fileName, genotype) {
        const name = genotype ? `${fileName}:${genotype}` : fileName;
        return name.substr(-50, 50);
    }

    /**
     * @param {Uuid}sampleId
     * @param {Array<string>}genotypesOrNull
     * @param {KnexTransaction}trx
     * @param {function(Error, Array<Uuid>)}callback
     * */
    _createGenotypes(sampleId, genotypesOrNull, trx, callback) {
        const genotypes = genotypesOrNull || [Config.oneSampleGenotypeName];
        async.map(genotypes, (genotypeName, callback) => {
            const genotypeId = this._generateId();
            trx(SampleTableNames.Genotypes)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                    id: genotypeId,
                    vcfFileSampleId: sampleId,
                    genotypeName
                }))
                .asCallback((error) => callback(error, {
                    genotypeId,
                    genotypeName
                }))
        }, callback);
    }

    _addNewGenotypeVersion(genotypeId, trx, callback) {
        const genotypeVersionId = this._generateId();
        trx(SampleTableNames.Versions)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                id: genotypeVersionId,
                sampleGenotypeId: genotypeId,
                timestamp: new Date()
            }))
            .asCallback((error) => callback(error, genotypeVersionId));
    }

    _addGenotypeVersionText(trx, genotypeText, callback) {
        const {genotypeVersionId, name, description} = genotypeText;
        return trx(SampleTableNames.Text)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase({
                genotypeVersionId,
                name,
                description,
                languId: Config.defaultLanguId
            }))
            .asCallback((error) => callback(error, genotypeVersionId));
    }

    /**
     * Adds sample values into vcf_file_sample_value table.
     *
     * @param {Object}trx Knex transaction object.
     * @param {string}versionId Id of the sample genotype version.
     * @param {Array}values array of the sample values, each of form {fieldId, values (string value for the table column)}.
     * @param {function(Error, Array<Object>)}callback (error, resulting values list)
     * */
    _addGenotypeValues(trx, versionId, values, callback) {
        async.map(values, ({fieldId, value}, callback) => {
            const dataToInsert = {
                genotypeVersionId: versionId,
                fieldId,
                values: value
            };
            this._unsafeInsert(SampleTableNames.Values, dataToInsert, trx, callback);
        }, callback);
    }

    _addGenotypeFields(trx, genotypeId, values, callback) {
        async.map(values, ({fieldId}, callback) => {
            const dataToInsert = {
                fieldId,
                genotypeId
            };
            this._unsafeInsert(SampleTableNames.Fields, dataToInsert, trx, callback);
        }, callback);
    }

    /**
     * Ensures the specified version is the latest version of the sample it is related to.
     *
     * @param trx Knex transaction
     * @param sampleVersionId Id of the sample version to check.
     * @param callback (error)
     * */
    _ensureVersionIsLatest(trx, sampleVersionId, callback) {
        // Find last version and compare with the specified.
        async.waterfall([
            (callback) => this._findGenotypeIdByVersionId(trx, sampleVersionId, callback),
            (genotypeId, callback) => this._findLastVersionsByGenotypeIds(trx, [genotypeId],
                (error, lastVersions) => callback(error, _.first(lastVersions))),
            (version, callback) => {
                if (version.versionId === sampleVersionId) {
                    callback(null);
                } else {
                    callback(new Error('Action cannot be performed on an old version of the sample.'));
                }
            }
        ], callback);
    }

    _findManyInTransaction(trx, userId, genotypeVersionIds, callback) {
        async.waterfall([
            (callback) => this._findVersionObjectsByVersionIds(trx, genotypeVersionIds, callback),
            (sampleVersions, callback) => this._ensureAllItemsFound(sampleVersions, genotypeVersionIds, callback),
            (sampleVersions, callback) => {
                // Here we can have request for different versions of the same sample. Load metadata only once.
                const sampleIds = _(sampleVersions)
                    .map(sampleVersion => sampleVersion.sampleId)
                    .uniq()
                    .value();
                this._findSamplesMetadata(trx,
                    userId,
                    sampleIds,
                    false, (error, samplesMetadata) => callback(error, samplesMetadata, sampleVersions))
            },
            (samplesMetadata, sampleVersions, callback) =>
                this._createSamplesWithValues(trx, samplesMetadata, sampleVersions,
                    (error, resultSamples) => callback(error, resultSamples))
        ], (error, resultSample) => {
            callback(error, resultSample);
        });
    }

    /**
     * @param trx
     * @param {Array<Object>}samplesMetadata
     * @param {Array<GenotypeVersionObject>}genotypeVersions
     * @param {function(Error, Array<Object>)}callback
     * */
    _createSamplesWithValues(trx, samplesMetadata, genotypeVersions, callback) {
        const versionIds = _.map(genotypeVersions, version => version.versionId);
        const genotypeIds = _.map(genotypeVersions, version => version.genotypeId);
        async.waterfall([
            (callback) => async.parallel({
                values: (callback) => this._findValuesForVersions(trx, versionIds, callback),
                fields: (callback) => this._findFieldForGenotypeId(trx, genotypeIds, callback),
                texts: (callback) => this._findTextForVersions(trx, versionIds, callback),
            }, (error, results) => {
                callback(error, results);
            }),
            ({values, fields, texts}, callback) => {
                const editableValues = _.groupBy(values, 'genotypeVersionId');
                const sampleTexts = _.keyBy(texts, 'genotypeVersionId');
                const sampleFieldsValues = _.groupBy(fields, 'genotypeId');
                const sampleIdToMetadataHash = CollectionUtils.createHashByKey(samplesMetadata, 'id');
                const resultSamples = genotypeVersions
                    .map(genotypeVersion => {
                        const {sampleId, versionId, genotypeId, genotypeName} = genotypeVersion;
                        const sampleMetadata = sampleIdToMetadataHash[sampleId];
                        const {name, description} = sampleTexts[versionId];
                        return Object.assign({}, sampleMetadata, {
                            id: versionId,
                            originalId: sampleId,
                            genotypeId,
                            genotypeName,
                            sampleFields: _.map(sampleFieldsValues[genotypeId], field => ({
                                fieldId: field.fieldId
                            })),
                            editableFields: {
                                versionId,
                                name,
                                description,
                                fields: _.map(editableValues[versionId], field => {
                                    const {fieldId, values} = field;
                                    return {
                                        fieldId,
                                        value: values
                                    }
                                })
                            }
                        })
                    });
                callback(null, resultSamples);
            }
        ], callback);
    }

    _findFieldForGenotypeId(trx, genotypeIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.Fields)
                .whereIn('genotype_id', genotypeIds)
                .asCallback((error, rows) => callback(error, rows)),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], (error, rows) => {
            callback(error, rows);
        });
    }

    _findValuesForVersions(trx, genotypeVersionIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.Values)
                .whereIn('genotype_version_id', genotypeVersionIds)
                .asCallback((error, rows) => callback(error, rows)),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], (error, rows) => {
            callback(error, rows);
        });
    }

    _findTextForVersions(trx, genotypeVersionIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(SampleTableNames.Text)
                .whereIn('genotype_version_id', genotypeVersionIds)
                .asCallback((error, rows) => callback(error, rows)),
            (rows, callback) => this._toCamelCase(rows, callback)
        ], (error, rows) => {
            callback(error, rows);
        });
    }

    /**
     * @typedef {Object}GenotypeVersionObject
     * @property {Uuid}genotypeId Id of the sample genotype.
     * @property {Uuid}sampleId Id of the sample to which the genotype belongs.
     * @property {Uuid}versionId Id of the genotype version.
     * @property {string}genotypeName Name of the genotype.
     * */

    /**
     * @param trx
     * @param {Array<Uuid>}genotypeVersionIds
     * @param {function(Error, GenotypeVersionObject)}callback
     * */
    _findVersionObjectsByVersionIds(trx, genotypeVersionIds, callback) {
        const genotypeVersionIdColumnName = `${SampleTableNames.Versions}.id as version_id`;
        const sampleIdColumnName = `${SampleTableNames.Genotypes}.vcf_file_sample_id as sample_id`;
        const genotypeIdColumnName = `${SampleTableNames.Genotypes}.id as genotype_id`;
        const genotypeNameColumnName = `${SampleTableNames.Genotypes}.genotype_name as genotype_name`;

        async.waterfall([
            (callback) => trx.select(
                genotypeVersionIdColumnName,
                sampleIdColumnName,
                genotypeIdColumnName,
                genotypeNameColumnName
            )
                .from(SampleTableNames.Versions)
                .leftJoin(SampleTableNames.Genotypes,
                    `${SampleTableNames.Genotypes}.id`, `${SampleTableNames.Versions}.sample_genotype_id`)
                .whereIn(`${SampleTableNames.Versions}.id`, genotypeVersionIds)
                .orderBy('timestamp', 'desc')
                .asCallback((error, results) => callback(error, results)),
            (versionObjects, callback) => this._toCamelCase(versionObjects, callback)
        ], callback);
    }

    _findGenotypeIdByVersionId(trx, genotypeVersionId, callback) {
        trx.select('sample_genotype_id')
            .from(SampleTableNames.Versions)
            .where('id', genotypeVersionId)
            .orderBy('timestamp', 'desc')
            .map(item => ChangeCaseUtil.convertKeysToCamelCase(item).sampleGenotypeId)
            .then((genotypeIds) => {
                if (_.isEmpty(genotypeIds)) {
                    return Promise.reject(new Error(`Genotype version is not found: ${genotypeVersionId}`))
                } else {
                    return genotypeIds[0];
                }
            })
            .asCallback((error, sampleGenotypeId) => callback(error, sampleGenotypeId));
    }

    _findSamplesMetadata(trx, userId, sampleIdsOrNull, shouldExcludeDeletedEntries, callback) {
        let baseQuery = trx.select()
            .from(SampleTableNames.Metadata)
            .where(function () {
                this.where('creator', userId)
                    .orWhere('creator', null)
            });
        if (sampleIdsOrNull) {
            baseQuery = baseQuery.andWhere('id', 'in', sampleIdsOrNull);
        }

        if (shouldExcludeDeletedEntries) {
            baseQuery = baseQuery.andWhereNot('is_deleted', true);
        }

        async.waterfall([
            (callback) => baseQuery.asCallback((error, samplesMetadata) => callback(error, samplesMetadata)),
            (samplesMetadata, callback) => callback(null, ChangeCaseUtil.convertKeysToCamelCase(samplesMetadata)),
            (samplesMetadata, callback) => this._mapItems(samplesMetadata, callback)
        ], (error, samplesMetadata) => {
            callback(error, samplesMetadata);
        });
    }

    /**
     * Finds last version id for each sample id in array.
     *
     * @param trx Knex transaction.
     * @param {Array<string>}genotypeIds Array of sample genotype ids to search versions for.
     * @param callback (error, versions). Each version is an object
     * which has 'sampleId' and 'versionId' fields.
     * */
    _findLastVersionsByGenotypeIds(trx, genotypeIds, callback) {
        const genotypeIdsInQuotes = _.map(genotypeIds, id => `'${id}'`);
        async.waterfall([
            (callback) => trx.raw(
                'SELECT DISTINCT ON (sample_genotype_id)'
                + ' sample_genotype_id'
                + ', LAST_VALUE(id) OVER wnd AS id'
                + ', LAST_VALUE(timestamp) OVER wnd AS last_version_timestamp'
                + ' FROM genotype_version'
                + ' WHERE sample_genotype_id IN'
                + ` (${genotypeIdsInQuotes.join(', ')})`
                + ' WINDOW wnd AS'
                + ' (PARTITION BY sample_genotype_id ORDER BY timestamp DESC)'
            )
                .asCallback((error, results) => callback(error, results && results.rows)),
            (versions, callback) => this._ensureAllItemsFound(versions, genotypeIds, callback),
            (versions, callback) => this._toCamelCase(versions, callback),
            (versions, callback) => {
                const mappedVersions = _.map(versions, (version) => this._mapDatabaseSampleVersionToObject(version));
                callback(null, mappedVersions);
            }
        ], (error, versions) => {
            callback(error, versions);
        });
    }

    _mapDatabaseSampleVersionToObject(databaseVersion) {
        return {
            sampleId: databaseVersion.vcfFileSampleId,
            versionId: databaseVersion.id
        }
    }

    _createDataToInsert(userId, sample, shouldGenerateId) {
        return {
            id: shouldGenerateId ? this._generateId() : sample.id,
            creator: userId,
            fileName: sample.fileName,
            hash: sample.hash,
            type: sample.type || ENTITY_TYPES.USER
        };
    }

}

module.exports = SamplesModel;