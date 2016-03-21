import '../../assets/vendor/tableExport/tableExport'
import '../../assets/vendor/tableExport/jquery.base64'
import '../../assets/vendor/fileSaver/FileSaver'

import observeStore from '../../utils/observeStore'

import { exportToFile } from '../../actions'

import store from '../../containers/App'
import { fileTypes } from '../../actions'

/**
 * POJO with attrs and methods for ExportToFile
 */
var exportFilenameForm = {

    selectExport: state => state.exportToFile,

    subscribeToSubmit: function () {
        $(document).on('click', '#modal_export_button', (e) => {
            //var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});

            //const blob = $('#variants_table').tableExport({type:'csv',escape:'false', consoleLog: 'false'});
            const fileName = $('#filename input[name="filename[name]"]').val();
            const fileType = $('#filename select[name="filename[filetype]"]').val();

            //saveAs(blob, filename);
            store.dispatch(exportToFile(fileTypes[fileType], fileName))
        })
    },

    getInitialState: function () {
        exportFilenameForm.subscribeToSubmit();
        observeStore(store, this.selectExport, () => {
            if (store.getState().exportToFile.blob !== null) {
                saveAs(store.getState().exportToFile.blob, store.getState().exportToFile.name);
            }
        });
    }
};

$(() => {

    const fileName = $('#filename input[name="filename[name]"]').val(`[Sample name]'s Selected Mutations ${new Date()}`);

    exportFilenameForm.getInitialState();
});
