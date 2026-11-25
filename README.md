# PrepCrux

PrepCrux is a mobile-first React Native study app for creating and practicing with learning materials. It also includes four sample study units.

## Features

- Create quizzes containing multiple-choice and identification questions. Choose the correct multiple-choice option or specify an expected identification answer.
- Take quizzes, receive immediate feedback, and see a final score. Identification answers ignore case and differences in surrounding or repeated whitespace, but otherwise must match exactly.
- Create flashcard decks with multiple cards and flip through them.
- Create and read notes or reviewers.
- Delete saved materials with confirmation.
- Explore the original sample study units, including a flashcard, quiz, reviewer, and summary for each.
- Materials are saved locally on the device or in the browser using AsyncStorage; quiz results are not saved.

To create content, enter the app, tap **Create & study your own materials**, and choose a material type. Tap a saved item in **Your collection** to study it.

## Stack and structure

- React Native and React 19, using Expo SDK 53; React Native Web supports the browser version.
- `@react-native-async-storage/async-storage` stores materials locally (browser storage on web).
- `App.js`: sample units, main navigation, and original screens.
- `src/MyMaterials.js`: personal material creation, local storage, and practice screens.
- `app.json`: Expo app metadata, orientation, and GitHub Pages base path.
- `package.json` and `package-lock.json`: dependencies and npm scripts.
- `.github/workflows/pages.yml`: GitHub Pages build and deployment.
- `.gitignore`: excludes dependencies and generated output.

## Setup and running

Install Node.js and npm, then run:

```sh
npm ci
npm start
```

Use the Expo development server instructions to open the app on a device or emulator. Alternatively, run `npm run android`, `npm run ios`, or `npm run web`. Android and iOS require appropriate local tooling or a compatible Expo Go installation; iOS simulator tooling requires macOS.

There are currently no project-specific environment variables or secrets.

## Build and test

`npm run export` invokes Expo's export command; for a web-only static export use `npx expo export --platform web`. Native installable builds and store deployment are not configured. There is no automated test suite in the repository yet.

## Storage, APIs, and deployment

Materials are stored under the AsyncStorage key `@prepcrux/materials-v1` as a JSON array of quizzes, flashcard decks, and notes. This storage is local and unencrypted; clearing browser data, uninstalling the app, or changing devices may remove access to the materials. Do not store sensitive information. There are no API endpoints, server database, or accounts.

GitHub Actions builds the web app on pushes to `main` and deploys `dist/` to GitHub Pages using `.github/workflows/pages.yml`. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**. The site is at https://aleksisong-ax.github.io/DCIT26-ReactNative-Project/.

The Expo `experiments.baseUrl` setting in `app.json` matches the repository path. Change it if deploying to a different path. The workflow can also be started manually from the Actions tab.

## Limitations and development notes

- Saved materials cannot currently be edited, imported, exported, or shared. Delete and recreate an item to change it.
- Identification grading accepts one expected text answer; it does not evaluate synonyms or spelling variations.
- No persistent quiz results, progress tracking, authentication, cloud sync, or AI-generated content.
- Local data is not backed up or synced and is not suitable for sensitive information.
- `npm audit` has reported vulnerabilities in transitive dependencies, including high-severity advisories in development/build tooling. Review these before production use and update the Expo stack when a compatible fix is available.
