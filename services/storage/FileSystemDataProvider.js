const path = require('path');
const fs = require('fs');

const BaseDataProvider = require('./BaseDataProvider');

class FileSystemDataProvider extends BaseDataProvider{

    constructor(config, logger) {
        super(config, logger);
        const {savedFilesPath, newSamplesPath} = this.config.objectStorage.file;
        this._savedFilesPath = path.resolve(savedFilesPath);
        this._createDirectoryIfNotExists(this._savedFilesPath);
        this._newSamplesPath = path.resolve(newSamplesPath);
        this._createDirectoryIfNotExists(this._newSamplesPath);
    }

    getSamplePath(fileName) {
        return path.resolve(this._newSamplesPath,fileName);
    }
    removeSampleFile(fileName, callback) {
        const filePath = path.resolve(this._newSamplesPath,fileName);
        fs.unlink(filePath, callback)
    }
    addSampleFile(fileName, fileStream, callback) {
        const filePath = path.resolve(this._newSamplesPath,fileName);
        this._write_file(filePath, fileStream, callback);
    }

    addSavedFile(fileName, fileStream, callback) {
        const filePath = path.resolve(this._savedFilesPath,fileName);
        this._write_file(filePath, fileStream, callback);
    }

    _write_file(filePath, fileStream, callback) {
        var writeStream = fs.createWriteStream(filePath);
        fileStream.pipe(writeStream);
        callback(null);
    }

    getSavedFile(fileName, callback) {
        const filePath = path.resolve(this._savedFilesPath,fileName);
        if (fs.existsSync(filePath)) {
            callback(null, fs.createReadStream(filePath));
        }else {
            callback(new Error(`File ${fileName} doesn't exists`));
        }
    }

    _createDirectoryIfNotExists(directoryPath) {
        fs.mkdir(directoryPath, 0o777, (error) => {
            if (error && error.code !== 'EEXIST') {
                throw new Error(`Can't create folder ${directoryPath} : ${error}`);
            }
        });
    }
}

module.exports = FileSystemDataProvider;