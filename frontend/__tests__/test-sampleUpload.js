import {addFilesForUpload} from '../app/actions/fileUpload';

import storeTestUtils from './storeTestUtils';

const testDate = new Date('2016-06-15T12:28:27.272Z');

describe('Sample Upload', () => {
    it('should add gzipped files for upload', (done) => {
        const files = [
            createFile('file1.vcf.gz', 'application/gzip'),
            createFile('file2.vcf.gz', 'application/x-gzip'),
            createFile('file3.vcf.gz', 'application/binary')
        ];
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(addFilesForUpload(files))
        }, (globalState) => {
            const {
                filesProcesses,
                processesWithError
            } = mapState(globalState);
            expect(filesProcesses.length).toBe(3);
            expect(processesWithError.length).toBe(0);

            done();
        });
    });
});

function createFile(name, type) {
    const size = 1024;
    const content = (typeof Uint8Array !== 'undefined') ? new Uint8Array(size) : new Array(size);

    for (let i = content.length-1; i >= 0; i--) {
        content[i] = (Math.random(256) * 256) & 0xff;
    }

    return new File([content], name, {type, lastModified: testDate});
}

/**
 * {{
 * filesProcesses:Array,
 * processesWithError:Array
 * }}
 * */
function mapState(globalState) {
    const {
        fileUpload: {filesProcesses}
    } = globalState;

    return {
        filesProcesses,
        processesWithError: filesProcesses.filter(proc => proc.error)
    };
}
