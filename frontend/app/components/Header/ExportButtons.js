import { setExportFileType } from '../../actions'

import store from '../../containers/App'
import { fileTypes } from '../../actions'

$( () => {

  $(document).on('click', '#header_dropdown_export_excel', (e) => {
    console.log('click excel', e.currentTarget);
    store.dispatch( setExportFileType( fileTypes.EXCEL ) )
  })

});
