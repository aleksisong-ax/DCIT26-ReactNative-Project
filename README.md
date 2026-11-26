# StudyPrep

StudyPrep is a mobile-first React Native study app for making and practicing with learning materials. It includes four sample study units, an Elementary Mathematics unit for Grades 1–6, and dictionary-backed vocabulary activities. The same app can run on iOS, Android, and the web through Expo and React Native Web.

## Features

- Create quizzes with multiple-choice and identification questions. Multiple-choice options must be distinct; identification answers are graded case-insensitively after whitespace normalization, but synonyms and spelling variations are not accepted.
- Practice quizzes with immediate feedback and an in-session score. Quiz results are not saved.
- Create flashcard decks, flip cards, and move through a deck. Screen entrances, card flips, and feedback transitions respect the device's reduced-motion preference.
- Write and read notes or reviewers; delete saved materials with confirmation.
- Explore four sample study units, each with a flashcard, one-question quiz, reviewer, and summary.
- Study Elementary Mathematics at Primary (Grades 1–3) or Intermediate (Grades 4–6) level. Each tier has four focus areas; each focus area includes topic cards, a visual example, and 10 practice questions. Answers and feedback last only while the lesson is open.
- Use a locally selected word of the day or take vocabulary activities that ask for a word's meaning or the word matching a definition. Activities use up to five questions per attempt and require at least four dictionary definitions to load. The 16-word curated list cycles according to the device's local calendar date; it is not Merriam-Webster's word of the day.
- Save personal study materials locally on the device or in the browser with AsyncStorage. There is no account or cloud sync.

To make content, open **Your materials** and choose a type. Tap an item in **Your collection** to study it.

## Technology stack

- Expo SDK `~53.0.0`, React `19.0.0`, React Native `0.79.6`, and React Native Web `^0.20.0`.
- `@react-native-async-storage/async-storage` `2.1.2` for local persistence; Expo Status Bar `~2.2.3` and Metro runtime `~5.0.4` are also declared dependencies.
- React Native's built-in `Animated` API for transitions and flashcard motion.
- npm with a committed `package-lock.json` for reproducible dependency installation.

## Project structure

```text
.
├── App.js                         # Main navigation, sample units, shared home/unit screens, styles
├── app.json                       # Expo metadata, portrait/light appearance, Pages base path
├── package.json                   # Dependencies and npm scripts
├── package-lock.json              # Locked dependency tree
├── README.md                      # Project documentation
├── SECURITY.md                    # Security practices, audit notes, and reporting guidance
├── .gitignore                     # Generated output, local environment files, signing keys
├── .github/workflows/pages.yml    # Static web build and GitHub Pages deployment
└── src/
    ├── MyMaterials.js             # Material creation, local storage, validation, study flows
    ├── Vocabulary.js              # Word of the day and dictionary activities
    ├── ElementaryMath.js           # Math tier, lesson, and practice screens
    ├── mathLessons.js              # Lesson topics, examples, and first question per area
    ├── mathPractice.js             # Nine additional practice questions per area
    ├── FlipCard.js                 # Shared animated flashcard component
    ├── Entrance.js                 # Reusable entrance transition
    └── useReducedMotion.js         # Web/native reduced-motion preference handling
```

## Setup and running

Use Node.js 20 and npm (Node 20 is also used by the GitHub Pages workflow). From a shell:

```sh
git clone https://github.com/aleksisong-ax/DCIT26-ReactNative-Project.git
cd DCIT26-ReactNative-Project
npm ci
npm start
```

Expo starts a development server and displays options for opening the app. Available scripts are:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run web` | Start the app for web development. |
| `npm run android` | Start Expo with the Android target. |
| `npm run ios` | Start Expo with the iOS target. |
| `npm run export` | Run Expo's static export using its default platform selection. |

Android and iOS use the Expo development server; a compatible Expo Go installation or platform tooling/emulator may be needed. iOS simulator tooling requires macOS.

There are no app-specific environment variables. The Pages workflow uses GitHub's automatically provided workflow token; no repository secret is required by the current code or workflow.

## Build and test

The deployment build command is:

```sh
npx expo export --platform web
```

It creates the static web output in `dist/`. The GitHub Actions workflow runs this same command. `npm run export` is the general Expo export script and uses the CLI's default platform selection.

There is currently no automated unit, integration, or UI test suite, and no lint script. A successful web export checks that Expo can resolve and bundle the app; it is not a substitute for exercising the app on web and native targets. Run `npm audit` to review known dependency advisories.

## Local data and APIs

### Saved materials

There is no server database. AsyncStorage uses the key `@prepcrux/materials-v1` and stores a JSON array with these material shapes:

- Quiz: `{ id, kind: 'quiz', title, questions }`; each question stores its type, prompt, four options, correct option index, and expected identification answer.
- Flashcard deck: `{ id, kind: 'flashcards', title, cards }`; each card stores a front and back.
- Notes: `{ id, kind: 'notes', title, notes }`.

On load, the app checks the saved records before rendering them. If the stored value is malformed or incompatible, it leaves the data untouched and disables create/delete operations rather than overwriting it. Browser storage and device storage are local and unencrypted; clearing browser data, uninstalling the app, or changing devices can remove access. Do not store sensitive information. Materials cannot currently be edited, imported, exported, backed up, or synced.

### Dictionary

Vocabulary activities request English entries from:

```text
https://freedictionaryapi.com/api/v1/entries/en/{word}
```

Words are drawn from the 16-item list in `src/Vocabulary.js`; the app URL-encodes each word, uses the first available definition, and times out dictionary requests after 12 seconds. An internet connection is required. Dictionary content is displayed as text, not interpreted as HTML. Definitions are from Wiktionary contributors via [Free Dictionary API](https://freedictionaryapi.com/) and are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source entries, attribution, and license links are shown in the app. No Merriam-Webster content is used.

There are no other app API endpoints, authentication services, or backend services.

## Deployment

`.github/workflows/pages.yml` builds the web app and deploys `dist/` to GitHub Pages when code is pushed to `main`; it can also be started manually from the Actions tab. In the repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The configured site URL is <https://aleksisong-ax.github.io/DCIT26-ReactNative-Project/>.

`app.json` sets `expo.experiments.baseUrl` to `/DCIT26-ReactNative-Project`, matching this repository's Pages path. Update that value if deploying under a different path. The workflow grants read access to the build job and Pages deployment permissions only to the deploy job; action references are pinned to full commit SHAs.

Native installable builds and app-store deployment are not configured in this repository.

## Limitations and development notes

- The app has no authentication, server-side authorization, cloud sync, progress tracking, persistent quiz scores, or AI-generated content.
- Local data is not encrypted or backed up and is unsuitable for sensitive information.
- The dictionary depends on a third-party service and may be unavailable or rate-limited; failures are shown with a retry option.
- `npm audit` currently reports transitive Expo/build-tool dependency advisories. See [SECURITY.md](SECURITY.md) for the audit scope, remaining findings, and upgrade guidance.
- Keep documentation synchronized with the implementation. The Expo SDK is pinned at version 53; a major SDK upgrade should be planned and tested rather than applied with a forced dependency fix.
