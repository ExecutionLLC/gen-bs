export default {
    common: {
        agx: 'АГ-икс'
    },
    samples: {
        title: 'Сэмплы',

        // left pane
        newSample: 'Новый сэмпл',
        newSampleDescription: 'Загрузите VCF-файл',
        uploaded: 'Загружено',
        selectForAnalysis: 'Выбрать для анализа',
        deleteSample: 'Удалить',
        error: {
            sampleNotFound: 'Сэмпл не найден в VCF-файле',
            unknown: 'Неизвестная ошибка'
        },
        loading: 'Загрузка...',
        saving: 'Сохранение...',

        // right pane
        loginOrRegister: 'Пожалуйста, войдите или зарегистрируйтесь, чтобы загружать новые сэмплы',
        editingSample: {
            descriptionPlaceholder: 'Описание сэмпла (опционально)',
            deleteSample: 'Удалить сэмпл',
            namePlaceholder: 'Имя сэмпла (обязательно для заполнения)',
            uploaded: 'Загружено',
            wait: 'Ожидайте. Загрузка',
            edit: 'Редактировать',
            registerToAnalyze: 'Пожалуйста, зарегистрируйтесь, чтобы выполнить анализ.',
            selectForAnalysis: 'Выбрать для анализа',
            save: 'Сохранить',
            cancel: 'Отмена'
        },
        dropAreaText: {
            dropVcfFileHereOr: 'Перетащите VCF-файлы сюда или ',
            clickHere: 'кликните',
            toSelect: ' чтобы выбрать'
        },
        rightPaneError: {
            title: 'Ошибка! ',
            description: '%{label} не загружен или поврежден'
        },
        rightPaneWait: {
            title: 'Ожидайте. ',
            description: 'Файл загружается'
        }
    },
    demoPopup: {
        caption: 'Гостевой режим',
        loginLinkPrefix: '',
        loginLinkLabel: 'Залогиньтесь',
        loginLinkSuffix: ', пожалуйста'
    },
    navBar: {
        auth: {
            login: 'Войти',
            logout: 'Выйти',
            authorizedUserTitle: '',
            demoUserTitle: 'Загеристрируйтесь или войдите для получения дополнительных возможностей',
            googleAccountTitle: 'Войдите через Гугл',
            dropdownHeader: 'Войти через',
            googleAccountCaption: 'Гугл',
            loginPasswordCaption: 'или с паролем'
        },
        exports: {
            formats: {
                sql: 'SQL',
                csv: 'CSV',
                txt: 'Текст'
            },
            popupHeader: 'Экспорт',
            popupCaption: 'Выберите формат экспортируемого файла'
        }
    }
};
