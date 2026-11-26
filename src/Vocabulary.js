import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Entrance from './Entrance';

// A small curated list keeps the daily word and the quiz topics predictable and appropriate for learners.
const CURATED_WORDS = [
  'curious',
  'resilient',
  'diligent',
  'vivid',
  'adapt',
  'observe',
  'generous',
  'abundant',
  'meticulous',
  'serene',
  'innovate',
  'eloquent',
  'fragile',
  'cautious',
  'versatile',
  'radiant',
];
const DICTIONARY_ENTRIES_API = 'https://freedictionaryapi.com/api/v1/entries/en/';
const DICTIONARY_API_HOME = 'https://freedictionaryapi.com/';
const DEFINITION_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

function shuffle(items) {
  const shuffledItems = [...items];
  // Fisher-Yates gives each ordering an equal chance without mutating the original list.
  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex],
      shuffledItems[index],
    ];
  }
  return shuffledItems;
}
function dailyWord() {
  const now = new Date();
  // Calendar dates are calculated in the user's local timezone, without DST-related hour offsets.
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return CURATED_WORDS[
    ((day % CURATED_WORDS.length) + CURATED_WORDS.length) % CURATED_WORDS.length
  ];
}
async function fetchDictionaryEntry(word, signal) {
  const response = await fetch(DICTIONARY_ENTRIES_API + encodeURIComponent(word), { signal });
  if (!response.ok) throw new Error('Dictionary request failed');
  const data = await response.json();
  for (const entry of data.entries || []) {
    const sense = (entry.senses || []).find(
      (item) => typeof item.definition === 'string' && item.definition.trim(),
    );
    if (sense)
      return {
        word,
        definition: sense.definition,
        partOfSpeech: entry.partOfSpeech || '',
        sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
      };
  }
  throw new Error('No definition available');
}
function Action({ label, onPress, secondary = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
function ExternalLink({ label, url }) {
  return (
    <Text
      accessibilityRole="link"
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={styles.link}
    >
      {label}
    </Text>
  );
}
function Credit({ entries = [] }) {
  return (
    <View style={styles.credit}>
      <Text style={styles.creditText}>
        Definitions from Wiktionary contributors via{' '}
        <ExternalLink label="Free Dictionary API" url={DICTIONARY_API_HOME} />. Licensed{' '}
        <ExternalLink label="CC BY-SA 4.0" url={DEFINITION_LICENSE_URL} />. Entries are selected and
        formatted for this activity.
      </Text>
      {entries.length > 0 && (
        <Text style={styles.creditText}>
          Source entries:{' '}
          {entries.map((entry, i) => (
            <Text key={entry.word}>
              {i > 0 ? ', ' : ''}
              <ExternalLink label={entry.word} url={entry.sourceUrl} />
            </Text>
          ))}
        </Text>
      )}
    </View>
  );
}

export default function Vocabulary({ onExit }) {
  const [page, setPage] = useState('menu');
  const [mode, setMode] = useState('quiz');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [wordOfTheDay, setWordOfTheDay] = useState(dailyWord);

  useEffect(() => {
    if (page !== 'daily' && page !== 'activity') return undefined;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    async function loadDictionaryContent() {
      setLoading(true);
      setError('');
      setEntries([]);
      try {
        const requestedWords =
          page === 'daily' ? [wordOfTheDay] : shuffle(CURATED_WORDS).slice(0, 8);
        // Individual failures do not prevent a quiz when enough dictionary entries are available.
        const fetchedEntries = await Promise.all(
          requestedWords.map((word) =>
            fetchDictionaryEntry(word, controller.signal).catch(() => null),
          ),
        );
        const availableEntries = fetchedEntries.filter(Boolean);
        if (availableEntries.length < (page === 'daily' ? 1 : 4))
          throw new Error('Not enough definitions available');
        if (!active) return;
        setEntries(availableEntries);
        if (page === 'activity') {
          const generatedQuestions = shuffle(availableEntries)
            .slice(0, Math.min(5, availableEntries.length))
            .map((answer) => ({
              answer,
              options: shuffle([
                answer,
                ...shuffle(availableEntries.filter((entry) => entry.word !== answer.word)).slice(
                  0,
                  3,
                ),
              ]),
            }));
          setQuizQuestions(generatedQuestions);
        }
      } catch {
        if (active)
          setError('Could not load dictionary content. Check your connection and try again.');
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    loadDictionaryContent();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page, retryAttempt, wordOfTheDay]);

  function startActivity(activityMode) {
    setMode(activityMode);
    setQuestionIndex(0);
    setScore(0);
    setSelectedWord(null);
    setAnswerChecked(false);
    setSelectionError(false);
    setQuizQuestions([]);
    setPage('activity');
  }
  function startDaily() {
    setWordOfTheDay(dailyWord());
    setPage('daily');
  }
  function checkAnswer() {
    if (selectedWord === null) {
      setSelectionError(true);
      return;
    }
    if (answerChecked) return;
    if (selectedWord === quizQuestions[questionIndex].answer.word) setScore((value) => value + 1);
    setAnswerChecked(true);
  }
  function advanceQuestion() {
    if (questionIndex + 1 === quizQuestions.length) setPage('result');
    else {
      setQuestionIndex(questionIndex + 1);
      setSelectedWord(null);
      setAnswerChecked(false);
      setSelectionError(false);
    }
  }
  function goBack() {
    if (page === 'menu') onExit();
    else {
      setError('');
      setPage('menu');
    }
  }
  const currentQuestion = quizQuestions[questionIndex];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {page === 'menu'
              ? 'Vocabulary'
              : page === 'daily'
                ? 'Word of the day'
                : mode === 'quiz'
                  ? 'Word quiz'
                  : 'Vocabulary test'}
          </Text>
          <Text style={styles.headerSubtitle}>English dictionary activities</Text>
        </View>
      </View>
      <Entrance key={page} fill>
        <ScrollView contentContainerStyle={styles.body}>
          {page === 'menu' && (
            <>
              <Text style={styles.heading}>Explore words</Text>
              <Text style={styles.intro}>
                Learn a new word or test your knowledge with dictionary definitions.
              </Text>
              <View style={styles.menu}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Word of the day"
                  onPress={startDaily}
                  style={({ pressed }) => [styles.dailyFeature, pressed && styles.pressed]}
                >
                  <Text style={styles.dailyLabel}>WORD OF THE DAY</Text>
                  <Text style={styles.dailyTitle}>Discover today’s word</Text>
                  <Text style={styles.dailyLink}>View definition ↗</Text>
                </Pressable>
                <Action
                  secondary
                  label="Word quiz · choose the meaning"
                  onPress={() => startActivity('quiz')}
                />
                <Action
                  secondary
                  label="Vocabulary test · choose the word"
                  onPress={() => startActivity('test')}
                />
              </View>
              <Text style={styles.note}>
                An internet connection is required. Words are selected from a small curated list,
                not from Merriam-Webster.
              </Text>
              <Credit />
            </>
          )}
          {(page === 'daily' || page === 'activity') && (
            <>
              {loading && (
                <Text accessibilityLiveRegion="polite" style={styles.intro}>
                  Loading dictionary content…
                </Text>
              )}
              {error ? (
                <>
                  <Text accessibilityRole="alert" style={styles.error}>
                    {error}
                  </Text>
                  <Action label="Try again" onPress={() => setRetryAttempt((value) => value + 1)} />
                </>
              ) : null}
              {!loading && !error && page === 'daily' && entries[0] && (
                <>
                  <Text style={styles.word}>{entries[0].word}</Text>
                  <Text style={styles.part}>{entries[0].partOfSpeech}</Text>
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>DEFINITION</Text>
                    <Text style={styles.definition}>{entries[0].definition}</Text>
                  </View>
                  <Text style={styles.note}>
                    Changes each local calendar day; repeats after {CURATED_WORDS.length} days.
                  </Text>
                  <Credit entries={entries} />
                </>
              )}
              {!loading && !error && page === 'activity' && currentQuestion && (
                <>
                  <Text style={styles.eyebrow}>
                    QUESTION {questionIndex + 1} OF {quizQuestions.length}
                  </Text>
                  <Text style={styles.question}>
                    {mode === 'quiz'
                      ? `What does “${currentQuestion.answer.word}” mean?`
                      : `Which word matches this definition?`}
                  </Text>
                  {mode === 'test' && (
                    <View style={styles.card}>
                      <Text style={styles.definition}>{currentQuestion.answer.definition}</Text>
                    </View>
                  )}
                  {currentQuestion.options.map((option) => (
                    <Pressable
                      key={option.word}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: selectedWord === option.word,
                        disabled: answerChecked,
                      }}
                      disabled={answerChecked}
                      onPress={() => {
                        setSelectedWord(option.word);
                        setSelectionError(false);
                      }}
                      style={[styles.option, selectedWord === option.word && styles.optionSelected]}
                    >
                      <Text style={styles.optionText}>
                        {mode === 'quiz' ? option.definition : option.word}
                      </Text>
                    </Pressable>
                  ))}
                  {selectionError && (
                    <Text accessibilityRole="alert" style={styles.error}>
                      Choose an answer first.
                    </Text>
                  )}
                  {answerChecked ? (
                    <>
                      <Entrance>
                        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
                          {selectedWord === currentQuestion.answer.word
                            ? 'Correct.'
                            : `Incorrect. The answer is ${mode === 'quiz' ? currentQuestion.answer.definition : currentQuestion.answer.word}.`}
                        </Text>
                      </Entrance>
                      <Action
                        label={
                          questionIndex + 1 === quizQuestions.length
                            ? 'See results'
                            : 'Next question'
                        }
                        onPress={advanceQuestion}
                      />
                    </>
                  ) : (
                    <Action label="Check answer" onPress={checkAnswer} />
                  )}
                  <Credit
                    entries={mode === 'quiz' ? currentQuestion.options : [currentQuestion.answer]}
                  />
                </>
              )}
            </>
          )}
          {page === 'result' && (
            <>
              <Text style={styles.heading}>Test complete</Text>
              <View style={styles.score}>
                <Text style={styles.scoreNumber}>
                  {score} / {quizQuestions.length}
                </Text>
                <Text style={styles.note}>correct answers</Text>
              </View>
              <Action label="Try another" onPress={() => startActivity(mode)} />
              <View style={{ height: 10 }} />
              <Action secondary label="Back to vocabulary" onPress={() => setPage('menu')} />
              <Text style={styles.note}>
                Scores are not saved. Questions use a small curated word list.
              </Text>
              <Credit entries={entries} />
            </>
          )}
        </ScrollView>
      </Entrance>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#5935c7',
    paddingHorizontal: 25,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomRightRadius: 36,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7549e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 30, lineHeight: 34, color: '#fff' },
  headerTitle: { fontSize: 27, lineHeight: 33, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, lineHeight: 19, color: '#e2d7ff', marginTop: 6 },
  body: { padding: 25, paddingBottom: 45 },
  heading: { fontSize: 23, fontWeight: '800', color: '#26163e' },
  intro: { fontSize: 14, lineHeight: 21, color: '#685a79', marginTop: 8, marginBottom: 20 },
  menu: { gap: 10 },
  dailyFeature: {
    minHeight: 145,
    borderRadius: 20,
    backgroundColor: '#1d707a',
    padding: 20,
    justifyContent: 'flex-end',
  },
  dailyLabel: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', color: '#d7f2f2' },
  dailyTitle: { fontSize: 21, fontWeight: '800', color: '#fff', marginTop: 10 },
  dailyLink: { fontSize: 12, fontWeight: '700', color: '#fff', marginTop: 16 },
  button: {
    minHeight: 50,
    backgroundColor: '#5921db',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  secondary: { backgroundColor: '#f1eafb' },
  secondaryText: { color: '#5523bf' },
  pressed: { opacity: 0.7 },
  note: { fontSize: 12, lineHeight: 19, color: '#6d5f7b', marginTop: 18 },
  credit: { borderTopWidth: 1, borderTopColor: '#eee8f6', marginTop: 24, paddingTop: 14 },
  creditText: { fontSize: 12, lineHeight: 19, color: '#625572', marginBottom: 8 },
  link: { color: '#5420bd', textDecorationLine: 'underline' },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '800',
    color: '#715e8b',
    marginBottom: 12,
  },
  word: { fontSize: 34, fontWeight: '800', color: '#27163e' },
  part: { fontSize: 14, color: '#675775', marginTop: 5 },
  card: { backgroundColor: '#f3edfd', borderRadius: 17, padding: 20, marginVertical: 16 },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '800',
    color: '#7044bb',
    marginBottom: 10,
  },
  definition: { fontSize: 16, lineHeight: 24, color: '#342447' },
  question: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: '#30203f', marginBottom: 20 },
  option: {
    borderWidth: 1,
    borderColor: '#ded4eb',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  optionSelected: { borderColor: '#5b24d8', backgroundColor: '#f2ebff' },
  optionText: { fontSize: 15, lineHeight: 22, color: '#342247' },
  feedback: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: '#5424b7',
    marginVertical: 15,
  },
  error: { color: '#a32242', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  score: {
    backgroundColor: '#f1e9fd',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginVertical: 25,
  },
  scoreNumber: { fontSize: 40, fontWeight: '800', color: '#5921db' },
});
