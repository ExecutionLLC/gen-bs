import {addFilesForUpload} from '../app/actions/fileUpload';

import storeTestUtils from './storeTestUtils';
import {installMocks, expectCountByPredicate} from './jestUtils';

const testDate = new Date('2016-06-15T12:28:27.272Z');

xdescribe('Sample Upload', () => {
    beforeAll(() => {
        installMocks(console, {log: jest.fn()});
    });

    afterAll(() => {
        installMocks(console, {log: null});
    });

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

    it('should gzip files for upload', (done) => {
        const files = [
            createFile('file1.vcf', 'text/vcard'),
            createFile('file2.vcf', 'text/directory'),
            createFile('file3.vcf', 'application/binary')
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
            expectCountByPredicate(filesProcesses, proc => proc.file.type === 'application/gzip').toBe(3);
            done();
        });
    });

    it('should set error for unsupported files keeping supported ones', (done) => {
        const files = [
            createFile('file1.txt', 'text/plain'),
            createFile('file2.vcf.gz', 'application/gzip'),
            createFile('file3.json', 'application/json'),
            createFile('file4.txt', 'text/plain')
        ];
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(addFilesForUpload(files))
        }, (globalState) => {
            const {
                filesProcesses,
                processesWithError
            } = mapState(globalState);
            expect(filesProcesses.length).toBe(4);
            expect(processesWithError.length).toBe(3);

            done();
        });
    });

    it('should process mixed selections', (done) => {
        const files = [
            createFile('file1.vcf', 'text/vcard'),
            createFile('file2.vcf.gz', 'application/binary'),
            createFile('file3.vcf', 'text/directory'),
            createFile('file4.txt', 'text/plain')
        ];
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(addFilesForUpload(files))
        }, (globalState) => {
            const {filesProcesses, processesWithError} = mapState(globalState);
            expect(filesProcesses.length).toBe(4);
            expect(processesWithError.length).toBe(1);
            expectCountByPredicate(filesProcesses, proc => proc.file.type === 'application/gzip').toBe(2);

            done();
        });
    });
});

function createFile(name, type) {
    const size = 1024;
    const content = ((typeof Uint8Array !== 'undefined') ? new Uint8Array(size) : new Array(size))
        .fill(0)
        .map(() => Math.floor(Math.random() * 256));

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
