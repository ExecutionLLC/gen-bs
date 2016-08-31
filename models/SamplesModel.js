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
    'values'
];

const SampleTableNames = {
    Metadata: 'vcf_file_sample',
    Genotypes: 'sample_genotype',
    Versions: 'genotype_version',
    Values: 'vcf_file_sample_value'
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
                    this._findGenotypeIdsForSampleIds(sampleIds, trx, callback);
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
            // Check that the sample is not yet inserted, to be graceful to messages redelivered by RabbitMQ.
            this._findLastVersionsByGenotypeIds(trx, [sampleId], (error, versionIds) => {
                // TODO: Fix here not to ignore the error.
                if (error || _.isEmpty(versionIds)) {
                    // Sample is not found, so insert it.
                    async.waterfall([
                        // Add all fields that aren't exist yet and get ids and metadata of all the fields for the sample.
                        (callback) =>
                            this.models.fields.addMissingFields(languId, fields, trx, (error, fieldsWithIds) => {
                                callback(error, fieldsWithIds);
                            }),
                        // Add editable fields to the field list.
                        (fieldsWithIds, callback) => {
                            this.models.fields.findEditableFieldsInTransaction(trx, (error, fieldsMetadata) => {
                                const mappedFields = _.map(fieldsMetadata || [], fieldMetadata => {
                                    return {
                                        id: fieldMetadata.id,
                                        fieldMetadata
                                    }
                                });
                                const aggregatedFields = fieldsWithIds.concat(mappedFields);
                                callback(error, aggregatedFields);
                            });
                        },
                        // Create entries for 'vcf_file_sample_values' table to keep field-to-sample connection.
                        (fieldsWithIds, callback) => {
                            const sampleWithValues = Object.assign({}, sample, {
                                values: _.map(fieldsWithIds, fieldWithId => ({
                                    fieldId: fieldWithId.id,
                                    value: null
                                }))
                            });

                            // Add sample entries and return version id.
                            this._addInTransaction(userId, sampleWithValues, genotypes, false, trx, callback);
                        }
                    ], callback);
                } else {
                    // Sample has already been added, just return the version id found.
                    callback(null, _.first(versionIds));
                }
            });
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
                (versionId, callback) => this._addGenotypeValues(trx, versionId, sampleToUpdate.values,
                    (error) => callback(error, versionId)),
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

    _findGenotypeIdsForSampleIds(sampleIds, trx, callback) {
        trx(SampleTableNames.Genotypes)
            .select('id')
            .whereIn('vcf_file_sample_id', sampleIds)
            .map(result => result.id)
            .asCallback(callback);
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
                (error, genotypeIds) => callback(error, sampleId, genotypeIds)),
            (sampleId, genotypeIds, callback) => async.map(genotypeIds,
                (genotypeId, callback) => this._addNewGenotypeVersion(genotypeId, trx, callback),
                (error, genotypeVersionIds) => callback(error, sampleId, genotypeIds, genotypeVersionIds)),
            (sampleId, genotypeIds, genotypeVersionIds, callback) => {
                // Each genotype should have different fields.
                async.each(genotypeVersionIds, (genotypeVersionId, callback) => {
                    this._addGenotypeValues(trx, genotypeVersionId, sample.values, callback)
                }, (error) => callback(error, genotypeVersionIds))
            }
        ], callback);
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
                .asCallback((error) => callback(error, genotypeId))
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

    /**
     * Adds sample values into vcf_file_sample_value table.
     *
     * @param {Object}trx Knex transaction object.
     * @param {string}versionId Id of the sample genotype version.
     * @param {Array}values array of the sample values, each of form {fieldId, values (string value for the table column)}.
     * @param {function(Error, Array<Object>)}callback (error, resulting values list)
     * */
    _addGenotypeValues(trx, versionId, values, callback) {
        async.map(values, ({fieldId, values}, callback) => {
            const dataToInsert = {
                genotypeVersionId: versionId,
                fieldId,
                values
            };
            this._unsafeInsert(SampleTableNames.Values, dataToInsert, trx, callback);
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
                    true, (error, samplesMetadata) => callback(error, samplesMetadata, sampleVersions))
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
        async.waterfall([
            (callback) => this._findValuesForVersions(trx, versionIds, callback),
            (values, callback) => {
                const samplesValues = _.groupBy(values, 'genotypeVersionId');
                const sampleIdToMetadataHash = CollectionUtils.createHashByKey(samplesMetadata, 'id');
                const resultSamples = genotypeVersions
                    .map(genotypeVersion => {
                        const {sampleId, versionId, genotypeId, genotypeName} = genotypeVersion;
                        const sampleMetadata = sampleIdToMetadataHash[sampleId];
                        return Object.assign({}, sampleMetadata, {
                            id: versionId,
                            originalId: sampleId,
                            genotypeId,
                            genotypeName,
                            values: samplesValues[versionId]
                        })
                    });
                callback(null, resultSamples);
            }
        ], callback);
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
            .limit(1)
            .map(item => ChangeCaseUtil.convertKeysToCamelCase(item).sampleGenotypeId)
            .then((genotypeIds) => {
                if (_.isEmpty(genotypeIds)) {
                    return Promise.reject(new Error(`Genotype version is not found: ${genotypeVersionId}`))
                } else {
                    return _.first(genotypeIds);
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