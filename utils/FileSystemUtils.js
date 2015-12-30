'use strict';

const _ = require('lodash');
const Fs = require('fs');
const Path = require('path');

class FileSystemUtils {
    static createDirectoryIfNotExists(directoryPath, callback) {
        Fs.mkdir(directoryPath, 0o777, (error) => {
            if (error && error.code !== 'EEXIST') {
                callback(error);
            } else {
                callback(null);
            }
        });
    }

    static getFileContentsAsString(fullPath) {
        return Fs.readFileSync(fullPath);
    }

    static writeStringToFile(fullPath, contents, callback) {
        Fs.writeFile(fullPath, contents, null, callback);
    }

    static getFileName(fullPath, extension) {
        return Path.basename(fullPath, extension);
    }

    static removeFile(filePath, callback) {
        Fs.unlink(filePath, callback);
    }

    /**
     * Executes callback with array of full paths for all files in the specified directory.
     * */
    static getAllFiles(inDirectory, withExtension, callback) {
        Fs.readdir(inDirectory, (error, directoryContents) => {
            if (error) {
                callback(error);
            } else {
                let itemsLeft = directoryContents.length;
                if (!itemsLeft) {
                    callback(null, []);
                } else {
                    const directoryFiles = [];
                    _.each(directoryContents, item => {
                        const itemFullPath = Path.resolve(inDirectory, item);
                        Fs.stat(itemFullPath, (error, itemStats) => {
                            if (error) {
                                callback(error);
                            } else if (itemStats.isFile() && itemFullPath.endsWith(withExtension)) {
                                directoryFiles.push(itemFullPath);
                            }

                            itemsLeft--;
                            if (!itemsLeft) {
                                callback(null, directoryFiles);
                            }
                        });
                    });
                }
            }
        });
    }
}

module.exports = FileSystemUtils;
