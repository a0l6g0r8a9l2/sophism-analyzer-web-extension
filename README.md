# Sophism Analyzer

A Chrome extension that detects logical fallacies and manipulative techniques in YouTube videos using Google Gemini AI.

**Available Languages:** [English](#english) | [Русский](#русский)

---

## English

### Overview

Sophism Analyzer is a browser extension that intelligently analyzes YouTube video content to identify logical fallacies, emotional manipulation, and rhetorical tricks. Using Google's Gemini AI, it provides real-time feedback as you watch videos.

### Features

- **AI-Powered Analysis**: Leverages Google Gemini 3.5 Flash to analyze video content
- **Visual Timeline Markers**: Shows exact timestamps where fallacies occur on the video progress bar
- **Real-Time Notifications**: Displays fallacy cards during playback at the moment they occur
- **Fallacy Counter**: Widget showing total number of fallacies detected
- **Detailed List View**: Expandable list with all detected fallacies, sorted by timestamp
- **Multiple Languages**: Support for English, Russian, Simplified Chinese, and Spanish
- **SPA Navigation**: Works seamlessly when navigating between YouTube videos without page reloads

### Fallacy Categories

The extension detects and categorizes three types of fallacies:

**Logical Fallacies** — violations of valid reasoning:
- Ad hominem (attacking the person, not the argument)
- Straw man (misrepresenting opponent's position)
- False dilemma (presenting only 2 options when more exist)
- Circular reasoning (conclusion restates premise)
- Appeal to authority (citing unqualified sources)
- Hasty generalization (broad claims from few examples)
- False cause (assuming causation without evidence)

**Emotional Manipulation** — appeals bypassing logic:
- Appeal to fear/anxiety
- Appeal to anger
- Appeal to pity/sympathy
- Appeal to desires/wishes
- Exaggeration for effect

**Rhetorical Tricks** — deceptive presentation:
- Loaded language (charged words to bias opinion)
- False equivalence (treating unequal things as equal)
- Red herring (introducing irrelevant topics)
- Bait-and-switch (changing argument mid-discussion)
- Vague/ambiguous claims (avoiding specificity)

### Technologies

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Manifest V3** - Modern Chrome extension standards
- **Google Generative AI SDK** - Gemini API integration
- **Chrome Extension APIs** - Native browser integration

### Installation

#### From Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sophism-analyzer-web-extension.git
cd sophism-analyzer-web-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open `chrome://extensions` in your browser
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `dist/` folder from this project

#### From Chrome Web Store

*(Coming soon)*

### Quick Start

1. **Get an API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Create or select a project
   - Generate a new API key

2. **Configure the Extension**:
   - Click the Sophism Analyzer icon in your Chrome toolbar
   - Paste your Gemini API key in the input field
   - Click **Save**

3. **Analyze a Video**:
   - Navigate to any YouTube video
   - Click the **brain icon** in the YouTube player controls
   - Wait for the analysis to complete (may take 30-60 seconds depending on video length)
   - Watch for fallacy markers on the timeline
   - Fallacy cards will appear as you play through the video
   - Click the counter to view the complete list of detected fallacies

### Usage

#### Interface Components

- **Analyze Button** (brain icon): Triggers AI analysis of the current video
- **Counter Widget** (⚠️ badge): Shows total number of fallacies; click to expand detailed list
- **Timeline Markers**: Red/orange dots on progress bar indicating fallacy locations
- **Fallacy Cards**: Pop-up notifications showing fallacy details during playback
- **Fallacy List**: Comprehensive list with severity indicators and timestamps

#### Severity Levels

- **HIGH**: Contains misleading information that significantly distorts reasoning
- **MEDIUM**: Weakens the argument but doesn't completely invalidate it
- **LOW**: Style choices or minor logical inconsistencies

### Development

#### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Preview production build
npm run preview
```

#### Project Structure

```
sophism-analyzer-web-extension/
├── manifest.json              # Manifest V3 extension configuration
├── vite.config.ts             # Vite build configuration
├── package.json
├── tsconfig.json
├── src/
│   ├── shared/
│   │   └── types.ts           # Shared TypeScript types
│   ├── popup/
│   │   ├── popup.html         # API key input UI
│   │   ├── popup.ts           # Configuration logic
│   │   └── popup.css          # Popup styles
│   ├── background/
│   │   └── index.ts           # Service Worker (Gemini API calls)
│   ├── content/
│   │   ├── index.ts           # Content script orchestrator
│   │   ├── button.ts          # Analyze button UI
│   │   ├── markers.ts         # Timeline markers
│   │   ├── counter.ts         # Fallacy counter widget
│   │   ├── cards.ts           # Fallacy notification cards
│   │   ├── list.ts            # Detailed fallacy list
│   │   ├── navigation.ts      # YouTube SPA detection
│   │   └── styles.css         # All UI styles
│   └── assets/
│       └── icons/             # Extension icons
└── dist/                      # Production build (generated)
```

#### Debug Mode

During development, debug logging can be enabled to see detailed console output. The extension automatically disables debug logs in production builds.

To view debug logs in development:
1. Run `npm run dev`
2. Open Chrome DevTools (F12)
3. Check the Console tab for extension logs

#### Message Flow

The extension uses Chrome's message passing system for communication:

1. **Content Script** → **Background**:
   - `ANALYZE_VIDEO`: Request to analyze video content

2. **Background** → **Content Script**:
   - `ANALYSIS_RESULT`: Returns detected fallacies
   - `ANALYSIS_ERROR`: Returns error message

### Configuration

#### Language Selection

The extension automatically detects your browser language. Supported languages:
- English
- Русский (Russian)
- 简体中文 (Simplified Chinese)
- Español (Spanish)

To manually change the language, update the `language` setting in `chrome.storage.local`.

#### API Key Storage

- API keys are stored locally in `chrome.storage.local`
- Keys are never transmitted to external servers
- Delete your API key through the extension popup to clear it

### Troubleshooting

#### Extension doesn't appear on YouTube
- Ensure you're on YouTube.com (not other video platforms yet)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions`

#### Analysis takes too long
- This depends on video length and your internet connection
- Analysis typically takes 30-60 seconds for standard videos
- Longer videos may take additional time

#### API key error
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check you have proper API quotas available
- Ensure your API key hasn't expired

#### No fallacies detected
- This might mean the video contains minimal logical fallacies
- The AI may not detect subtle manipulations
- Some videos may genuinely have sound reasoning

#### Extension context invalidated
- This occurs when the extension is updated while in use
- Simply reload the YouTube page to re-inject the extension

### API Quotas & Costs

This extension uses Google's Gemini API:

- **Gemini 3.5 Flash** is used for analysis
- API usage is subject to Google Cloud quotas and pricing
- Free tier: 15 requests per minute
- Each video analysis counts as 1 request

Monitor your usage at [Google Cloud Console](https://console.cloud.google.com/)

### Privacy & Security

- Your API key is stored **locally on your device only**
- Video content is sent to Google Gemini for analysis (per Google's Privacy Policy)
- We do not store, log, or transmit analysis results to external servers
- No personal data is collected by this extension

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for detailed information.

### License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

### Support

Found a bug or have a feature request? Please open an [issue on GitHub](https://github.com/yourusername/sophism-analyzer-web-extension/issues).

### Acknowledgments

- [Google Generative AI](https://ai.google.dev/) for the Gemini API
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/) for reference
- YouTube for providing a platform to analyze

---

## Русский

### Обзор

Sophism Analyzer — это расширение для Chrome, которое анализирует содержимое YouTube видео и выявляет логические ошибки, эмоциональные манипуляции и риторические приёмы. Используя Google Gemini AI, оно предоставляет анализ в реальном времени по мере просмотра видео.

### Функциональность

- **AI-анализ**: Использует Google Gemini 3.5 Flash для анализа контента видео
- **Маркеры на шкале времени**: Показывает точные временные метки, где встречаются софизмы
- **Уведомления в реальном времени**: Отображает карточки софизмов при их появлении в видео
- **Счётчик софизмов**: Виджет с общим количеством найденных ошибок
- **Детальный список**: Раскрывающийся список всех обнаруженных ошибок, отсортированный по времени
- **Поддержка нескольких языков**: Английский, русский, китайский (упрощённый) и испанский
- **Работа с SPA**: Бесперебойно работает при переходе между YouTube видео без перезагрузки страницы

### Категории софизмов

Расширение обнаруживает и категоризирует три типа софизмов:

**Логические ошибки** — нарушения корректного рассуждения:
- Ad Hominem (переход на личности)
- Straw Man (соломенное чучело - искажение, утрирование оригинала)
- Ложная дилемма (предложение только 2 вариантов)
- Циркулярное рассуждение (вывод повторяет посылку)
- Апелляция к авторитету (ссылка на неквалифицированные источники)
- Поспешное обобщение (широкие выводы из нескольких примеров)
- Ложная причинность (предположение о причинной связи без доказательств)

**Эмоциональные манипуляции** — апелляции, обходящие логику:
- Апелляция к страху
- Апелляция к гневу
- Апелляция к жалости
- Апелляция к желаниям
- Преувеличение для эффекта

**Риторические приёмы** — обманчивое представление:
- Нагруженный язык (эмоционально окрашенные слова)
- Ложная эквивалентность (отождествление неравных вещей)
- Красная селёдка (введение нерелевантных тем)
- Приманка-подмена (смена аргумента по ходу беседы)
- Неоднозначные утверждения (избегание конкретики)

### Технологии

- **TypeScript** — безопасная типизация
- **Vite** — быстрый инструмент сборки
- **Manifest V3** — современные стандарты расширений
- **Google Generative AI SDK** — интеграция Gemini API
- **Chrome Extension APIs** — встроенные браузерные API

### Установка

#### Из исходного кода (Разработка)

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/sophism-analyzer-web-extension.git
cd sophism-analyzer-web-extension
```

2. Установите зависимости:
```bash
npm install
```

3. Соберите расширение:
```bash
npm run build
```

4. Загрузите расширение в Chrome:
   - Откройте `chrome://extensions` в браузере
   - Включите **режим разработчика** (переключатель в правом верхнем углу)
   - Нажмите **Загрузить распакованное расширение**
   - Выберите папку `dist/` из этого проекта

#### Из Chrome Web Store

*(Скоро)*

### Быстрый старт

1. **Получите API ключ**:
   - Перейдите на [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Войдите в свой аккаунт Google
   - Создайте или выберите проект
   - Сгенерируйте новый API ключ

2. **Настройте расширение**:
   - Кликните на значок Sophism Analyzer в панели Chrome
   - Вставьте ваш Gemini API ключ в поле ввода
   - Нажмите **Сохранить**

3. **Анализируйте видео**:
   - Откройте любое YouTube видео
   - Нажмите кнопку **мозга** в элементах управления плеером
   - Дождитесь завершения анализа (30-60 секунд в зависимости от длины)
   - Смотрите маркеры софизмов на шкале времени
   - Карточки появятся при воспроизведении
   - Кликните на счётчик для просмотра полного списка

### Использование

#### Компоненты интерфейса

- **Кнопка анализа** (значок мозга): Запускает AI анализ текущего видео
- **Виджет счётчика** (⚠️ значок): Показывает количество софизмов; кликните для раскрытия
- **Маркеры на шкале**: Красные/оранжевые точки на прогрессбаре
- **Карточки софизмов**: Всплывающие уведомления во время воспроизведения
- **Список софизмов**: Полный список с уровнями серьёзности и временем

#### Уровни серьёзности

- **ВЫСОКИЙ**: Содержит информацию, которая значительно искажает рассуждение
- **СРЕДНИЙ**: Ослабляет аргумент, но не полностью его опровергает
- **НИЗКИЙ**: Стилистические выборы или незначительные логические несоответствия

### Разработка

#### Доступные команды

```bash
# Сервер разработки с горячей перезагрузкой
npm run dev

# Сборка для продакшена
npm run build

# Проверка типов
npm run typecheck

# Предпросмотр сборки
npm run preview
```

#### Структура проекта

```
sophism-analyzer-web-extension/
├── manifest.json              # Конфигурация Manifest V3
├── vite.config.ts             # Конфигурация Vite
├── package.json
├── tsconfig.json
├── src/
│   ├── shared/
│   │   └── types.ts           # Общие TypeScript типы
│   ├── popup/
│   │   ├── popup.html         # UI ввода API ключа
│   │   ├── popup.ts           # Логика конфигурации
│   │   └── popup.css          # Стили popup
│   ├── background/
│   │   └── index.ts           # Service Worker (вызовы Gemini API)
│   ├── content/
│   │   ├── index.ts           # Оркестрация контент-скрипта
│   │   ├── button.ts          # Кнопка анализа
│   │   ├── markers.ts         # Маркеры на шкале
│   │   ├── counter.ts         # Виджет счётчика
│   │   ├── cards.ts           # Карточки уведомлений
│   │   ├── list.ts            # Детальный список
│   │   ├── navigation.ts      # Детекция YouTube SPA
│   │   └── styles.css         # Все стили UI
│   └── assets/
│       └── icons/             # Иконки расширения
└── dist/                      # Сборка для продакшена (генерируется)
```

#### Режим отладки

При разработке вы можете просмотреть логи отладки. Расширение автоматически отключает их в продакшене.

Для просмотра логов:
1. Запустите `npm run dev`
2. Откройте DevTools браузера (F12)
3. Проверьте консоль для логов расширения

#### Поток сообщений

Расширение использует систему передачи сообщений Chrome:

1. **Content Script** → **Background**:
   - `ANALYZE_VIDEO`: Запрос на анализ видео

2. **Background** → **Content Script**:
   - `ANALYSIS_RESULT`: Возвращает обнаруженные софизмы
   - `ANALYSIS_ERROR`: Возвращает сообщение об ошибке

### Конфигурация

#### Выбор языка

Расширение автоматически определяет язык вашего браузера. Поддерживаемые языки:
- English
- Русский
- 简体中文 (Упрощённый китайский)
- Español

Для ручного изменения языка обновите параметр `language` в `chrome.storage.local`.

#### Хранение API ключей

- API ключи хранятся локально в `chrome.storage.local`
- Ключи никогда не передаются на внешние серверы
- Удалите ключ через всплывающее окно расширения

### Устранение неполадок

#### Расширение не появляется на YouTube
- Убедитесь, что вы находитесь на YouTube.com
- Попробуйте обновить страницу
- Проверьте, что расширение включено в `chrome://extensions`

#### Анализ занимает слишком много времени
- Время зависит от длины видео и скорости интернета
- Обычно анализ занимает 30-60 секунд
- Длинные видео могут требовать больше времени

#### Ошибка API ключа
- Проверьте, что ключ действителен на [Google AI Studio](https://aistudio.google.com/app/apikey)
- Убедитесь в наличии квоты API
- Проверьте, что ключ не истёк

#### Софизмы не обнаружены
- Видео может содержать минимум логических ошибок
- AI может не выявить тонкие манипуляции
- Видео может иметь корректные рассуждения

#### Контекст расширения инвалиден
- Это происходит при обновлении расширения во время использования
- Просто перезагрузите страницу YouTube

### API квоты и стоимость

Расширение использует Google Gemini API:

- Используется **Gemini 3.5 Flash**
- Использование зависит от квот и тарифов Google Cloud
- Бесплатный уровень: 15 запросов в минуту
- Каждый анализ видео = 1 запрос

Мониторьте использование в [Google Cloud Console](https://console.cloud.google.com/)

### Приватность и безопасность

- Ваш API ключ хранится **только локально на вашем устройстве**
- Контент видео отправляется в Google Gemini (согласно политике Google)
- Мы не сохраняем, не логируем и не передаём результаты анализа
- Расширение не собирает персональные данные

Подробнее см. [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

### Лицензия

Проект лицензирован под MIT лицензией — см. файл [LICENSE](LICENSE).

### Поддержка

Нашли баг или есть идея? Откройте [issue на GitHub](https://github.com/yourusername/sophism-analyzer-web-extension/issues).

### Благодарности

- [Google Generative AI](https://ai.google.dev/) за Gemini API
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/) за справочную информацию
- YouTube за возможность анализа контента
