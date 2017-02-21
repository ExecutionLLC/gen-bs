import StoreTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

import FieldUtils from '../app/utils/fieldUtils';
import {viewBuilderStartEdit} from '../app/actions/viewBuilder';
import {entityType} from '../app/utils/entityTypes';
import * as i18n from '../app/utils/i18n';


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
        initialAppState: globalState,
        vbuilder: globalState.viewBuilder,
        newView: globalState.viewsList.hashedArray.array[0],
        allowedFields: allowedFields
    };
}

describe('View builder', () => {
    const initStore = stateMapperFunc(MOCK_APP_STATE);

    it('should start edit with existent view', (done) => {
        const newView = initStore.newView;
        const allowedFields = initStore.allowedFields;
        const languageId = 'en';

        expect(!!newView).toBe(true);
        expect(!!allowedFields).toBe(true);
        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, languageId)),
            stateMapperFunc
        }, (newState) => {
            const expectingEditingView = newView;
            expect(newState.vbuilder.editingView).toEqual(expectingEditingView);
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

    it('should start edit with new view', (done) => {
        const newView = initStore.newView;
        const newViewName = 'new view name';
        const allowedFields = initStore.allowedFields;
        const languageId = 'en';

        expect(!!newView).toBe(true);
        expect(!!allowedFields).toBe(true);
        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit({name: newViewName}, newView, allowedFields, languageId)),
            stateMapperFunc
        }, (newState) => {
            const expectingEditingView = i18n.setEntityText(
                {
                    ...newView,
                    type: entityType.USER,
                    id: null
                },
                {
                    ...i18n.getEntityText(newView, languageId),
                    name: newViewName
                }
            );
            expect(newState.vbuilder.editingView).toEqual(expectingEditingView);
            expect(newState.vbuilder).toEqual({
                editingView: expectingEditingView,
                originalView: expectingEditingView,
                editingViewIsNew: true,
                editingViewParentId: newView.id,
                allowedFields,
                isFetching: false
            });
            done();
        });
    });
});