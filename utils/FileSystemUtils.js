'use strict';

const _ = require('lodash');
const Fs = require('fs');
const Path = require('path');

class FileSystemUtils {
    static getFileContentsAsString(fullPath) {
        return Fs.readFileSync(fullPath);
    }

    static getFileName(fullPath) {
        return Path.basename(fullPath);
    }

    /**
     * Executes callback with array of full paths for all files in the specified directory.
     * */
    static forAllFiles(inDirectory, withExtension, callback) {
        Fs.readdir(inDirectory, (error, directoryContents) => {
            if (error) {
                callback(error);
            } else {
                let itemsLeft = directoryContents.length;
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
        });
    }
}

module.exports = FileSystemUtils;
