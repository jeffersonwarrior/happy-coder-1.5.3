import type { TranslationStructure } from '../_default';

/**
 * Russian plural helper function
 * Russian has 3 plural forms: one, few, many
 * @param options - Object containing count and the three plural forms
 * @returns The appropriate form based on Russian plural rules
 */
function plural({ count, one, few, many }: { count: number; one: string; few: string; many: string }): string {
  const n = Math.abs(count);
  const n10 = n % 10;
  const n100 = n % 100;

  // Rule: ends in 1 but not 11
  if (n10 === 1 && n100 !== 11) return one;

  // Rule: ends in 2-4 but not 12-14
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;

  // Rule: everything else (0, 5-9, 11-19, etc.)
  return many;
}

/**
 * Russian translations for the Happy app
 * Must match the exact structure of the English translations
 */
export const ru: TranslationStructure = {
  common: {
    // Simple string constants
    cancel: 'Отмена',
    authenticate: 'Авторизация',
    save: 'Сохранить',
    error: 'Ошибка',
    success: 'Успешно',
    ok: 'ОК',
    continue: 'Продолжить',
    back: 'Назад',
    create: 'Создать',
    rename: 'Переименовать',
    reset: 'Сбросить',
    logout: 'Выйти',
    yes: 'Да',
    no: 'Нет',
    discard: 'Отменить',
    version: 'Версия',
    copied: 'Скопировано',
    scanning: 'Сканирование...',
    urlPlaceholder: 'https://example.com',
    home: 'Главная',
    message: 'Сообщение',
    files: 'Файлы',
    fileViewer: 'Просмотр файла',
    loading: 'Загрузка...',
    retry: 'Повторить',
    comingSoon: 'Скоро',
    saving: 'Сохранение...',
  },

  connect: {
    restoreAccount: 'Восстановить аккаунт',
    enterSecretKey: 'Пожалуйста, введите секретный ключ',
    invalidSecretKey: 'Неверный секретный ключ. Проверьте и попробуйте снова.',
    enterUrlManually: 'Ввести URL вручную',
  },

  settings: {
    title: 'Настройки',
    connectedAccounts: 'Подключенные аккаунты',
    connectAccount: 'Подключить аккаунт',
    github: 'GitHub',
    machines: 'Машины',
    features: 'Функции',
    account: 'Аккаунт',
    accountSubtitle: 'Управление учётной записью',
    appearance: 'Внешний вид',
    appearanceSubtitle: 'Настройка внешнего вида приложения',
    voiceAssistant: 'Голосовой ассистент',
    voiceAssistantSubtitle: 'Настройка предпочтений голосового взаимодействия',
    featuresTitle: 'Возможности',
    featuresSubtitle: 'Включить или отключить функции приложения',
    developer: 'Разработчик',
    developerTools: 'Инструменты разработчика',
    about: 'О программе',
    aboutFooter:
      'Happy Coder — мобильное приложение для работы с Codex и Claude Code. Использует сквозное шифрование, все данные аккаунта хранятся только на вашем устройстве. Не связано с Anthropic.',
    happyAttribution: 'Мобильный и веб-клиент для Claude Code и Codex',
    whatsNew: 'Что нового',
    whatsNewSubtitle: 'Посмотреть последние обновления и улучшения',
    help: 'Помощь',
    helpAndSupport: 'Помощь и поддержка',
    helpSubtitle: 'Получите помощь, сообщите о проблемах и найдите ресурсы',
    reportIssue: 'Сообщить о проблеме',
    reportIssueSubtitle: 'Нашли ошибку? Сообщите нам на GitHub',
    githubRepository: 'Репозиторий GitHub',
    githubRepositorySubtitle: 'Просмотрите исходный код и внесите свой вклад',
    privacyPolicy: 'Политика конфиденциальности',
    termsOfService: 'Условия использования',
    eula: 'EULA',
    supportUs: 'Поддержите нас',
    supportUsSubtitlePro: 'Спасибо за вашу поддержку!',
    supportUsSubtitle: 'Поддержать разработку проекта',
    scanQrCodeToAuthenticate: 'Отсканируйте QR-код для авторизации',
    githubConnected: ({ login }: { login: string }) => `Подключен как @${login}`,
    connectGithubAccount: 'Подключить аккаунт GitHub',
    claudeAuthSuccess: 'Успешно подключено к Claude',
    exchangingTokens: 'Обмен токенов...',

    // Dynamic settings messages
    accountConnected: ({ service }: { service: string }) => `Аккаунт ${service} подключен`,
    machineStatus: ({ name, status }: { name: string; status: 'online' | 'offline' }) =>
      `${name} ${status === 'online' ? 'online' : 'offline'}`,
    featureToggled: ({ feature, enabled }: { feature: string; enabled: boolean }) =>
      `${feature} ${enabled ? 'включена' : 'отключена'}`,
  },

  settingsAppearance: {
    // Appearance settings screen
    theme: 'Тема',
    themeDescription: 'Выберите предпочтительную цветовую схему',
    themeOptions: {
      adaptive: 'Адаптивная',
      light: 'Светлая',
      dark: 'Тёмная',
    },
    themeDescriptions: {
      adaptive: 'Следовать настройкам системы',
      light: 'Всегда использовать светлую тему',
      dark: 'Всегда использовать тёмную тему',
    },
    display: 'Отображение',
    displayDescription: 'Управление макетом и интервалами',
    inlineToolCalls: 'Встроенные вызовы инструментов',
    inlineToolCallsDescription: 'Отображать вызовы инструментов прямо в сообщениях чата',
    expandTodoLists: 'Развернуть списки задач',
    expandTodoListsDescription: 'Показывать все задачи вместо только изменений',
    showLineNumbersInDiffs: 'Показывать номера строк в различиях',
    showLineNumbersInDiffsDescription: 'Отображать номера строк в различиях кода',
    showLineNumbersInToolViews: 'Показывать номера строк в представлениях инструментов',
    showLineNumbersInToolViewsDescription: 'Отображать номера строк в различиях представлений инструментов',
    alwaysShowContextSize: 'Всегда показывать размер контекста',
    alwaysShowContextSizeDescription: 'Отображать использование контекста даже когда не близко к лимиту',
    avatarStyle: 'Стиль аватара',
    avatarStyleDescription: 'Выберите внешний вид аватара сессии',
    avatarOptions: {
      pixelated: 'Пиксельная',
      gradient: 'Градиентная',
      brutalist: 'Бруталистская',
    },
    showFlavorIcons: 'Показывать иконки провайдеров ИИ',
    showFlavorIconsDescription: 'Отображать иконки провайдеров ИИ на аватарах сессий',
    compactSessionView: 'Компактный вид сессий',
    compactSessionViewDescription: 'Отображать активные сессии в более компактном виде',
  },

  settingsFeatures: {
    // Features settings screen
    experiments: 'Эксперименты',
    experimentsDescription:
      'Включить экспериментальные функции, которые всё ещё разрабатываются. Эти функции могут быть нестабильными или изменяться без предупреждения.',
    experimentalFeatures: 'Экспериментальные функции',
    experimentalFeaturesEnabled: 'Экспериментальные функции включены',
    experimentalFeaturesDisabled: 'Используются только стабильные функции',
    webFeatures: 'Веб-функции',
    webFeaturesDescription: 'Функции, доступные только в веб-версии приложения.',
    commandPalette: 'Command Palette',
    commandPaletteEnabled: 'Нажмите ⌘K для открытия',
    commandPaletteDisabled: 'Быстрый доступ к командам отключён',
    markdownCopyV2: 'Markdown Copy v2',
    markdownCopyV2Subtitle: 'Долгое нажатие открывает модальное окно копирования',
    defaultCoder: 'Кодер по умолчанию',
    defaultCoderDescription: 'Выберите ИИ-ассистента для новых сессий по умолчанию.',
    defaultCoderClaude: 'Claude Code',
    defaultCoderCodex: 'Codex',
    defaultCoderAsk: 'Спрашивать каждый раз',
    privacy: 'Конфиденциальность',
    privacyDescription: 'Управление отображением и передачей вашей личной информации.',
    anonymousModeDisabled: 'Показывать настоящее имя и профиль',
    aiModels: 'Модели ИИ',
    aiModelsDescription:
      'Автоматически обнаруженные модели ИИ и их возможности. Нажмите для обновления списка моделей.',
    discoveringModels: 'Поиск доступных моделей ИИ...',
    noModelsFound: 'Модели не найдены',
    noModelsFoundDescription: 'Нажмите для поиска доступных моделей ИИ',
    showMoreModels: (count: number) => `Показать все ${count} моделей`,
    showLessModels: 'Показать меньше моделей',
    refreshModels: 'Обновить список моделей',
    refreshModelsDescription: 'Обнаружить новые или обновленные модели ИИ',
  },

  errors: {
    networkError: 'Произошла ошибка сети',
    serverError: 'Произошла ошибка сервера',
    unknownError: 'Произошла неизвестная ошибка',
    connectionTimeout: 'Время соединения истекло',
    authenticationFailed: 'Ошибка авторизации',
    permissionDenied: 'Доступ запрещен',
    fileNotFound: 'Файл не найден',
    invalidFormat: 'Неверный формат',
    operationFailed: 'Операция не выполнена',
    tryAgain: 'Пожалуйста, попробуйте снова',
    contactSupport: 'Если проблема сохранится, обратитесь в поддержку',
    sessionNotFound: 'Сессия не найдена',
    voiceSessionFailed: 'Не удалось запустить голосовую сессию',
    oauthInitializationFailed: 'Не удалось инициализировать процесс OAuth',
    tokenStorageFailed: 'Не удалось сохранить токены аутентификации',
    oauthStateMismatch: 'Ошибка проверки безопасности. Попробуйте снова',
    tokenExchangeFailed: 'Не удалось обменять код авторизации',
    oauthAuthorizationDenied: 'В авторизации отказано',
    webViewLoadFailed: 'Не удалось загрузить страницу аутентификации',

    // Error functions with context
    fieldError: ({ field, reason }: { field: string; reason: string }) => `${field}: ${reason}`,
    validationError: ({ field, min, max }: { field: string; min: number; max: number }) =>
      `${field} должно быть от ${min} до ${max}`,
    retryIn: ({ seconds }: { seconds: number }) =>
      `Повторить через ${seconds} ${plural({ count: seconds, one: 'секунду', few: 'секунды', many: 'секунд' })}`,
    errorWithCode: ({ message, code }: { message: string; code: number | string }) => `${message} (Ошибка ${code})`,
    disconnectServiceFailed: ({ service }: { service: string }) => `Не удалось отключить ${service}`,
    connectServiceFailed: ({ service }: { service: string }) =>
      `Не удалось подключить ${service}. Пожалуйста, попробуйте снова.`,
  },

  newSession: {
    // Used by new-session screen and launch flows
    title: 'Начать новую сессию',
    noMachinesFound: 'Машины не найдены. Сначала запустите сессию Happy на вашем компьютере.',
    allMachinesOffline: 'Все машины находятся offline',
    machineDetails: 'Посмотреть детали машины →',
    directoryDoesNotExist: 'Директория не найдена',
    createDirectoryConfirm: ({ directory }: { directory: string }) =>
      `Директория ${directory} не существует. Хотите создать её?`,
    sessionStarted: 'Сессия запущена',
    sessionStartedMessage: 'Сессия успешно запущена.',
    sessionSpawningFailed: 'Ошибка создания сессии - ID сессии не получен.',
    failedToStart: 'Не удалось запустить сессию. Убедитесь, что daemon запущен на целевой машине.',
    sessionTimeout: 'Время запуска сессии истекло. Машина может работать медленно или daemon не отвечает.',
    notConnectedToServer: 'Нет подключения к серверу. Проверьте интернет-соединение.',
    startingSession: 'Запуск сессии...',
    startNewSessionInFolder: 'Новая сессия здесь',
    noMachineSelected: 'Пожалуйста, выберите машину для запуска сессии',
    noPathSelected: 'Пожалуйста, выберите директорию для запуска сессии',
  },

  sessionHistory: {
    // Used by session history screen
    title: 'История сессий',
    empty: 'Сессии не найдены',
    today: 'Сегодня',
    yesterday: 'Вчера',
    daysAgo: ({ count }: { count: number }) =>
      `${count} ${plural({ count, one: 'день', few: 'дня', many: 'дней' })} назад`,
    viewAll: 'Посмотреть все сессии',
  },

  server: {
    // Used by Server Configuration screen (app/(app)/server.tsx)
    serverConfiguration: 'Настройка сервера',
    enterServerUrl: 'Пожалуйста, введите URL сервера',
    notValidHappyServer: 'Это не валидный сервер Happy',
    changeServer: 'Изменить сервер',
    continueWithServer: 'Продолжить с этим сервером?',
    resetToDefault: 'Сбросить по умолчанию',
    resetServerDefault: 'Сбросить сервер по умолчанию?',
    validating: 'Проверка...',
    validatingServer: 'Проверка сервера...',
    serverReturnedError: 'Сервер вернул ошибку',
    failedToConnectToServer: 'Не удалось подключиться к серверу',
    currentlyUsingCustomServer: 'Сейчас используется пользовательский сервер',
    customServerUrlLabel: 'URL пользовательского сервера',
    advancedFeatureFooter:
      'Это расширенная функция. Изменяйте сервер только если знаете, что делаете. Вам нужно будет выйти и войти снова после изменения серверов.',
  },

  sessionInfo: {
    // Used by Session Info screen (app/(app)/session/[id]/info.tsx)
    killSession: 'Завершить сессию',
    killSessionConfirm: 'Вы уверены, что хотите завершить эту сессию?',
    archiveSession: 'Архивировать сессию',
    archiveSessionConfirm: 'Вы уверены, что хотите архивировать эту сессию?',
    happySessionIdCopied: 'ID сессии Happy скопирован в буфер обмена',
    failedToCopySessionId: 'Не удалось скопировать ID сессии Happy',
    happySessionId: 'ID сессии Happy',
    claudeCodeSessionId: 'ID сессии Claude Code',
    claudeCodeSessionIdCopied: 'ID сессии Claude Code скопирован в буфер обмена',
    aiProvider: 'Поставщик ИИ',
    failedToCopyClaudeCodeSessionId: 'Не удалось скопировать ID сессии Claude Code',
    metadataCopied: 'Метаданные скопированы в буфер обмена',
    failedToCopyMetadata: 'Не удалось скопировать метаданные',
    failedToKillSession: 'Не удалось завершить сессию',
    failedToArchiveSession: 'Не удалось архивировать сессию',
    connectionStatus: 'Статус подключения',
    created: 'Создано',
    lastUpdated: 'Последнее обновление',
    sequence: 'Последовательность',
    quickActions: 'Быстрые действия',
    viewMachine: 'Посмотреть машину',
    viewMachineSubtitle: 'Посмотреть детали машины и сессии',
    killSessionSubtitle: 'Немедленно завершить сессию',
    archiveSessionSubtitle: 'Архивировать эту сессию и остановить её',
    metadata: 'Метаданные',
    host: 'Хост',
    path: 'Путь',
    operatingSystem: 'Операционная система',
    processId: 'ID процесса',
    happyHome: 'Домашний каталог Happy',
    copyMetadata: 'Копировать метаданные',
    agentState: 'Состояние агента',
    controlledByUser: 'Управляется пользователем',
    pendingRequests: 'Ожидающие запросы',
    activity: 'Активность',
    thinking: 'Думает',
    thinkingSince: 'Думает с',
    cliVersion: 'Версия CLI',
    cliVersionOutdated: 'Требуется обновление CLI',
    cliVersionOutdatedMessage: ({
      currentVersion,
      requiredVersion,
    }: {
      currentVersion: string;
      requiredVersion: string;
    }) => `Установлена версия ${currentVersion}. Обновите до ${requiredVersion} или новее`,
    updateCliInstructions: 'Пожалуйста, выполните npm install -g happy-coder@latest',
    updateCliAutomatic: 'Обновить CLI автоматически',
    updateCliUpdating: 'Обновление CLI...',
    updateCliSuccess: 'CLI успешно обновлен! Сессия автоматически обновится.',
    updateCliError: 'Не удалось обновить CLI. Пожалуйста, попробуйте обновить вручную.',
    updateCliDev: 'Переключиться на ветку разработки',
    updateCliDevDescription: 'Получить последние функции разработки из jeffersonwarrior/happy-fork',
    updateCliDevUpdating: 'Переключение на ветку разработки...',
    updateCliDevSuccess: 'Успешно переключено на ветку разработки! Сессия будет обновлена.',
    updateCliStable: 'Переключиться на стабильную версию',
    updateCliStableDescription: 'Вернуться к стабильному релизу из npm',
  },

  components: {
    emptyMainScreen: {
      // Used by EmptyMainScreen component
      readyToCode: 'Готовы к программированию?',
      installCli: 'Установите Happy CLI',
      runIt: 'Запустите его',
      scanQrCode: 'Отсканируйте QR-код',
      openCamera: 'Открыть камеру',
    },
  },

  status: {
    connected: 'подключено',
    connecting: 'подключение',
    disconnected: 'отключено',
    error: 'ошибка',
    online: 'online',
    offline: 'offline',
    lastSeen: ({ time }: { time: string }) => `в сети ${time}`,
    permissionRequired: 'требуется разрешение',
    activeNow: 'Активен сейчас',
    unknown: 'неизвестно',
  },

  time: {
    justNow: 'только что',
    minutesAgo: ({ count }: { count: number }) =>
      `${count} ${plural({ count, one: 'минуту', few: 'минуты', many: 'минут' })} назад`,
    hoursAgo: ({ count }: { count: number }) =>
      `${count} ${plural({ count, one: 'час', few: 'часа', many: 'часов' })} назад`,
  },

  session: {
    inputPlaceholder: 'Введите сообщение...',
  },

  commandPalette: {
    placeholder: 'Введите команду или поиск...',
  },

  agentInput: {
    permissionMode: {
      title: 'РЕЖИМ РАЗРЕШЕНИЙ',
      default: 'По умолчанию',
      acceptEdits: 'Принимать правки',
      plan: 'Режим планирования',
      bypassPermissions: 'YOLO режим',
      badgeAcceptAllEdits: 'Принимать все правки',
      badgeBypassAllPermissions: 'Обход всех разрешений',
      badgePlanMode: 'Режим планирования',
    },
    agent: {
      claude: 'Claude',
      codex: 'Codex',
    },
    model: {
      title: 'МОДЕЛЬ',
      default: 'Использовать настройки CLI',
      adaptiveUsage: 'Opus до 50% использования, затем Sonnet',
      sonnet: 'Sonnet',
      opus: 'Opus',
    },
    codexPermissionMode: {
      title: 'РЕЖИМ РАЗРЕШЕНИЙ CODEX',
      default: 'Настройки CLI',
      readOnly: 'Read Only Mode',
      safeYolo: 'Safe YOLO',
      yolo: 'YOLO',
      badgeReadOnly: 'Только чтение',
      badgeSafeYolo: 'Safe YOLO',
      badgeYolo: 'YOLO',
    },
    codexModel: {
      title: 'МОДЕЛЬ CODEX',
      gpt5Minimal: 'GPT-5 Минимальная',
      gpt5Low: 'GPT-5 Низкая',
      gpt5Medium: 'GPT-5 Средняя',
      gpt5High: 'GPT-5 Высокая',
    },
    context: {
      remaining: ({ percent }: { percent: number }) => `Осталось ${percent}%`,
    },
    suggestion: {
      fileLabel: 'ФАЙЛ',
      folderLabel: 'ПАПКА',
    },
    noMachinesAvailable: 'Нет машин',
  },

  machineLauncher: {
    showLess: 'Показать меньше',
    showAll: ({ count }: { count: number }) =>
      `Показать все (${count} ${plural({ count, one: 'путь', few: 'пути', many: 'путей' })})`,
    enterCustomPath: 'Ввести свой путь',
    offlineUnableToSpawn: 'Невозможно создать сессию, машина offline',
  },

  sidebar: {
    sessionsTitle: 'Сессии',
  },

  toolView: {
    input: 'Входные данные',
    output: 'Результат',
  },

  tools: {
    fullView: {
      description: 'Описание',
      inputParams: 'Входные параметры',
      output: 'Результат',
      error: 'Ошибка',
      completed: 'Инструмент выполнен успешно',
      noOutput: 'Результат не получен',
      running: 'Выполняется...',
      rawJsonDevMode: 'Исходный JSON (режим разработчика)',
    },
    taskView: {
      initializing: 'Инициализация агента...',
      moreTools: ({ count }: { count: number }) =>
        `+${count} ещё ${plural({ count, one: 'инструмент', few: 'инструмента', many: 'инструментов' })}`,
    },
    multiEdit: {
      editNumber: ({ index, total }: { index: number; total: number }) => `Правка ${index} из ${total}`,
      replaceAll: 'Заменить все',
    },
    names: {
      task: 'Задача',
      terminal: 'Терминал',
      searchFiles: 'Поиск файлов',
      search: 'Поиск',
      searchContent: 'Поиск содержимого',
      listFiles: 'Список файлов',
      planProposal: 'Предложение плана',
      readFile: 'Чтение файла',
      editFile: 'Редактирование файла',
      writeFile: 'Запись файла',
      fetchUrl: 'Получение URL',
      readNotebook: 'Чтение блокнота',
      editNotebook: 'Редактирование блокнота',
      todoList: 'Список задач',
      webSearch: 'Веб-поиск',
      reasoning: 'Рассуждение',
      applyChanges: 'Обновить файл',
      viewDiff: 'Текущие изменения файла',
    },
    desc: {
      terminalCmd: ({ cmd }: { cmd: string }) => `Терминал(команда: ${cmd})`,
      searchPattern: ({ pattern }: { pattern: string }) => `Поиск(шаблон: ${pattern})`,
      searchPath: ({ basename }: { basename: string }) => `Поиск(путь: ${basename})`,
      fetchUrlHost: ({ host }: { host: string }) => `Получение URL(адрес: ${host})`,
      editNotebookMode: ({ path, mode }: { path: string; mode: string }) =>
        `Редактирование блокнота(файл: ${path}, режим: ${mode})`,
      todoListCount: ({ count }: { count: number }) => `Список задач(количество: ${count})`,
      webSearchQuery: ({ query }: { query: string }) => `Веб-поиск(запрос: ${query})`,
      grepPattern: ({ pattern }: { pattern: string }) => `grep(шаблон: ${pattern})`,
      multiEditEdits: ({ path, count }: { path: string; count: number }) =>
        `${path} (${count} ${plural({ count, one: 'правка', few: 'правки', many: 'правок' })})`,
      readingFile: ({ file }: { file: string }) => `Чтение ${file}`,
      writingFile: ({ file }: { file: string }) => `Запись ${file}`,
      modifyingFile: ({ file }: { file: string }) => `Изменение ${file}`,
      modifyingFiles: ({ count }: { count: number }) =>
        `Изменение ${count} ${plural({ count, one: 'файла', few: 'файлов', many: 'файлов' })}`,
      modifyingMultipleFiles: ({ file, count }: { file: string; count: number }) => `${file} и ещё ${count}`,
      showingDiff: 'Показ изменений',
    },
  },

  files: {
    searchPlaceholder: 'Поиск файлов...',
    detachedHead: 'отделённый HEAD',
    summary: ({ staged, unstaged }: { staged: number; unstaged: number }) =>
      `${staged} подготовлено • ${unstaged} не подготовлено`,
    notRepo: 'Не является git-репозиторием',
    notUnderGit: 'Эта папка не находится под управлением git',
    searching: 'Поиск файлов...',
    noFilesFound: 'Файлы не найдены',
    noFilesInProject: 'Файлов в проекте нет',
    tryDifferentTerm: 'Попробуйте другой поисковый запрос',
    searchResults: ({ count }: { count: number }) => `Результаты поиска (${count})`,
    projectRoot: 'Корень проекта',
    stagedChanges: ({ count }: { count: number }) => `Подготовленные изменения (${count})`,
    unstagedChanges: ({ count }: { count: number }) => `Неподготовленные изменения (${count})`,
    // File viewer strings
    loadingFile: ({ fileName }: { fileName: string }) => `Загрузка ${fileName}...`,
    binaryFile: 'Бинарный файл',
    cannotDisplayBinary: 'Невозможно отобразить содержимое бинарного файла',
    diff: 'Различия',
    file: 'Файл',
    fileEmpty: 'Файл пустой',
    noChanges: 'Нет изменений для отображения',
  },

  settingsVoice: {
    // Voice settings screen
    languageTitle: 'Язык',
    languageDescription:
      'Выберите предпочтительный язык для взаимодействия с голосовым помощником. Эта настройка синхронизируется на всех ваших устройствах.',
    preferredLanguage: 'Предпочтительный язык',
    preferredLanguageSubtitle: 'Язык, используемый для ответов голосового помощника',
    language: {
      searchPlaceholder: 'Поиск языков...',
      title: 'Языки',
      footer: ({ count }: { count: number }) =>
        `Доступно ${count} ${plural({ count, one: 'язык', few: 'языка', many: 'языков' })}`,
      autoDetect: 'Автоопределение',
    },
  },

  settingsAccount: {
    // Account settings screen
    accountInformation: 'Информация об аккаунте',
    status: 'Статус',
    statusActive: 'Активный',
    statusNotAuthenticated: 'Не авторизован',
    anonymousId: 'Анонимный ID',
    publicId: 'Публичный ID',
    notAvailable: 'Недоступно',
    linkNewDevice: 'Привязать новое устройство',
    linkNewDeviceSubtitle: 'Отсканируйте QR-код для привязки устройства',
    profile: 'Профиль',
    name: 'Имя',
    github: 'GitHub',
    tapToDisconnect: 'Нажмите для отключения',
    server: 'Сервер',
    backup: 'Резервная копия',
    backupDescription:
      'Ваш секретный ключ - единственный способ восстановить ваш аккаунт. Сохраните его в безопасном месте, например в менеджере паролей.',
    secretKey: 'Секретный ключ',
    tapToReveal: 'Нажмите для показа',
    tapToHide: 'Нажмите для скрытия',
    secretKeyLabel: 'СЕКРЕТНЫЙ КЛЮЧ (НАЖМИТЕ ДЛЯ КОПИРОВАНИЯ)',
    secretKeyCopied: 'Секретный ключ скопирован в буфер обмена. Сохраните его в безопасном месте!',
    secretKeyCopyFailed: 'Не удалось скопировать секретный ключ',
    privacy: 'Конфиденциальность',
    privacyDescription:
      'Помогите улучшить приложение, поделившись анонимными данными об использовании. Никакая личная информация не собирается.',
    analytics: 'Аналитика',
    analyticsDisabled: 'Данные не передаются',
    analyticsEnabled: 'Анонимные данные об использовании передаются',
    dangerZone: 'Опасная зона',
    logout: 'Выйти',
    logoutSubtitle: 'Выйти из аккаунта и очистить локальные данные',
    logoutConfirm: 'Вы уверены, что хотите выйти? Убедитесь, что вы сохранили резервную копию секретного ключа!',
    passwordSecurity: 'Безопасность пароля',
    passwordSecurityDescription: 'Защитите ваши сессии паролем для предотвращения несанкционированного доступа.',
    setupPasswordSubtitle: 'Добавить защиту паролем для ваших сессий',
    changePasswordSubtitle: 'Обновить текущий пароль',
    disablePasswordSubtitle: 'Удалить защиту паролем',
  },

  connectButton: {
    authenticate: 'Авторизация терминала',
    authenticateWithUrlPaste: 'Авторизация терминала через URL',
    pasteAuthUrl: 'Вставьте авторизационный URL из терминала',
  },

  updateBanner: {
    updateAvailable: 'Доступно обновление',
    pressToApply: 'Нажмите, чтобы применить обновление',
    whatsNew: 'Что нового',
    seeLatest: 'Посмотреть последние обновления и улучшения',
    nativeUpdateAvailable: 'Доступно обновление приложения',
    tapToUpdateAppStore: 'Нажмите для обновления в App Store',
    tapToUpdatePlayStore: 'Нажмите для обновления в Play Store',
  },

  changelog: {
    // Used by the changelog screen
    version: ({ version }: { version: number }) => `Версия ${version}`,
    noEntriesAvailable: 'Записи журнала изменений недоступны.',
  },

  terminal: {
    // Used by terminal connection screens
    webBrowserRequired: 'Требуется веб-браузер',
    webBrowserRequiredDescription:
      'Ссылки подключения терминала можно открывать только в веб-браузере по соображениям безопасности. Используйте сканер QR-кодов или откройте эту ссылку на компьютере.',
    processingConnection: 'Обработка подключения...',
    invalidConnectionLink: 'Неверная ссылка подключения',
    invalidConnectionLinkDescription: 'Ссылка подключения отсутствует или неверна. Проверьте URL и попробуйте снова.',
    connectTerminal: 'Подключить терминал',
    terminalRequestDescription:
      'Терминал запрашивает подключение к вашему аккаунту Happy Coder. Это позволит терминалу безопасно отправлять и получать сообщения.',
    connectionDetails: 'Детали подключения',
    publicKey: 'Публичный ключ',
    encryption: 'Шифрование',
    endToEndEncrypted: 'Сквозное шифрование',
    acceptConnection: 'Принять подключение',
    connecting: 'Подключение...',
    reject: 'Отклонить',
    security: 'Безопасность',
    securityFooter:
      'Эта ссылка подключения была безопасно обработана в вашем браузере и никогда не отправлялась на сервер. Ваши личные данные останутся в безопасности, и только вы можете расшифровать сообщения.',
    securityFooterDevice:
      'Это подключение было безопасно обработано на вашем устройстве и никогда не отправлялось на сервер. Ваши личные данные останутся в безопасности, и только вы можете расшифровать сообщения.',
    clientSideProcessing: 'Обработка на стороне клиента',
    linkProcessedLocally: 'Ссылка обработана локально в браузере',
    linkProcessedOnDevice: 'Ссылка обработана локально на устройстве',
  },

  modals: {
    // Used across connect flows and settings
    authenticateTerminal: 'Авторизация терминала',
    pasteUrlFromTerminal: 'Вставьте URL авторизации из вашего терминала',
    deviceLinkedSuccessfully: 'Устройство успешно связано',
    terminalConnectedSuccessfully: 'Терминал успешно подключен',
    invalidAuthUrl: 'Неверный URL авторизации',
    developerMode: 'Режим разработчика',
    developerModeEnabled: 'Режим разработчика включен',
    developerModeDisabled: 'Режим разработчика отключен',
    disconnectGithub: 'Отключить GitHub',
    disconnectGithubConfirm: 'Вы уверены, что хотите отключить аккаунт GitHub?',
    disconnectService: ({ service }: { service: string }) => `Отключить ${service}`,
    disconnectServiceConfirm: ({ service }: { service: string }) =>
      `Вы уверены, что хотите отключить ${service} от вашего аккаунта?`,
    disconnect: 'Отключить',
    failedToConnectTerminal: 'Не удалось подключить терминал',
    cameraPermissionsRequiredToConnectTerminal: 'Для подключения терминала требуется доступ к камере',
    failedToLinkDevice: 'Не удалось связать устройство',
    cameraPermissionsRequiredToScanQr: 'Для сканирования QR-кодов требуется доступ к камере',
  },

  navigation: {
    // Navigation titles and screen headers
    connectTerminal: 'Подключить терминал',
    linkNewDevice: 'Связать новое устройство',
    restoreWithSecretKey: 'Восстановить секретным ключом',
    whatsNew: 'Что нового',
  },

  welcome: {
    // Main welcome screen for unauthenticated users
    title: 'Мобильный клиент Codex и Claude Code',
    subtitle: 'Сквозное шифрование, аккаунт хранится только на вашем устройстве.',
    createAccount: 'Создать аккаунт',
    linkOrRestoreAccount: 'Связать или восстановить аккаунт',
    loginWithMobileApp: 'Войти через мобильное приложение',
  },

  review: {
    // Used by utils/requestReview.ts
    enjoyingApp: 'Нравится приложение?',
    feedbackPrompt: 'Мы будем рады вашему отзыву!',
    yesILoveIt: 'Да, мне нравится!',
    notReally: 'Не совсем',
  },

  items: {
    // Used by Item component for copy toast
    copiedToClipboard: ({ label }: { label: string }) => `${label} скопировано в буфер обмена`,
  },

  machine: {
    offlineUnableToSpawn: 'Запуск отключен: машина offline',
    offlineHelp:
      '• Убедитесь, что компьютер online\n• Выполните `happy daemon status` для диагностики\n• Используете последнюю версию CLI? Обновите командой `npm install -g happy-coder@latest`',
    launchNewSessionInDirectory: 'Запустить новую сессию в папке',
    daemon: 'Daemon',
    status: 'Статус',
    stopDaemon: 'Остановить daemon',
    lastKnownPid: 'Последний известный PID',
    lastKnownHttpPort: 'Последний известный HTTP порт',
    startedAt: 'Запущен в',
    cliVersion: 'Версия CLI',
    daemonStateVersion: 'Версия состояния daemon',
    activeSessions: ({ count }: { count: number }) => `Активные сессии (${count})`,
    machineGroup: 'Машина',
    host: 'Хост',
    machineId: 'ID машины',
    username: 'Имя пользователя',
    homeDirectory: 'Домашний каталог',
    platform: 'Платформа',
    architecture: 'Архитектура',
    lastSeen: 'Последняя активность',
    never: 'Никогда',
    metadataVersion: 'Версия метаданных',
    untitledSession: 'Безымянная сессия',
    back: 'Назад',
  },

  message: {
    switchedToMode: ({ mode }: { mode: string }) => `Переключено в режим ${mode}`,
    unknownEvent: 'Неизвестное событие',
    usageLimitUntil: ({ time }: { time: string }) => `Лимит использования достигнут до ${time}`,
    unknownTime: 'неизвестное время',
  },

  codex: {
    // Codex permission dialog buttons
    permissions: {
      yesForSession: 'Да, и не спрашивать для этой сессии',
      stopAndExplain: 'Остановить и объяснить, что делать',
    },
  },

  claude: {
    // Claude permission dialog buttons
    permissions: {
      yesAllowAllEdits: 'Да, разрешить все правки в этой сессии',
      yesForTool: 'Да, больше не спрашивать для этого инструмента',
      noTellClaude: 'Нет, и сказать Claude что делать по-другому',
    },
  },

  settingsLanguage: {
    // Language settings screen
    title: 'Язык',
    description:
      'Выберите предпочтительный язык интерфейса приложения. Настройки синхронизируются на всех ваших устройствах.',
    currentLanguage: 'Текущий язык',
    automatic: 'Автоматически',
    automaticSubtitle: 'Определять по настройкам устройства',
    needsRestart: 'Язык изменён',
    needsRestartMessage: 'Приложение нужно перезапустить для применения новых языковых настроек.',
    restartNow: 'Перезапустить',
  },

  textSelection: {
    // Text selection screen
    selectText: 'Выделить диапазон текста',
    title: 'Выделить текст',
    noTextProvided: 'Текст не предоставлен',
    textNotFound: 'Текст не найден или устарел',
    textCopied: 'Текст скопирован в буфер обмена',
    failedToCopy: 'Не удалось скопировать текст в буфер обмена',
    noTextToCopy: 'Нет текста для копирования',
  },

  daemonCleanup: {
    // Daemon cleanup modal
    unableToStop: 'Не удалось остановить демон',
    couldNotStop: ({ machineName }: { machineName: string }) => `Демон на "${machineName}" не удалось остановить.`,
    whatToDo: 'Что вы хотите сделать?',
    forceStop: 'Принудительная остановка',
    forceStopDescription: 'Попробовать альтернативные методы завершения демона',
    removeSession: 'Удалить сессию',
    removeSessionDescription: 'Очистить состояние сессии локально (демон может остаться запущенным)',
    cancelDescription: 'Оставить сессию без изменений и попробовать позже',
    error: ({ error }: { error: string }) => `Ошибка: ${error}`,
  },

  sessions: {
    // Session management actions
    rename: 'Переименовать сессию',
    duplicate: 'Дублировать сессию',
    delete: 'Удалить сессию',
    copyId: 'Копировать ID сессии',
    exportHistory: 'Экспортировать историю',
    deleteSessionTitle: 'Удалить сессию',
    deleteSessionMessage: ({ sessionName }: { sessionName: string }) =>
      `Вы уверены, что хотите удалить "${sessionName}"? Это действие нельзя отменить.`,
    renameSessionTitle: 'Переименовать сессию',
    renameSessionMessage: 'Введите новое имя для этой сессии:',
    sessionNamePlaceholder: 'Введите имя сессии...',
    duplicatePrefix: ({ originalName }: { originalName: string }) => `Копия ${originalName}`,
    sessionIdCopied: 'ID сессии скопирован в буфер обмена',
    failedToCopySessionId: 'Не удалось скопировать ID сессии',
    exportSaved: ({ fileName }: { fileName: string }) => `История сессии сохранена как ${fileName}`,
    exportFailed: 'Не удалось экспортировать историю сессии',
    exportHistoryComingSoon: 'Функция экспорта истории сессии скоро будет доступна.',
  },

  password: {
    // Password-based session unlocking
    unlockSession: 'Разблокировать сессию',
    unlockSessionDescription: 'Введите пароль для доступа к вашим сессиям',
    enterPassword: 'Введите пароль',
    unlock: 'Разблокировать',
    verifying: 'Проверка...',
    error: 'Ошибка пароля',
    incorrectPassword: 'Неверный пароль',
    incorrectPasswordMessage: ({ attempts }: { attempts: number }) =>
      `Неверный пароль. ${plural({ count: attempts, one: 'Осталась 1 попытка', few: `Осталось ${attempts} попытки`, many: `Осталось ${attempts} попыток` })}.`,
    tooManyAttempts: 'Слишком много попыток',
    tooManyAttemptsMessage:
      'Слишком много неудачных попыток ввода пароля. Попробуйте биометрическую аутентификацию или сбросьте приложение.',
    attemptsRemaining: ({ attempts }: { attempts: number }) =>
      plural({
        count: attempts,
        one: 'Осталась 1 попытка',
        few: `Осталось ${attempts} попытки`,
        many: `Осталось ${attempts} попыток`,
      }),
    verificationError: 'Не удалось проверить пароль. Попробуйте еще раз.',
    useBiometric: 'Использовать биометрическую аутентификацию',
    biometricPrompt: 'Используйте биометрию для разблокировки Happy Coder',
    biometricUnavailable: 'Биометрия недоступна',
    biometricUnavailableMessage: 'Биометрическая аутентификация недоступна на этом устройстве.',
    biometricError: 'Биометрическая аутентификация не удалась. Попробуйте еще раз.',
    tryBiometric: 'Попробовать биометрию',
    usePassword: 'Использовать пароль',
    forgotPassword: 'Забыли пароль?',
    forgotPasswordMessage:
      'При сбросе пароля приложение будет сброшено, и вам нужно будет восстановить аккаунт с помощью секретного ключа.',
    resetApp: 'Сбросить приложение',
    setupPassword: 'Установить пароль',
    setupPasswordDescription: 'Защитите ваши сессии паролем',
    createPassword: 'Создать пароль',
    confirmPassword: 'Подтвердите пароль',
    passwordMismatch: 'Пароли не совпадают',
    passwordTooWeak: 'Пароль слишком слабый',
    passwordCreated: 'Защита паролем успешно включена',
    changePassword: 'Изменить пароль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    passwordChanged: 'Пароль успешно изменен',
    disablePassword: 'Отключить защиту паролем',
    disablePasswordMessage: 'Вы уверены, что хотите отключить защиту паролем? Ваши сессии будут доступны без пароля.',
    passwordDisabled: 'Защита паролем отключена',
    anonymousMode: 'Анонимный режим',
    anonymousModeDescription: 'Использовать временные учетные данные без сохранения информации об аккаунте',
    enableAnonymousMode: 'Включить анонимный режим',
    anonymousModeEnabled: 'Анонимный режим включен. Данные вашей сессии не будут сохранены.',
    passwordStrengthWeak: 'Слабый',
    passwordStrengthMedium: 'Средний',
    passwordStrengthStrong: 'Надёжный',
    passwordsMatch: 'Пароли совпадают',
    setup: 'Настройка',
    skipForNow: 'Пропустить пока',
    // Password recovery
    recoveryTitle: 'Восстановление пароля',
    recoveryDescription: 'Выберите способ восстановления доступа к вашему аккаунту',
    biometricResetPrompt: 'Пройдите аутентификацию для сброса пароля',
    useOtherMethod: 'Использовать другой способ',
    resetPasswordTitle: 'Сброс пароля',
    resetPasswordBiometric:
      'Ваша личность подтверждена. Это действие удалит защиту паролем, сохранив данные ваших сессий в безопасности.',
    resetPassword: 'Сбросить пароль',
    resetAppTitle: 'Сброс приложения',
    resetAppWarning:
      'Это удалит ВСЕ ваши данные, включая сессии, настройки и информацию об аккаунте. Это действие нельзя отменить.',
    resetAppDescription: 'Удалить все данные и начать заново',
    confirmReset: 'Вы абсолютно уверены?',
    confirmResetMessage:
      'Это безвозвратно удалит всё. Вам потребуется восстановить аккаунт с помощью секретного ключа.',
    yesResetEverything: 'Да, сбросить всё',
    passwordResetSuccess: 'Защита паролем удалена. Вы можете установить новый пароль в Настройках.',
    useFaceID: 'Использовать Face ID',
    useTouchID: 'Использовать Touch ID',
    biometricRecoveryDescription: 'Сбросить пароль с помощью биометрической аутентификации',
    useSecretKey: 'Использовать секретный ключ',
    secretKeyRecoveryDescription: 'Восстановить аккаунт с помощью резервного секретного ключа',
    recoveryFooter: 'Если вам нужна помощь в восстановлении аккаунта, эти опции проведут вас через весь процесс.',
    backToUnlock: 'Вернуться к экрану разблокировки',
    processing: 'Обработка...',
  },

  passwordMigration: {
    // Password migration banner for existing users
    title: 'Защитите свои сессии',
    description:
      'Добавьте защиту паролем для безопасности ваших сессий программирования. Ваши данные останутся конфиденциальными с возможностью биометрической разблокировки.',
    setupNow: 'Настроить сейчас',
    learnMore: 'Узнать больше',
    compactTitle: 'Включить защиту паролем',
  },

  artifacts: {
    // Artifacts feature
    title: 'Артефакты',
    countSingular: '1 артефакт',
    countPlural: ({ count }: { count: number }) => `${count} артефактов`,
    empty: 'Пока нет артефактов',
    emptyDescription: 'Создайте свой первый артефакт, чтобы начать',
    new: 'Новый артефакт',
    edit: 'Редактировать артефакт',
    delete: 'Удалить',
    updateError: 'Не удалось обновить артефакт. Попробуйте еще раз.',
    notFound: 'Артефакт не найден',
    discardChanges: 'Отменить изменения?',
    discardChangesDescription: 'У вас есть несохраненные изменения. Вы уверены, что хотите их отменить?',
    deleteConfirm: 'Удалить артефакт?',
    deleteConfirmDescription: 'Это действие нельзя отменить',
    titleLabel: 'ЗАГОЛОВОК',
    titlePlaceholder: 'Введите заголовок для вашего артефакта',
    bodyLabel: 'СОДЕРЖАНИЕ',
    bodyPlaceholder: 'Напишите ваше содержание здесь...',
    emptyFieldsError: 'Пожалуйста, введите заголовок или содержание',
    createError: 'Не удалось создать артефакт. Попробуйте еще раз.',
    save: 'Сохранить',
    saving: 'Сохранение...',
    loading: 'Загрузка артефактов...',
    error: 'Ошибка загрузки артефакта',
  },
} as const;

export type TranslationsRu = typeof ru;
