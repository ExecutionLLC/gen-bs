import StoreTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

import FieldUtils from '../app/utils/fieldUtils';
import {viewBuilderStartEdit, viewBuilderRestartEdit} from '../app/actions/viewBuilder';
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

    const NEW_VIEW_NAME = 'new view name';
    const LANGUAGE_ID = 'en';

    function makeExpectedViewWithName(newView, name) {
        return i18n.setEntityText(
            {
                ...newView,
                type: entityType.USER,
                id: null
            },
            {
                ...i18n.getEntityText(newView, LANGUAGE_ID),
                name
            }
        );
    }

    function makeExpectingNewViewState(newView, viewId, isNew, allowedFields) {
        return {
            editingView: newView,
            originalView: newView,
            editingViewIsNew: isNew,
            editingViewParentId: viewId,
            allowedFields,
            isFetching: false
        };
    }

    it('shoult proper mock tests', () => {
        const {newView, allowedFields} = initStore;
        expect(!!newView).toBe(true);
        expect(!!allowedFields).toBe(true);
    });

    it('should start edit with existent view', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            expect(newState.vbuilder.editingView).toEqual(newView);
            expect(newState.vbuilder).toEqual(makeExpectingNewViewState(newView, newView.id, false, allowedFields));
            done();
        });
    });

    it('should start edit with new view', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit({name: NEW_VIEW_NAME}, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            const expectingView = makeExpectedViewWithName(newView, NEW_VIEW_NAME);
            expect(newState.vbuilder.editingView).toEqual(expectingView);
            expect(newState.vbuilder).toEqual(makeExpectingNewViewState(expectingView, newView.id, true, allowedFields));
            done();
        });
    });

    it('should restart edit with existent view', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch([
                viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID),
                viewBuilderRestartEdit(null, newView, LANGUAGE_ID)
            ]),
            stateMapperFunc
        }, (newState) => {
            expect(newState.vbuilder.editingView).toEqual(newView);
            expect(newState.vbuilder).toEqual(makeExpectingNewViewState(newView, newView.id, false, allowedFields));
            done();
        });
    });

    it('should restart edit with new view', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch([
                viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID),
                viewBuilderRestartEdit({name: NEW_VIEW_NAME}, newView, LANGUAGE_ID)
            ]),
            stateMapperFunc
        }, (newState) => {
            const expectingView = makeExpectedViewWithName(newView, NEW_VIEW_NAME);
            expect(newState.vbuilder.editingView).toEqual(expectingView);
            expect(newState.vbuilder).toEqual(makeExpectingNewViewState(expectingView, newView.id, true, allowedFields));
            done();
        });
    });
});