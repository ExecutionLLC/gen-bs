import HttpStatus from 'http-status';
import _ from 'lodash';
import StoreTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

import FieldUtils from '../app/utils/fieldUtils';
import {
    viewBuilderStartEdit, viewBuilderRestartEdit, viewBuilderEndEdit,
    viewBuilderChangeAttr, viewBuilderChangeColumn, viewBuilderDeleteColumn, viewBuilderAddColumn,
    viewBuilderChangeSortColumn, viewBuilderChangeKeywords,
    viewBuilderDeleteView
} from '../app/actions/viewBuilder';
import {entityType} from '../app/utils/entityTypes';
import * as i18n from '../app/utils/i18n';
import apiFacade from '../app/api/ApiFacade';
import immutableArray from '../app/utils/immutableArray';


const {viewsClient} = apiFacade;


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
        deletingView: globalState.viewsList.hashedArray.array[1],
        viewsList: globalState.viewsList.hashedArray.array,
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
        const {newView, allowedFields, deletingView} = initStore;
        expect(!!newView).toBe(true);
        expect(!!allowedFields).toBe(true);
        expect(!!deletingView).toBe(true);
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

    it('should make column sorting', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {

            function removeAllSortedColumns(state, done) {
                const view = state.vbuilder.editingView;
                const sortedColumnIndex = _.findIndex(view.viewListItems, item => item.sortOrder || item.sortDirection);
                if (sortedColumnIndex < 0) {
                    done(state);
                } else {
                    StoreTestUtils.runTest({
                        globalInitialState: state.initialAppState,
                        applyActions: (dispatch) => dispatch(viewBuilderDeleteColumn(sortedColumnIndex)),
                        stateMapperFunc
                    }, (newState) => {
                        removeAllSortedColumns(newState, done);
                    });
                }
            }

            removeAllSortedColumns(newState, (notSortedState) => {
                const view = notSortedState.vbuilder.editingView;
                const sortedFieldByOrder = _.find(view.viewListItems, item => item.sortOrder);
                const sortedFieldByDirection = _.find(view.viewListItems, item => item.sortDirection);
                expect(sortedFieldByOrder).toBe(undefined);
                expect(sortedFieldByDirection).toBe(undefined);

                const fieldToAdd1 = _.find(allowedFields, (field) => !_.find(view.viewListItems, {fieldId: field.id}));
                const fieldToAdd2 = _.find(allowedFields, (field) => field.id !== fieldToAdd1.id && !_.find(view.viewListItems, {fieldId: field.id}));
                expect(fieldToAdd1).not.toBe(undefined);
                expect(fieldToAdd2).not.toBe(undefined);
                expect(fieldToAdd1.id).not.toBe(fieldToAdd2.id);

                StoreTestUtils.runTest({
                    globalInitialState: notSortedState.initialAppState,
                    applyActions: (dispatch) => dispatch([
                        viewBuilderAddColumn(0, fieldToAdd1.id),
                        viewBuilderAddColumn(1, fieldToAdd2.id)
                    ]),
                    stateMapperFunc
                }, (newState) => {

                    const initialColumns = [...newState.vbuilder.editingView.viewListItems];

                    /**
                     * Test cases:
                     * 1. Field is not sorted
                     * 1.1. Sorting order does not exist
                     * > 1.1.1. Sorting order 1 exist - (desired sorting order is not 1) make new sorting with desired sorting order (what is not 1, 1 exist)
                     * > 1.1.2. Sorting order 1 does not exist - make new sorting with sorting order 1
                     * 1.2. Sorting order exist
                     * > 1.2.1. Sorting order 1 exist - deleting existent sorting with desired order, make new sorting with desired sorting order
                     * > 1.2.2. Sorting order 1 does not exist - (desired sorting order is not 1) deleting existent sorting with desired order, make new sorting with desired sorting order
                     * 2. Field is sorted
                     * 2.1. Desired direction is null
                     * > 2.1.1. Field has sorting order 1 and there is field with sorting order 2 - remove field direction and sorting order, make field with sorting order 2 sorting order 1
                     * > 2.1.2. Field has no sorting order 1 or there is no field with sorting order 2 - remove field direction and sorting order
                     * > 2.2. Desired sorting order is not null - set field desired sorting direction (leave order intact)
                     *
                     * Checking order:
                     * not sorted
                     * 1.1.2
                     * sorted some field order 1
                     * 1.2.1
                     * sorted other field order 1
                     * 2.2
                     * changed direction order 1
                     * 1.1.1
                     * sorted two fields
                     * 2.1.1
                     * sorted only order 1 field that was with order 2
                     * 2.1.2
                     * not sorted
                     */

                    StoreTestUtils.runTest({
                        globalInitialState: newState.initialAppState,
                        applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd1.id, null, false)),
                        stateMapperFunc
                    }, (newState) => {
                        const expectingViewListItems = [
                            {
                                fieldId: fieldToAdd1.id,
                                keywords: [],
                                sortDirection: 'asc',
                                sortOrder: 1
                            },
                            ...initialColumns.slice(1)
                        ];
                        expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                        StoreTestUtils.runTest({
                            globalInitialState: newState.initialAppState,
                            applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd2.id, null, false)),
                            stateMapperFunc
                        }, (newState) => {
                            const expectingViewListItems = [
                                {
                                    fieldId: fieldToAdd1.id,
                                    keywords: [],
                                    sortDirection: null,
                                    sortOrder: null
                                },
                                {
                                    fieldId: fieldToAdd2.id,
                                    keywords: [],
                                    sortDirection: 'asc',
                                    sortOrder: 1
                                },
                                ...initialColumns.slice(2)
                            ];
                            expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                            StoreTestUtils.runTest({
                                globalInitialState: newState.initialAppState,
                                applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd2.id, 'asc', false)),
                                stateMapperFunc
                            }, (newState) => {
                                const expectingViewListItems = [
                                    {
                                        fieldId: fieldToAdd1.id,
                                        keywords: [],
                                        sortDirection: null,
                                        sortOrder: null
                                    },
                                    {
                                        fieldId: fieldToAdd2.id,
                                        keywords: [],
                                        sortDirection: 'desc',
                                        sortOrder: 1
                                    },
                                    ...initialColumns.slice(2)
                                ];
                                expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                                StoreTestUtils.runTest({
                                    globalInitialState: newState.initialAppState,
                                    applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd1.id, null, true)),
                                    stateMapperFunc
                                }, (newState) => {
                                    const expectingViewListItems = [
                                        {
                                            fieldId: fieldToAdd1.id,
                                            keywords: [],
                                            sortDirection: 'asc',
                                            sortOrder: 2
                                        },
                                        {
                                            fieldId: fieldToAdd2.id,
                                            keywords: [],
                                            sortDirection: 'desc',
                                            sortOrder: 1
                                        },
                                        ...initialColumns.slice(2)
                                    ];
                                    expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                                    StoreTestUtils.runTest({
                                        globalInitialState: newState.initialAppState,
                                        applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd2.id, 'desc', false)),
                                        stateMapperFunc
                                    }, (newState) => {
                                        const expectingViewListItems = [
                                            {
                                                fieldId: fieldToAdd1.id,
                                                keywords: [],
                                                sortDirection: 'asc',
                                                sortOrder: 1
                                            },
                                            {
                                                fieldId: fieldToAdd2.id,
                                                keywords: [],
                                                sortDirection: null,
                                                sortOrder: null
                                            },
                                            ...initialColumns.slice(2)
                                        ];
                                        expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                                        StoreTestUtils.runTest({
                                            globalInitialState: newState.initialAppState,
                                            applyActions: (dispatch) => dispatch(viewBuilderChangeSortColumn(fieldToAdd1.id, 'desc', false)),
                                            stateMapperFunc
                                        }, (newState) => {
                                            const expectingViewListItems = [
                                                {
                                                    fieldId: fieldToAdd1.id,
                                                    keywords: [],
                                                    sortDirection: null,
                                                    sortOrder: null
                                                },
                                                {
                                                    fieldId: fieldToAdd2.id,
                                                    keywords: [],
                                                    sortDirection: null,
                                                    sortOrder: null
                                                },
                                                ...initialColumns.slice(2)
                                            ];
                                            expect(newState.vbuilder.editingView.viewListItems).toEqual(expectingViewListItems);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('should change keywords', (done) => {
        const {newView, allowedFields} = initStore;

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch(viewBuilderStartEdit(null, newView, allowedFields, LANGUAGE_ID)),
            stateMapperFunc
        }, (newState) => {
            const COLUMN_INDEX = 0;
            const KEYWOORDS_IDS = ['keyword1', 'keyword2'];

            StoreTestUtils.runTest({
                globalInitialState: newState.initialAppState,
                applyActions: (dispatch) => dispatch(viewBuilderChangeKeywords(COLUMN_INDEX, KEYWOORDS_IDS)),
                stateMapperFunc
            }, (editedColumnState) => {
                const expectingView = {
                    ...editedColumnState.vbuilder.editingView,
                    viewListItems: [
                        {
                            ...newView.viewListItems[0],
                            keywords: KEYWOORDS_IDS
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

    it('should delete view', (done) => {
        const {deletingView, allowedFields} = initStore;

        viewsClient.remove = (viewId, callback) => {
            return callback(null, {status: HttpStatus.OK, body: {id: viewId}});
        };

        const deletingViewIndex = _.findIndex(initStore.viewsList, {id: deletingView.id});
        expect(deletingViewIndex).not.toBe(-1);

        StoreTestUtils.runTest({
            globalInitialState: initStore.initialAppState,
            applyActions: (dispatch) => dispatch([
                viewBuilderStartEdit(null, deletingView, allowedFields, LANGUAGE_ID),
                viewBuilderDeleteView(deletingView.id, LANGUAGE_ID)
            ]),
            stateMapperFunc
        }, (newState) => {
            expect(newState.viewsList).toEqual(immutableArray.remove(initStore.viewsList, deletingViewIndex));
            expect(!!newState.vbuilder.editingView).toBe(true);
            expect(newState.vbuilder.editingView).not.toBe(deletingView);
            expect(newState.vbuilder.editingView.id).not.toBe(deletingView.id);
            delete viewsClient.remove;
            done();
        });
    });
});
