// import HttpStatus from 'http-status';
// import _ from 'lodash';
//
// import {ImmutableHashedArray} from '../app/utils/immutable';
import StoreTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
// import apiFacade from '../app/api/ApiFacade';
// import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';
// import {runListedObjectTests} from './HashedArrayDataUtils';
import FieldUtils from '../app/utils/fieldUtils';
import {viewBuilderStartEdit} from '../app/actions/viewBuilder';

function stateMapperFunc(globalState) {
    const fields = globalState.fields;
    const samples = [
        globalState.samplesList.hashedArray.array[0],
        globalState.samplesList.hashedArray.array[1]
    ];
    const languageId = globalState.ui.languageId;
    const samplesFields = samples.map((sample) => FieldUtils.getSampleFields(sample, fields.totalFieldsHashedArray.hash).filter(f => !!f));

    const allowedFields = FieldUtils.makeAllowedFieldsForSamplesFields(samplesFields, fields.sourceFieldsList, languageId).filter((field) => !field.isInvisible);
    return {
        vbuilder: globalState.viewBuilder,
        newView: globalState.viewsList.hashedArray.array[0],
        allowedFields: allowedFields
    };
}

describe('View builder', () => {
    const initStore = stateMapperFunc(MOCK_APP_STATE);

    it('should start edit', (done) => {
        const newView = initStore.newView;
        //const newViewName = 'new view name';
        const allowedFields = initStore.allowedFields;
        const languageId = 'en';

        expect(!!newView).toBe(true);
        expect(!!allowedFields).toBe(true);
        StoreTestUtils.runTest({
            globalInitialState: MOCK_APP_STATE,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, languageId)),
            stateMapperFunc
        }, (newState) => {
            const expectingEditingView = newView;
            expect(newState.vbuilder).toEqual({
                editingView: expectingEditingView,
                originalView: expectingEditingView,
                editingViewIsNew: false,
                editingViewParentId: newView.id,
                allowedFields,
                isFetching: false
            });
            done();
        });
    });
});