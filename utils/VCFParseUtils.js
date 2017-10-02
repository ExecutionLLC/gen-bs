'use strict';

const _ = require('lodash');
const pako = require('pako');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');

class VCFParseUtils {

    static parseSampleNames(sampleFile, callback) {
        fs.readFile(sampleFile.path, (error, content) => {
            if (error) {
                callback(error);
            } else {
                try {
                    const uint8data = pako.inflate(content);
                    const decoder = new StringDecoder('utf8');
                    const text = decoder.write(Buffer.from(uint8data));
                    const {error, samples} = VCFParseUtils._findSamples(text);
                    callback(error, samples);
                } catch (error) {
                    callback(error);
                }
            }
        });
    }

    static _findSamples(text) {
        const found = text.match(/^#[^#].*/gm);
        if (found && found.length) {
            const columns_line = found[0].substr(1);
            const array = columns_line && columns_line.split(/\t/);
            const VCF_COLUMNS = ['CHROM', 'POS', 'ID', 'REF', 'ALT', 'QUAL', 'FILTER', 'INFO', 'FORMAT'];
            if (!_.every(VCF_COLUMNS, mandatoryColumn => _.includes(array, mandatoryColumn))) {
                return {
                    error: 'Unknown columns header format',
                    samples: []
                };
            } else {
                return {
                    error: null,
                    samples: _.difference(array, VCF_COLUMNS)
                };
            }
        } else {
            return {
                error: 'Corrupted VCF header',
                samples: []
            };
        }
    }

}

module.exports = VCFParseUtils;
