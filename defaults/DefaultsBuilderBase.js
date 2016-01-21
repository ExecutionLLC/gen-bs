'use strict';

const _ = require('lodash');

const FsUtils = require('../utils/FileSystemUtils');

class DefaultsBuilderBase {
    constructor() {
        this.defaultsDir = __dirname;
        this.asSamplesDir = this.defaultsDir + '/templates/samples'; // Here AS default sample metadata files are stored.
        this.samplesDir = this.defaultsDir + '/samples'; // Output directory for converted samples.
        this.sourcesDir = this.defaultsDir + '/sources'; // Output directory for sources metadata.
        this.fieldMetadataDir = this.defaultsDir + '/fields'; // Output directory for field metadata.
        this.fieldMetadataFile = this.fieldMetadataDir + '/fields-metadata.json'; // Result of field aggregation.
        this.asSourcesDir = this.defaultsDir + '/templates/sources'; // AS sample metadata.
        this.viewsDir = this.defaultsDir + '/views'; // Output directory for default views.
        this.filtersDir = this.defaultsDir + '/filters'; // Output directory for default filters.
        this.requiredFieldsFile = this.defaultsDir + '/templates/metadata/required-metadata.json'; // Metadata of the mandatory VCF fields.
        this.editableFieldsFile = this.defaultsDir + '/templates/metadata/editable-metadata.json'; // Metadata of the editable fields, which are used in the UI and WS only.
    }

    _removeJsonFilesFromDirectory(directory, callback) {
        FsUtils.getAllFiles(directory, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                let itemsLeft = files.length;
                if (!itemsLeft) {
                    callback(null);
                } else {
                    _.each(files, file => FsUtils.removeFile(file, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            itemsLeft--;
                            if (!itemsLeft) {
                                callback(null);
                            }
                        }
                    }));
                }
            }
        });
    }

    _getMetadataFilePath(sourceName) {
        return this.samplesDir + '/' + sourceName + '.json';
    }
}

module.exports = DefaultsBuilderBase;