import * as AnalysisActions from './analysesHistory';
import * as FilterBuilderActions from './filterBuilder';
import * as ViewBuilderActions from './viewBuilder';
import * as UiActions from './ui';
import * as ModalActions from './modalWindows';
import * as VariantsTableActions from './variantsTable';
import * as SavedFilesActions from './savedFiles';

export default [
    AnalysisActions.REQUEST_ANALYSES_HISTORY,
    AnalysisActions.APPEND_ANALYSES_HISTORY,

    FilterBuilderActions.FBUILDER_CHANGE_ATTR,
    FilterBuilderActions.FBUILDER_CHANGE_FILTER,

    ViewBuilderActions.VBUILDER_CHANGE_ATTR,
    ViewBuilderActions.VBUILDER_ADD_COLUMN,
    ViewBuilderActions.VBUILDER_CHANGE_COLUMN,
    ViewBuilderActions.VBUILDER_DELETE_COLUMN,
    ViewBuilderActions.VBUILDER_CHANGE_SORT_COLUMN,

    UiActions.REQUEST_TABLE_SCROLL_POSITION_RESET,
    UiActions.COMPLETE_TABLE_SCROLL_POSITION_RESET,

    ModalActions.OPEN_MODAL,
    ModalActions.CLOSE_MODAL,

    VariantsTableActions.CHANGE_VARIANTS_GLOBAL_FILTER,
    VariantsTableActions.CHANGE_VARIANTS_LIMIT,
    VariantsTableActions.CHANGE_VARIANTS_SORT,
    VariantsTableActions.SET_FIELD_FILTER,
    VariantsTableActions.SET_VARIANTS_SORT,
    VariantsTableActions.CLEAR_SEARCH_PARAMS,
    VariantsTableActions.CLEAR_VARIANTS_ROWS_SELECTION,

    SavedFilesActions.CLOSE_SAVED_FILES_DIALOG,
    SavedFilesActions.SHOW_SAVED_FILES_DIALOG,
    SavedFilesActions.CREATE_EXPORT_DOWNLOAD,
    SavedFilesActions.RECEIVE_SAVED_FILES_LIST,
    SavedFilesActions.SAVED_FILE_DOWNLOAD_RESULT_RECEIVED,
    SavedFilesActions.SAVED_FILE_UPLOAD_RESULT_RECEIVED
];
