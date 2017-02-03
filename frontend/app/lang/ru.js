export default {
    common: {
        agx: 'AGx'
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
        },
        errors: {
            updateSampleFieldsError: 'Нам действительно жаль, но произошла ошибка во время обновления данных в колонках. ' +
                'Уверяем, что мы работаем над разрешением этой проблемы. Вы также можете обновить эту страницу и попробовать еще раз.',
            fetchSamplesError: 'Нам действительно жаль, но произошла ошибка во время получения списка сэмплов с сервера. ' +
                'Уверяем, что мы работаем над разрешением этой проблемы. Вы также можете обновить эту страницу и попробовать еще раз.',
            deleteSampleError: 'Нам действительно жаль, но произошла ошибка во время удаления сэмпла. ' +
                'Уверяем, что мы работаем над разрешением этой проблемы. Вы также можете обновить эту страницу и попробовать еще раз.'
        }
    },
    demoPopup: {
        caption: 'Гостевой режим',
        loginLinkPrefix: '',
        loginLinkLabel: 'Войдите',
        loginLinkSuffix: ''
    },
    navBar: {
        auth: {
            login: 'Войти',
            logout: 'Выйти',
            loginPlaceholder: 'Логин',
            passwordPlaceholder: 'Пароль',
            authorizedUserTitle: '',
            demoUserTitle: 'Загеристрируйтесь или войдите для получения дополнительных возможностей',
            googleAccountTitle: 'Войдите через Google',
            dropdownHeader: 'Войти через',
            googleAccountCaption: 'Google',
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
                family: 'Семейный'
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
        descriptionOf: 'Описание %{name}',
        error: {
            historyError: 'Невозможно обновить историю анализов. Пожалуйста, попробуйте еще раз.',
            getSampleNetworkError: 'Невозможно получить сэмпл (ошибка сети). Пожалуйста, попробуйте еще раз.',
            getSampleServerError: 'Невозможно получить сэмпл (server error). Пожалуйста, попробуйте еще раз.',
            getViewError: 'Невозможно получить информацию о представлении. Пожалуйста, попробуйте еще раз.',
            getFilterError: 'Невозможно получить информацию о фильтре. Пожалуйста, попробуйте еще раз.',
            getModelError: 'Невозможно получить информацию о модели. Пожалуйста, попробуйте еще раз.'
        }
    },
    errors: {
        errorTitle: 'Ошибка',
        unexpectedErrorTitle: 'Ошибка',
        errorCode: 'Код ошибки: %{errorCode}',
        unknownError: 'Неизвестная ошибка',
        buttonClose: 'Закрыть',
        /*
         * login errors
         */
        loginError: 'Ошибка авторизации. Вы можете обновить страницу и попробовать снова.',
        loginGoogleError: 'Ошибка авторизации через Google.',
        closeAllUserSessionError: 'Ошибка при закрытии всех других сессий.',
        closeOtherSocketsError: 'Ошибка при закрытии других сокетов. Пожалуйста, обновите страницу и попробуйте снова.',
        /*
         * field errors
         */
        totalFieldsNetworkError: 'Не удалось получить список всех колонок (ошибка сети). Вы можете обновить страницу и попробовать снова.',
        totalFieldsServerError: 'Не удалось получить список всез колонок (ошибка сервера). Вы можете обновить страницу и попробовать снова.',
        /*
         * file upload errors
         */
        deleteUploadError: 'Нам действительно жаль, но произошла ошибка во время удаления файла. ' +
            'Уверяем, что мы работаем над разрешением этой проблемы. Вы также можете обновить эту страницу и попробовать еще раз.',
        /*
         * user data errors
         */
        fetchUserDataNetworkError: 'Не удалось загрузить данные пользователя. Вы можете обновить страницу и попробовать снова.',
        cannotFindDefaultItemsError: 'Не удалось определить настройки по умолчанию (сэмпл, представление, фильтр). ' +
            'Вы можете установить сэмпл, фильтр и представление вручную или попробовать обновить страницу.'
    },
    variantsTable: {
        addComment: 'Добавить комментарий',
        commentPlaceholder: 'Добавьте комментарий...',
        saveComment: 'Сохранить',
        cancelComment: 'Отменить',
        empty: 'Не найдено',
        headComment: 'Комментарий',
        loading: 'Загрузка...',
        errors: {
            analyzeSampleError: 'Не удалось проанализировать данные. Пожалуйста, попробуйте еще раз.',
            nextDataError: 'Не удалось получить следующую часть данных. Пожалуйста, попробуйте еще раз.',
            searchInResultsError: 'Не удалось проанализировать результаты. Пожалуйста, попробуйте еще раз.',
            addCommentError: 'Не удалось добавить комментарий. Пожалуйста, попробуйте еще раз.',
            updateCommentError: 'Не удалось обновить комментарий. Пожалуйста, попробуйте еще раз.',
            deleteCommentError: 'Не удалось удалить комментарий. Пожалуйста, попробуйте еще раз.'
        }
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
        buttonDownload: 'Скачать',
        errors: {
            uploadError: 'Произошла ошибка во время загрузки экспортируемого файла',
            downloadError: 'Произошла ошибка во время выгрузки экспортируемого файла'
        }
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
            filters: {
                header: 'Настройка фильтров',
                noRulesToSetup: 'Фильтр не содержит настраиваемых правил',
                existentSelect: {
                    title: 'Доступные фильтры',
                    duplicate: 'Создать копию',
                    reset: 'Сбросить фиьлтр',
                    deleteItem: 'Удалить фильтр'
                },
                validationMessage: {
                    nameAlreadyExists: 'Фильтр с таким именем уже существует.',
                    empty: 'Имя не должно быть пустым',
                    lengthExceeded: 'Длина имени может быть не более %{maxLength}'
                },
                newInputs: {
                    newCaption: 'Создать фильтр',
                    namePlaceholder: 'Введите имя фильтра',
                    description: 'Описание',
                    descriptionPlaceholder: 'Введите описание фильтра (опиционально)'
                },
                readOnlyReason: {
                    historyEntity: 'Фильтр является историческим, создайте копию и внесите в неё изменения.',
                    notEditable: 'Фильтр только для чтения, создайте копию и внесите в неё изменения.',
                    forRegisteredUsers: ' (Только для зарегистрированных пользователей)'
                },
                loginRequiredMsg: 'Войдите или зарегистрируйтесь чтобы выбрать продвинутые фильтры',
                loginToWork: 'Войдите или зарегистрируйтесь для работы с фильтром',
                makeCopy: 'Скопируйте для изменения'
            },
            models: {
                header: 'Настройка моделей',
                noRulesToSetup: 'Модель не содержит настраиваемых правил',
                existentSelect: {
                    title: 'Доступные модели',
                    duplicate: 'Создать копию',
                    reset: 'Сбросить модиль',
                    deleteItem: 'Удалить модель'
                },
                validationMessage: {
                    nameAlreadyExists: 'Модель с таким именем уже существует.',
                    empty: 'Имя не должно быть пустым',
                    lengthExceeded: 'Длина имени может быть не более %{maxLength}'
                },
                newInputs: {
                    newCaption: 'Создать модель',
                    namePlaceholder: 'Введите имя модели',
                    description: 'Описание',
                    descriptionPlaceholder: 'Введите описание модели (опиционально)'
                },
                readOnlyReason: {
                    historyEntity: 'Модель является исторической, создайте копию и внесите в неё изменения.',
                    notEditable: 'Модель только для чтения, создайте копию и внесите в неё изменения.',
                    forRegisteredUsers: ' (Только для зарегистрированных пользователей)'
                },
                loginRequiredMsg: 'Войдите или зарегистрируйтесь чтобы выбрать продвинутые модели',
                loginToWork: 'Войдите или зарегистрируйтесь для работы с моделью',
                makeCopy: 'Скопируйте для изменения'
            }
        },
        modelMismatch: 'Неподходящая модель анализа',
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
        saveAndSelect: 'Сохранить и выбрать',
        select: 'Выбрать',
        cancel: 'Отмена',
        copyOf: 'Копия %{name}',
        loginRequiredMsg: 'Войдите или зарегистрируйтесь чтобы выбрать продвинутые %{filtersOrModels}',
        errors: {
            createFilterError: 'Не удалось создать новый фильтр. Пожлауйста попробуйте снова.',
            updateFilterError: 'Не удалось обновить фильтр. Пожлауйста попробуйте снова.',
            deleteFilterError: 'Невозможно удалить фильтр. Пожлауйста попробуйте снова.',
            createModelError: 'Не удалось создать новую модель. Пожлауйста попробуйте снова.',
            updateModelError: 'Не удалось обновить модель. Пожлауйста попробуйте снова.',
            deleteModelError: 'Невозможно удалить модель. Пожлауйста попробуйте снова.'
        }
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
        loginToWork: 'Войдите или зарегистрируйтесь для работы с представлением',
        makeCopy: 'Скопируйте для изменения',
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
        copyOf: 'Копия %{name}',
        readOnlyReason: {
            historyEntity: 'Представление является историческим, создайте копию и внесите в неё изменения.',
            notEditable: 'Представление только для чтения, создайте копию и внесите в неё изменения.',
            forRegisteredUsers: ' (Только для зарегистрированных пользователей)'
        },
        orderTitle: 'Сортировка',
        errors: {
            createViewNetworkError: 'Не удалось создать новое представление (ошибка сети). Пожлауйста попробуйте снова.',
            createViewServerError: 'Не удалось создать новое представление  (ошибка сервера). Пожлауйста попробуйте снова.',
            updateViewNetworkError: 'Не удалось обновить представление (ошибка сети). Пожлауйста попробуйте снова.',
            updateViewServerError: 'Не удалось обновить представление (ошибка сервера). Пожлауйста попробуйте снова.',
            deleteViewNetworkError: 'Не удалось удалить представление (ошибка сети). Пожлауйста попробуйте снова.',
            deleteViewServerError: 'Не удалось удалить представление (ошибка сервера). Пожлауйста попробуйте снова.'
        }
    }
};
