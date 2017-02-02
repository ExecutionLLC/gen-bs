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
        savedFilesButton: 'Saved Files'
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
        }
    },
    errors: {
        unexpectedErrorTitle: 'Unexpected Error',
        errorCode: 'Error code: %{errorCode}'
    },
    variantsTable: {
        addComment: 'Add comment',
        commentPlaceholder: 'Your comments here...',
        saveComment: 'Save',
        cancelComment: 'Cancel',
        empty: 'Results are empty!',
        headComment: 'Comment',
        loading: 'Loading...'
    }
};
