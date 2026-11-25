# PrepCrux

PrepCrux is a React Native study-app prototype inspired by a purple, card-based mobile interface. It currently uses sample content rather than user-created materials.

## Features

- Welcome screen and a library of four sample study units.
- A unit screen with a flippable flashcard, a one-question quiz with immediate feedback, a reviewer, and a short summary.
- In-memory navigation and quiz state. No information is saved between sessions.

## Stack and structure

- React Native and React 19, using Expo SDK 53; React Native Web supports the browser preview.
- `App.js`: sample unit content, screen navigation, components, and styles.
- `app.json`: Expo app metadata and orientation.
- `package.json` and `package-lock.json`: dependencies and npm scripts.
- `.gitignore`: excludes dependencies and generated output.

## Setup and running

Install Node.js and npm, then run:

```sh
npm install
npm start
```

Use the Expo development server instructions to open the app on a device or emulator. Alternatively, run `npm run android`, `npm run ios`, or `npm run web`. Android and iOS require appropriate local tooling or a compatible Expo Go installation; iOS simulator tooling requires macOS.

There are currently no project-specific environment variables or secrets.

## Build and test

`npm run export` invokes Expo's export command; for a web-only static export use `npx expo export --platform web`. Native installable builds and store deployment are not configured. There is no automated test suite yet.

## APIs, storage, and deployment

There are no API endpoints, database, persistent storage, or deployment configuration. The exported web files are written to `dist/`; publishing them is not configured in this repository.

## Limitations and development notes

- Content is hard-coded. Creating, editing, deleting, importing, or saving study materials is not implemented.
- Quizzes provide feedback on one sample question per unit; there is no progress tracking or saved score.
- Authentication, cloud sync, sharing, and AI-generated content are not implemented.
- `npm audit` reports vulnerabilities in transitive dependencies, including high-severity advisories in development/build tooling. Review these before production use and update the Expo stack when a compatible fix is available.
- Update this document whenever functionality or configuration changes.
