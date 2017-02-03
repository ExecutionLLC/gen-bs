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
        },
        searchPlaceholder: 'Поиск мутаций в текущем анализе',
        samplesButton: 'Сэмплы',
        analysesButton: 'Анализы',
        savedFilesButton: 'Сохранённые файлы'
    },
    analysis: {
        title: 'Анализы',

        leftPane: {
            searchPlaceHolder: 'Поиск анализа по названию или описанию',
            newAnalysis: 'Новый анализ',
            newAnalysisDescription: 'Введите параметры для нового анализа'
        },
        rightPane: {
            deleteAnalysis: 'Удалить анализ',
            analysisNamePlaceHolder: 'Имя анализа (обязательно)',
            created: 'Создан',
            analysisDescriptionPlaceHolder: 'Описание анализа (опционально)',
            duplicate: 'Добавить копию чтобы внести изменения',
            analysisType: {
                single: 'Одиночный',
                tumor: 'Опухоль/Здоровый',
                family: 'Семья'
            },
            sampleType: {
                single: 'Одиночый',
                tumor: 'Опухоль',
                normal: 'Здоровый',
                proband: 'Пробанд',
                mother: 'Мать',
                father: 'Отец'
            },
            sampleTypeAbbr: {
                single: 'Одн',
                tumor: 'Опх',
                normal: 'Здр',
                proband: 'П',
                mother: 'М',
                father: 'О'
            },
            content: {
                sample: 'Сэмпл',
                samples: 'Сэмплы',
                filter: 'Фильтр',
                filters: 'Фильтры',
                model: 'Модель',
                models: 'Модели',
                view: 'Представление',
                views: 'Представления',
                analyze: 'Начать анализ',
                restoreToDefault: 'Сбросить настройки',
                analysisType: 'Тип анализа',
                duplicate: 'Создать копию',
                viewResults: 'Просмотреть результаты'
            }
        },
        copyOf: 'Копия %{name}',
        descriptionOf: 'Описание %{name}'
    },
    errors: {
        errorTitle: 'Ошибка',
        unexpectedErrorTitle: 'Ошибка',
        errorCode: 'Код ошибки: %{errorCode}',
        unknownError: 'Неизвестная ошибка',
        buttonClose: 'Закрыть'
    },
    variantsTable: {
        addComment: 'Добавить комментарий',
        commentPlaceholder: 'Добавьте комментарий...',
        saveComment: 'Сохранить',
        cancelComment: 'Отменить',
        empty: 'Не найдено',
        headComment: 'Комментарий',
        loading: 'Загрузка...'
    },
    savedFiles: {
        title: 'Сохранённые файлы',
        registerCaption: 'Войдите для доступа к сохранениям.',
        emptyCaption: 'Тут будут сохранённые файлы. Пока ничего не сохранено.',
        headerDate: 'Дата',
        headerSample: 'Сэмпл',
        headerFilter: 'Фильтр',
        headerView: 'Представление',
        headerModel: 'Модель',
        buttonDownload: 'Скачать'
    },
    anotherPageOpened: {
        title: 'Сайт открыт в другой странице',
        text: {
            prefix: '',
            link: 'Кликните здесь',
            suffix: ', чтобы открыть Alapy Genomics Explorer в этом окне. Все другие открытые с этим сайтом окна будут остановлены. Ваш аккаунт позволяет работать с сайтом только в одном окне.'
        },
        waitCaption: 'Пожалуйста, подождите...',
        buttonUseHere: 'Открыть в этом окне'
    },
    autoLogout: {
        title: 'Автоматический выход',
        text: 'Сеанс будет автоматически завершён через %{secs}с.',
        buttonExtend: 'Отложить'
    },
    closeAllSessions: {
        title: 'Сайт открыт в другом окне',
        text: 'В другом окне или браузере выполнен вход под текущей учётной записью. Если вы хотите закрыть тот сеанс - нажмите кнопку, которая находится внизу или закройте этот диалог.',
        buttonClose: 'Закрыть сеанс в другой вкладке'
    },
    filterAndModel: {
        texts: {
            filter: {
                lowercase: 'фильтр',
                uppercase: 'Фильтр'
            },
            filters: {
                lowercase: 'фильтры',
                uppercase: 'Фильтры'
            },
            model: {
                lowercase: 'модель',
                uppercase: 'Модель'
            },
            models: {
                lowercase: 'модели',
                uppercase: 'Модели'
            },
            modelMismatch: 'Неподходящая модель анализа'
        },
        header: {
            title: 'Настройка'
        },
        noRulesToSetup: '%{obj} не содержит настраиваемых правил',
        rulesGroupHeader: {
            addButton: {
                addRule: 'Добавить правило',
                addGroup: 'Добавить группу',
                deleteItem: 'Удалить'
            },
            radioButton: {
                and: 'И',
                or: 'ИЛИ'
            }
        },
        ruleContainer: {
            deleteItem: 'Удалить'
        },
        validationMessage: {
            nameAlreadyExists: '%{obj} с таким именем уже существует.',
            empty: 'Имя не должно быть пустым',
            lengthExceeded: 'Длина имени может быть не более %{maxLength}'
        },
        existentFilterSelect: {
            title: 'Доступные %{filtersOrModels}',
            duplicate: 'Создать копию',
            reset: 'Сбросить %{filterOrModel}',
            deleteItem: 'Удалить %{filterOrModel}'
        },
        newFilterInputs: {
            newFilter: 'Создать %{filterOrModel}',
            namePlaceholder: 'Введите имя',
            description: 'Описание',
            descriptionPlaceholder: 'Введите описание (опиционально)'
        },
        readOnlyReason: {
            historyEntity: '%{entity} является историческим, создайте копию и внесите в неё изменения.',
            notEditable: '%{entity} только для чтения, создайте копию и внесите в неё изменения.',
            forRegisteredUsers: ' (Только для зарегистрированных пользователей)'
        },
        saveAndSelect: 'Сохранить и выбрать',
        select: 'Выбрать',
        cancel: 'Отмена',
        loginRequiredMsg: 'Войдите или зарегистрируйтесь чтобы выбрать продвинутые %{filtersOrModels}',
        copyOf: 'Копия %{name}'
    },
    view: {
        existentViewSelect: {
            title: 'Доступные Представления',
            duplicate: 'Создать копию',
            reset: 'Сбросить представление',
            deleteItem: 'Удалить представление'
        },
        saveAndSelect: 'Сохранить и Выбрать',
        select: 'Выбрать',
        cancel: 'Отмена',
        loginRequiredMsg: 'Войдите или зарегистрируйтесь чтобы выбрать продвинутое представление',
        header: {
            title: 'Настройка представлений'
        },
        newViewInputs: {
            newView: 'Новое представление',
            namePlaceholder: 'Введите имя представления',
            description: 'Описание',
            descriptionPlaceholder: 'Введите описание (опционально)'
        },
        keywordSelector: {
            placeholder: {
                chooseKeywords: 'Выберите ключевые слова',
                noKeywords: 'Для данного поля нет ключевых слов'
            }
        },
        viewBuilder: {
            title: 'Колонки',
            columnsSorting: 'Имя колонки и порядок сортировки',
            columnsFilter: 'Ключевые слова'
        },
        copyOf: 'Копия %{name}'
    }
};
