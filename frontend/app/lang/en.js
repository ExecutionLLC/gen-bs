export default {
    common: {
        agx: 'AGx'
    },
    samples: {
        title: 'Samples',

        // left pane
        newSample: 'New sample',
        newSampleDescription: 'Upload VCF file',
        uploaded: 'Uploaded',
        selectForAnalysis: 'Select for analysis',
        deleteSample: 'Delete',
        error: {
            sampleNotFound: 'The sample is not found in VCF',
            unknown: 'Unknown error'
        },
        loading: 'Loading..', // TODO: ..->...
        saving: 'Saving...',

        // right pane
        loginOrRegister: 'Please login or register to upload new samples',
        editingSample: {
            descriptionPlaceholder: 'Sample description (optional)',
            deleteSample: 'Delete sample',
            namePlaceholder: 'Sample name (it can\'t be empty)',
            uploaded: 'Uploaded',
            wait: 'Wait. Saving',
            edit: 'Edit',
            registerToAnalyze: 'Please register to analyze this sample.',
            selectForAnalysis: 'Select for analysis',
            save: 'Save',
            cancel: 'Cancel'
        },
        dropAreaText: {
            dropVcfFileHereOr: 'Drop VCF files here or ', // TODO: double 'here'
            clickHere: 'click here',
            toSelect: ' to select'
        },
        rightPaneError: {
            title: 'Error! ',
            description: '%{label} not loaded or damaged'
        },
        rightPaneWait: {
            title: 'Wait. ',
            description: 'File is loading'
        },
        errors: {
            updateSampleFieldsError: 'We are really sorry, but there is an error while updating sample fields.' +
                ' Be sure we are working on resolving the issue. You can also try to reload page and try again.',
            fetchSamplesError: 'We are really sorry, but there is an error while getting the list of samples' +
                ' from our server. Be sure we are working on resolving the issue. You can also try to reload page and try again.',
            deleteSampleError: 'We are really sorry, but there is an error while deleting sample.' +
                ' Be sure we are working on resolving the issue. You can also try to reload page and try again.'
        }
    },
    demoPopup: {
        caption: 'Demo Mode',
        loginLinkPrefix: 'Please ',
        loginLinkLabel: 'login',
        loginLinkSuffix: ''
    },
    navBar: {
        auth: {
            login: 'Login',
            logout: 'Logout',
            loginPlaceholder: 'Login',
            passwordPlaceholder: 'Password',
            authorizedUserTitle: '',
            demoUserTitle: 'Register or login for access additional features',
            googleAccountTitle: 'Login using Google Account',
            dropdownHeader: 'Login with',
            googleAccountCaption: 'Google Account',
            loginPasswordCaption: 'OR login'
        },
        exports: {
            formats: {
                sql: 'SQL',
                csv: 'CSV',
                txt: 'Text'
            },
            popupHeader: 'Export',
            popupCaption: 'Select export format'
        },
        searchPlaceholder: 'Search for mutations of current sample analysis',
        samplesButton: 'Samples',
        analysesButton: 'Analyses',
        savedFilesButton: 'Saved Files',
        selectLanguageTitle: 'Select language'
    },
    analysis: {
        title: 'Analyses',

        leftPane: {
            searchPlaceHolder: 'Search for analyses name or description',
            newAnalysis: 'New analysis',
            newAnalysisDescription: 'Customize the settings for new analysis'
        },
        rightPane: {
            deleteAnalysis: 'Delete analysis',
            analysisNamePlaceHolder: 'Analysis name (it can\'t be empty)',
            created: 'Created',
            analysisDescriptionPlaceHolder: 'Analysis description (optional)',
            duplicate: 'Duplicate to make changes',
            analysisType: {
                single: 'Single',
                tumor: 'Tumor/Normal',
                family: 'Family'
            },
            sampleType: {
                single: 'Single',
                tumor: 'Tumor',
                normal: 'Normal',
                proband: 'Proband',
                mother: 'Mother',
                father: 'Father'
            },
            sampleTypeAbbr: {
                single: 'S',
                tumor: 'T',
                normal: 'N',
                proband: 'P',
                mother: 'M',
                father: 'F'
            },
            content: {
                sample: 'Sample',
                samples: 'Samples',
                filter: 'Filter',
                filters: 'Filters',
                model: 'Model',
                models: 'Models',
                view: 'View',
                views: 'Views',
                analyze: 'Analyze',
                restoreToDefault: 'Restore to default',
                analysisType: 'Analysis type',
                duplicate: 'Duplicate',
                viewResults: 'View results'
            }
        },
        copyOf: 'Copy of %{name}',
        descriptionOf: 'Description of %{name}',
        error: {
            historyError: 'Cannot update analyses history. Please try again.',
            getSampleNetworkError: 'Cannot get sample (network error). Please try again.',
            getSampleServerError: 'Cannot get sample (server error). Please try again.',
            getViewError: 'Cannot get view. Please try again.',
            getFilterError: 'Cannot get filter. Please try again.',
            getModelError: 'Cannot get model. Please try again.'
        }
    },
    errors: {
        errorTitle: 'Error',
        unexpectedErrorTitle: 'Unexpected Error',
        errorCode: 'Error code: %{errorCode}',
        unknownError: 'Unknown error',
        buttonClose: 'Close',
        /*
         * login errors
         */
        sessionIsEmpty: 'Session id is empty',
        loginError: 'Authorization failed. You can reload page and try again.',
        loginGoogleError: 'Google authorization failed.',
        closeAllUserSessionError: 'Error while closing all user sessions.',
        closeOtherSocketsError: 'Error while closing other sockets. Please reload page and try again.',
        /*
         * field errors
         */
        totalFieldsNetworkError: 'Cannot get list of all fields (network error). You can reload page and try again.',
        totalFieldsServerError: 'Cannot get list of all fields (server error). You can reload page and try again.',
        /*
         * file upload errors
         */
        deleteUploadError: 'We are really sorry, but there is an error while deleting upload.' +
            ' Be sure we are working on resolving the issue. You can also try to reload page and try again.',
        /*
         * user data errors
         */
        fetchUserDataNetworkError: 'Cannot load user data. You can reload page and try again.',
        cannotFindDefaultItemsError: 'Cannot determine set of default settings (sample, view, filter). ' +
            'You can try to set sample, filter, view by hand or try to reload page.'
    },
    variantsTable: {
        addComment: 'Add comment',
        commentPlaceholder: 'Your comments here...',
        saveComment: 'Save',
        cancelComment: 'Cancel',
        empty: 'Results are empty!',
        headComment: 'Comment',
        loading: 'Loading...',
        errors: {
            analyzeSampleError: 'Cannot analyze data. Please try again.',
            nextDataError: 'Cannot get next part of data. Please try again.',
            searchInResultsError: 'Cannot analyze results. Please try again.', // TODO: doubtful description
            addCommentError: 'Cannot add commentary. Please try again.',
            updateCommentError: 'Cannot update commentary. Please try again.',
            deleteCommentError: 'Cannot delete commentary. Please try again.'
        }
    },
    savedFiles: {
        title: 'Saved Files',
        registerCaption: 'Please register to access your saved files here.',
        emptyCaption: 'Here will be the files you have exported, but there are no such files for now.',
        headerDate: 'Date',
        headerSample: 'Sample',
        headerFilter: 'Filter',
        headerView: 'View',
        headerModel: 'Model',
        buttonDownload: 'Download',
        errors: {
            uploadError: 'Error while uploading exported file',
            downloadError: 'Error downloading exported file'
        }
    },
    anotherPageOpened: {
        title: 'Another Page is Active',
        text: {
            prefix: 'Please ',
            link: 'click here',
            suffix: ' to use Alapy Genomics Explorer in this window. All other opened windows will be logged off/stopped and all running processes terminated. Your account supports only one session to be open at a time'
        },
        waitCaption: 'Please, wait a moment...',
        buttonUseHere: 'Use Here'
    },
    autoLogout: {
        title: 'Auto Logout',
        text: 'Your session will be automatically closed after %{secs} seconds.',
        buttonExtend: 'Extend session'
    },
    closeAllSessions: {
        title: 'Other Session is Opened',
        text: 'We have another your session opened. If you want to close it and start a new one here, please press the button below or just close the dialog.',
        buttonClose: 'Close Other Session'
    },
    filterAndModel: {
        texts: {
            filters: {
                header: 'Setup Filters',
                noRulesToSetup: 'This filter has no rules to setup',
                existentSelect: {
                    title: 'Available Filters',
                    duplicate: 'Duplicate',
                    reset: 'Reset Filter',
                    deleteItem: 'Delete Filter'
                },
                validationMessage: {
                    nameAlreadyExists: 'Filter with this name is already exists.',
                    empty: 'Name cannot be empty',
                    lengthExceeded: 'Name length should be less than %{maxLength}'
                },
                newInputs: {
                    newCaption: 'New Filter',
                    namePlaceholder: 'Set filter name',
                    description: 'Description',
                    descriptionPlaceholder: 'Set filter description (optional)'
                },
                readOnlyReason: {
                    historyEntity: 'This filter is history filter, duplicate it to make changes.',
                    notEditable: 'This filter is not editable, duplicate it to make changes.',
                    forRegisteredUsers: ' (Only for registered users)'
                },
                loginRequiredMsg: 'Login or register to select advanced filters',
                loginToWork: 'Login or register to work with filter',
                makeCopy: 'Make a copy for editing'
            },
            models: {
                header: 'Setup Models',
                noRulesToSetup: 'This model has no rules to setup',
                existentSelect: {
                    title: 'Available Models',
                    duplicate: 'Duplicate',
                    reset: 'Reset Model',
                    deleteItem: 'Delete Model'
                },
                validationMessage: {
                    nameAlreadyExists: 'Filter with this name is already exists.',
                    empty: 'Name cannot be empty',
                    lengthExceeded: 'Name length should be less than %{maxLength}'
                },
                newInputs: {
                    newCaption: 'New Model',
                    namePlaceholder: 'Set model name',
                    description: 'Description',
                    descriptionPlaceholder: 'Set model description (optional)'
                },
                readOnlyReason: {
                    historyEntity: 'This model is history model, duplicate it to make changes.',
                    notEditable: 'This model is not editable, duplicate it to make changes.',
                    forRegisteredUsers: ' (Only for registered users)'
                },
                loginRequiredMsg: 'Login or register to select advanced models',
                loginToWork: 'Login or register to work with model',
                makeCopy: 'Make a copy for editing'
            }
        },
        modelMismatch: 'Model analysis type mismatch',
        rulesGroupHeader: {
            addButton: {
                addRule: 'Add rule',
                addGroup: 'Add group',
                deleteItem: 'Delete'
            },
            radioButton: {
                and: 'AND',
                or: 'OR'
            }
        },
        ruleContainer: {
            deleteItem: 'Delete'
        },
        rulesConditions: {
            equal: 'equal',
            not_equal: 'not equal',
            in: 'in',
            not_in: 'not in',
            less: 'less',
            less_or_equal: 'less or equal',
            greater: 'greater',
            greater_or_equal: 'greater or equal',
            between: 'between',
            not_between: 'not between',
            begins_with: 'begins with',
            not_begins_with: "doesn't begin with",
            contains: 'contains',
            not_contains: "doesn't contain",
            ends_with: 'ends with',
            not_ends_with: "doesn't end with",
            is_null: 'is null',
            is_not_null: 'is not null'
        },
        saveAndSelect: 'Save and Select',
        select: 'Select',
        cancel: 'Cancel',
        copyOf: 'Copy of %{name}',
        loginRequiredMsg: 'Login or register to select advanced %{filtersOrModels}',
        errors: {
            createFilterError: 'Cannot create new filter. Please try again.',
            updateFilterError: 'Cannot update filter. Please try again.',
            deleteFilterError: 'Cannot delete filter. Please try again.',
            createModelError: 'Cannot create new model. Please try again.',
            updateModelError: 'Cannot update model. Please try again.',
            deleteModelError: 'Cannot delete model. Please try again.'
        }
    },
    view: {
        existentViewSelect: {
            title: 'Available Views',
            duplicate: 'Duplicate',
            reset: 'Reset View',
            deleteItem: 'Delete View'
        },
        saveAndSelect: 'Save and Select',
        select: 'Select',
        cancel: 'Cancel',
        loginRequiredMsg: 'Login or register to select advanced view',
        loginToWork: 'Login or register to work with view',
        makeCopy: 'Make a copy for editing',
        header: {
            title: 'Setup Views'
        },
        newViewInputs: {
            newView: 'New View',
            namePlaceholder: 'Set view name',
            description: 'Description',
            descriptionPlaceholder: 'Set view description (optional)'
        },
        keywordSelector: {
            placeholder: {
                chooseKeywords: 'Choose keywords',
                noKeywords: 'No keywords defined for the field'
            }
        },
        viewBuilder: {
            title: 'Table Columns',
            columnsSorting: 'Column Name and Sort Order',
            columnsFilter: 'Keywords'
        },
        copyOf: 'Copy of %{name}',
        readOnlyReason: {
            historyEntity: 'This view is history view, duplicate it to make changes.',
            notEditable: 'This view is not editable, duplicate it to make changes.',
            forRegisteredUsers: ' (Only for registered users)'
        },
        orderTitle: 'Desc/Asc',
        errors: {
            createViewNetworkError: 'Cannot create new view (network error). Please try again.',
            createViewServerError: 'Cannot create new view (server error). Please try again.',
            updateViewNetworkError: 'Cannot update view (network error). Please try again.',
            updateViewServerError: 'Cannot update view (server error). Please try again.',
            deleteViewNetworkError: 'Cannot delete view (network error). Please try again.',
            deleteViewServerError: 'Cannot delete view (server error). Please try again.'
        }
    },
    historyEntity: '%{name} (from history)'
};
