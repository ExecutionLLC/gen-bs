'use strict';

const path = require('path');
const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const ChangeCaseUtil = require('./ChangeCaseUtil');
const KnexWrapper = require('./KnexWrapper');

const TableNames = {
    Filter: 'filter',
    FilterText: 'filter_text',
    Keywords: 'keyword',
    Synonyms: 'synonym_text',
    VcfSample:'vcf_file_sample',
    VcfSampleVersion:'vcf_file_sample_version',
    VcfFileSampleValue:'vcf_file_sample_value',
    View: 'view',
    ViewText: 'view_text',
    ViewItem: 'view_item',
    ViewItemKeywords: 'view_item_keyword',
    Lang:'langu',
    User:'user',
    UserText:'user_text',
    FieldMetadata:'field_metadata',
    FieldText:'field_text',
    FieldAvailableValue:'field_available_value',
    FieldAvailableValueText:'field_available_value_text'
};

class ImportDatabaseModel{
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;

        this.db = new KnexWrapper(config, logger);
    }

    _unsafeInsert(tableName, dataToInsert, trx, callback) {
        trx(tableName)
            .insert(ChangeCaseUtil.convertKeysToSnakeCase(dataToInsert))
            .asCallback((error) => {
                callback(error, dataToInsert.id);
            });
    }

    _generateId() {
        // Generate random UUID
        return Uuid.v4();
    }

    _ensureNameIsValid(name, callback) {
        const trimmedName = (name || '').trim();
        if (_.isEmpty(trimmedName)) {
            callback(new Error('Name cannot be empty.'));
        } else {
            callback(null);
        }
    }

    addFilter(userId, languId, filter, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureNameIsValid(filter.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : filter.id,
                        creator: userId,
                        name: filter.name,
                        rules: filter.rules,
                        type: filter.type || ENTITY_TYPES.USER
                    };
                    this._unsafeInsert(TableNames.Filter, dataToInsert, trx, callback);
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        description: filter.description
                    };
                    this._unsafeInsert(TableNames.FilterText, dataToInsert, trx, (error) => {
                        callback(error, filterId);
                    });
                }
            ], callback);
        }, callback);
    }

    addSample(userId, languId, sample, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : sample.id,
                        creator: userId,
                        fileName: sample.fileName,
                        hash: sample.hash,
                        type: sample.type || ENTITY_TYPES.USER
                    };
                    this._unsafeInsert(TableNames.VcfSample, dataToInsert, trx, callback);
                },
                (sampleId, callback) => this._setSampleAnalyzed(sampleId, sample.isAnalyzed || false, trx, callback),
                (sampleId, callback) => this._addNewFileSampleVersion(sampleId, trx, (error, versionId) => {
                    callback(error, {
                        sampleId,
                        versionId
                    });
                }),
                (sampleObj, callback) => this._addFileSampleValues(trx, sampleObj.versionId, sample.values, (error) => {
                    callback(error, sampleObj.versionId);
                })
            ], callback);
        }, callback);
    }

    _setSampleAnalyzed(sampleId, value, trx, callback) {
        trx(TableNames.VcfSample)
            .where('id', sampleId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase({
                isAnalyzed: value,
                analyzedTimestamp: value ? new Date() : null
            }))
            .asCallback((error) => {
                callback(error, sampleId);
            });
    }

    _addNewFileSampleVersion(sampleId, trx, callback) {
        const dataToInsert = {
            id: this._generateId(),
            vcfFileSampleId: sampleId
        };
        this._unsafeInsert(TableNames.VcfSampleVersion, dataToInsert, trx, callback);
    }

    _addFileSampleValues(trx, versionId, values, callback) {
        async.map(values, (value, callback) => {
            const dataToInsert = {
                vcfFileSampleVersionId: versionId,
                fieldId: value.fieldId,
                values: value.values
            };
            this._unsafeInsert(TableNames.VcfFileSampleValue, dataToInsert, trx, callback);
        }, callback);
    }

    addView(userId, languId, view, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {

            console.log(view);
            async.waterfall([
                (callback) => this._ensureNameIsValid(view.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : view.id,
                        creator: userId,
                        name: view.name,
                        type: view.type || ENTITY_TYPES.USER
                    };
                    this._unsafeInsert(TableNames.View, dataToInsert, trx, callback);
                },
                (viewId, callback) => {
                    const dataToInsert = {
                        viewId: viewId,
                        languId: languId,
                        description: view.description
                    };
                    this._unsafeInsert(TableNames.ViewText, dataToInsert, trx, (error) => {
                        callback(error, viewId);
                    });
                },
                (viewId, callback) => {
                    this._addViewItems(viewId, view.viewListItems, trx, (error) => {
                        callback(error, viewId);
                    });
                }
            ], callback);
        }, callback);
    }

    _addViewItems(viewId, viewItems, trx, callback) {
        async.map(viewItems, (viewItem, callback) => {
            this._addViewItem(viewId, viewItem, trx, callback);
        }, callback);
    }

    _addViewItem(viewId, viewItem, trx, callback) {
        async.waterfall([
            (callback) => {
                if (!viewItem.fieldId){
                    callback(new Error('Can\'t add view item with no field id'));
                } else {
                    const dataToInsert = {
                        id: this._generateId(),
                        viewId: viewId,
                        fieldId: viewItem.fieldId,
                        order: viewItem.order,
                        sortOrder: viewItem.sortOrder,
                        sortDirection: viewItem.sortDirection,
                        filterControlEnable: viewItem.filterControlEnable || false
                    };
                    this._unsafeInsert(TableNames.ViewItem, dataToInsert, trx, callback);
                }
            },
            (viewItemId, callback) => {
                this._addViewKeywords(viewItemId, viewItem.keywords, trx, (error) => {
                    callback(error, viewItemId);
                });
            }
        ], callback);
    }

    _addViewKeywords(viewItemId, keywordIds, trx, callback) {
        async.map(keywordIds, (keywordId, callback) => {
            this._addViewKeyword(viewItemId, keywordId, trx, callback);
        }, callback);
    }

    _addViewKeyword(viewItemId, keywordId, trx, callback) {
        const dataToInsert = {
            viewItemId: viewItemId,
            keywordId: keywordId
        };
        this._unsafeInsert(TableNames.ViewItemKeywords, dataToInsert, trx, callback);
    }

    addLanguage(langu, callback){
        this.db.transactionally((trx, callback) => {
            this._unsafeInsert(TableNames.Lang, langu, trx, callback);
        }, (error) => {
            if (error) {
                callback(error);
            } else {
                callback(null, langu);
            }
        });
    }

    addUser(user, languId, shouldGenerateId, callback){
        const userToInsert = _.cloneDeep(user);
        userToInsert.id = shouldGenerateId ? this._generateId() : user.id;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._checkFieldsUnique(userToInsert, trx, callback),
                (callback) => {
                    const dataToInsert = {
                        id: userToInsert.id,
                        numberPaidSamples: userToInsert.numberPaidSamples,
                        email: userToInsert.email,
                        defaultLanguId: languId
                    };
                    this._unsafeInsert(TableNames.User,dataToInsert, trx, callback);
                },
                (userId, callback) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: userToInsert.name,
                        lastName: userToInsert.lastName,
                        speciality: userToInsert.speciality
                    };
                    this._unsafeInsert(TableNames.UserText, dataToInsert, trx, (error) => {
                        callback(error, userId);
                    });
                }
            ], callback);
        }, callback);
    }

    addKeyword(keyword, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._insertKeywordMetadata(trx, keyword, shouldGenerateId, callback),
                (keywordId, callback) => this._insertKeywordSynonyms(trx, keywordId, keyword.synonyms, true,
                    (error) => callback(error, keywordId))
            ], (error, keyword) => {
                callback(error, keyword);
            });
        }, callback);
    }

    _insertKeywordMetadata(trx, keywordMetadata, shouldGenerateId, callback) {
        const dataToInsert = {
            id: shouldGenerateId ? Uuid.v4() : keywordMetadata.id,
            fieldId: keywordMetadata.fieldId,
            value: keywordMetadata.value
        };
        this._unsafeInsert(TableNames.Keywords, dataToInsert, trx, (error, keywordId) => callback(error, keywordId));
    }

    _insertKeywordSynonyms(trx, keywordId, synonyms, shouldGenerateId, callback) {
        async.mapSeries(synonyms, (synonym, callback) => {
            const dataToInsert = {
                id: shouldGenerateId ? Uuid.v4() : synonym.id,
                languId: synonym.languId,
                keywordId,
                value: synonym.value
            };
            this._unsafeInsert(TableNames.Synonyms, dataToInsert, trx, callback);
        }, (error, synonyms) => {
            callback(error, synonyms);
        });
    }

    _checkFieldsUnique(user, trx, callback) {
        async.waterfall([
            (callback) => this._findIdsByEmailInTransaction(user.email, trx, (error, userIds) => {
                if (error) {
                    callback(error);
                } else if (userIds.length) {
                    callback(new Error('Duplicate e-mail.'));
                } else {
                    callback(null);
                }
            })
        ], callback);
    }

    _findIdsByEmailInTransaction(email, trx, callback) {
        async.waterfall([
            (callback) => trx.select('id')
                .from('user')
                .where('email', email)
                .asCallback(callback),
            (results, callback) => {
                if (results && results.length) {
                    callback(null, _.map(results, obj => obj.id));
                } else {
                    callback(null, []);
                }
            }
        ], callback);
    }

    addField(languId, metadata, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addFieldInTransaction(trx, languId, metadata, shouldGenerateId, callback);
        }, callback);
    }

    _addFieldInTransaction(trx, languId, metadata, shouldGenerateId, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: (shouldGenerateId ? this._generateId() : metadata.id),
                    name: metadata.name,
                    sourceName: metadata.sourceName,
                    valueType: metadata.valueType,
                    isMandatory: metadata.isMandatory,
                    isEditable: metadata.isEditable,
                    isInvisible: metadata.isInvisible,
                    dimension: metadata.dimension
                };
                this._unsafeInsert(TableNames.FieldMetadata,dataToInsert, trx, callback);
            },
            (metadataId, callback) => {
                const dataToInsert = {
                    fieldId: metadataId,
                    languId: languId,
                    description: metadata.description,
                    label: metadata.label
                };
                this._unsafeInsert(TableNames.FieldText, dataToInsert, trx, (error) => {
                    callback(error, metadataId);
                });
            },
            (metadataId, callback) => {
                this._addFieldAvailableValues(metadataId, metadata, shouldGenerateId, trx, (error) => {
                    callback(error, metadataId);
                });
            }
        ], callback);
    }

    _addFieldAvailableValues(metadataId, metadata, shouldGenerateId, trx, callback) {
        if (metadata.availableValues) {
            async.map(metadata.availableValues, (availableValue, callback) => {
                this._addFieldAvailableValue(metadataId, availableValue, shouldGenerateId, trx, callback);
            }, callback);
        } else {
            callback(null, metadataId);
        }
    }

    _addFieldAvailableValue(metadataId, availableValue, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: (shouldGenerateId ? this._generateId() : availableValue.id),
                    fieldId: metadataId
                };
                this._unsafeInsert(TableNames.FieldAvailableValue, dataToInsert, trx, callback);
            },
            (fieldAvailableValueId, callback) => {
                const dataToInsert = {
                    fieldAvailableValueId: fieldAvailableValueId,
                    languId: availableValue.languId,
                    value: availableValue.value
                };
                this._unsafeInsert(TableNames.FieldAvailableValueText, dataToInsert, trx, callback);
            }
        ], callback);
    }
}

module.exports = ImportDatabaseModel;