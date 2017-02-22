import _ from 'lodash';
import StoreTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

import FieldUtils from '../app/utils/fieldUtils';
import {
    viewBuilderStartEdit, viewBuilderRestartEdit, viewBuilderEndEdit,
    viewBuilderChangeAttr, viewBuilderChangeColumn, viewBuilderDeleteColumn, viewBuilderAddColumn
} from '../app/actions/viewBuilder';
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

    it('should end edit', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch([
                viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID),
                viewBuilderEndEdit()
            ]),
            stateMapperFunc
        }, (newState) => {
            expect(newState.vbuilder).toEqual(makeExpectingNewViewState(null, '', false, null));
            done();
        });
    });

    it('should change name and description', (done) => {
        const {newView, allowedFields} = initStore;

        const EDITED_NAME = 'edited view name';
        const EDITED_DESCRIPTION = 'edited view description';

        expect(EDITED_NAME).not.toBe(NEW_VIEW_NAME);

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            StoreTestUtils.runTest({
                globalInitialState: newState.initialAppState,
                applyActions: (dispatch) => dispatch(viewBuilderChangeAttr({name: EDITED_NAME}, LANGUAGE_ID)),
                stateMapperFunc
            }, (editedNameState) => {
                const expectingView = i18n.changeEntityText(newView, LANGUAGE_ID, {name: EDITED_NAME, description: undefined});
                expect(editedNameState.vbuilder.editingView).toEqual(expectingView);
                StoreTestUtils.runTest({
                    globalInitialState: editedNameState.initialAppState,
                    applyActions: (dispatch) => dispatch(viewBuilderChangeAttr({name: EDITED_NAME, description: EDITED_DESCRIPTION}, LANGUAGE_ID)),
                    stateMapperFunc
                }, (editedDescriptionState) => {
                    const expectingView = i18n.changeEntityText(newView, LANGUAGE_ID, {name: EDITED_NAME, description: EDITED_DESCRIPTION});
                    expect(editedDescriptionState.vbuilder.editingView).toEqual(expectingView);
                    done();
                });
            });
        });
    });

    it('should change column', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            const COLUMN_INDEX = 0;
            const currentFieldId = newState.vbuilder.editingView.viewListItems[COLUMN_INDEX].fieldId;
            const targetFieldId = _.find(allowedFields, listItem => listItem.fieldId !== currentFieldId);

            StoreTestUtils.runTest({
                globalInitialState: newState.initialAppState,
                applyActions: (dispatch) => dispatch(viewBuilderChangeColumn(COLUMN_INDEX, targetFieldId)),
                stateMapperFunc
            }, (editedColumnState) => {
                const expectingView = {
                    ...editedColumnState.vbuilder.editingView,
                    viewListItems: [
                        {
                            ...newView.viewListItems[0],
                            fieldId: targetFieldId,
                            keywords: []
                        },
                        ...newView.viewListItems.slice(1)
                    ]
                };
                expect(editedColumnState.vbuilder.editingView).toEqual(expectingView);
                expect(editedColumnState.vbuilder.editingView.viewListItems).not.toEqual(newState.vbuilder.editingView.viewListItems);
                done();
            });
        });
    });

    it('should delete column', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            const COLUMN_INDEX = 0;

            StoreTestUtils.runTest({
                globalInitialState: newState.initialAppState,
                applyActions: (dispatch) => dispatch(viewBuilderDeleteColumn(COLUMN_INDEX)),
                stateMapperFunc
            }, (editedColumnState) => {
                const expectingView = {
                    ...editedColumnState.vbuilder.editingView,
                    viewListItems: newView.viewListItems.slice(1)
                };
                expect(editedColumnState.vbuilder.editingView).toEqual(expectingView);
                expect(editedColumnState.vbuilder.editingView.viewListItems).not.toEqual(newState.vbuilder.editingView.viewListItems);
                done();
            });
        });
    });

    it('should add column', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            const COLUMN_INDEX = 0;
            const targetFieldId = allowedFields[0];

            StoreTestUtils.runTest({
                globalInitialState: newState.initialAppState,
                applyActions: (dispatch) => dispatch(viewBuilderAddColumn(COLUMN_INDEX, targetFieldId)),
                stateMapperFunc
            }, (editedColumnState) => {
                const expectingView = {
                    ...editedColumnState.vbuilder.editingView,
                    viewListItems: [
                        {
                            fieldId: targetFieldId,
                            keywords: []
                        },
                        ...newView.viewListItems
                    ]
                };
                expect(editedColumnState.vbuilder.editingView).toEqual(expectingView);
                expect(editedColumnState.vbuilder.editingView.viewListItems).not.toEqual(newState.vbuilder.editingView.viewListItems);
                done();
            });
        });
    });
});
