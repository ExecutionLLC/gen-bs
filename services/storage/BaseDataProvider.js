class BaseDataProvider{

    constructor(config, logger) {
        this._config = config;
        this._logger = logger;
    }

    get logger() {
        return this._logger;
    }

    get config() {
        return this._config;
    }

    addSampleFile(fileName, fileStream, callback){
        throw new Error('Not implemented.');
    }

    removeSampleFile(fileName, callback){
        throw new Error('Not implemented.');
    }

    getSamplePath(fileName){
        throw new Error('Not implemented.');
    }

    addSavedFile(fileName, fileStream, callback){
        throw new Error('Not implemented.');
    }

    getSavedFile(fileName, callback){
        throw new Error('Not implemented.');
    }
}

module.exports = BaseDataProvider;