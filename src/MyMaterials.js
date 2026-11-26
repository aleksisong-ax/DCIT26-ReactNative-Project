import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlipCard from './FlipCard';
import Entrance from './Entrance';

const STORAGE_KEY = '@prepcrux/materials-v1';
const emptyQuestion = () => ({
  type: 'multiple',
  prompt: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  answer: '',
});
const emptyCard = () => ({ front: '', back: '' });
const normalizeAnswer = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function isValidQuestion(question) {
  if (
    !isRecord(question) ||
    !isNonEmptyString(question.prompt) ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    !question.options.every((option) => typeof option === 'string') ||
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= question.options.length ||
    typeof question.answer !== 'string'
  ) {
    return false;
  }

  if (question.type === 'identification') return isNonEmptyString(question.answer);
  if (question.type !== 'multiple' || !question.options.every(isNonEmptyString)) return false;

  return new Set(question.options.map(normalizeAnswer)).size === question.options.length;
}
function isValidMaterial(material) {
  if (!isRecord(material) || !isNonEmptyString(material.id) || !isNonEmptyString(material.title)) {
    return false;
  }

  if (material.kind === 'notes') return isNonEmptyString(material.notes);
  if (material.kind === 'flashcards') {
    return (
      Array.isArray(material.cards) &&
      material.cards.length > 0 &&
      material.cards.every(
        (card) => isRecord(card) && isNonEmptyString(card.front) && isNonEmptyString(card.back),
      )
    );
  }
  if (material.kind === 'quiz') {
    return (
      Array.isArray(material.questions) &&
      material.questions.length > 0 &&
      material.questions.every(isValidQuestion)
    );
  }

  return false;
}
// Browser storage can be edited or damaged; validate records before the UI reads nested fields.
function parseMaterials(raw) {
  const materials = JSON.parse(raw);
  const ids = Array.isArray(materials) ? materials.map((material) => material?.id) : [];

  if (
    !Array.isArray(materials) ||
    !materials.every(isValidMaterial) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error('Invalid saved materials');
  }

  return materials;
}
function isAnswerCorrect(question, response) {
  return question.type === 'multiple'
    ? response === question.correctIndex
    : normalizeAnswer(response) === normalizeAnswer(question.answer);
}
function getCorrectAnswer(question) {
  return question.type === 'multiple' ? question.options[question.correctIndex] : question.answer;
}

function Action({ label, onPress, secondary, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
function Field({ label, value, onChangeText, multiline = false, placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#80758e"
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}
function Header({ title, subtitle, back }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={back}
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
function getHeaderTitle(page, materialKind, selectedMaterial) {
  if (page === 'list') return 'My materials';
  if (page !== 'create') return selectedMaterial?.title || 'My materials';

  if (materialKind === 'flashcards') return 'New flashcard deck';
  if (materialKind === 'notes') return 'New notes';
  return 'New quiz';
}

export default function MyMaterials({ onExit }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState('list');
  const [materialKind, setMaterialKind] = useState('quiz');
  const [materialTitle, setMaterialTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([emptyQuestion()]);
  const [flashcards, setFlashcards] = useState([emptyCard()]);
  const [error, setError] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answerResponse, setAnswerResponse] = useState(null);
  const [answerResults, setAnswerResults] = useState([]);
  const [answerChecked, setAnswerChecked] = useState(false);
  const currentQuestion =
    selectedMaterial?.kind === 'quiz' ? selectedMaterial.questions[studyIndex] : null;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw !== null) setMaterials(parseMaterials(raw));
      })
      .catch(() => {
        if (active)
          setStorageError(
            'Could not safely load your saved materials. Existing data was left untouched, and creating or deleting is disabled to protect it.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function persist(next) {
    setSaving(true);
    setError('');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMaterials(next);
      return true;
    } catch {
      setError('Could not save to this device. Please check available storage and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }
  function startCreate(nextMaterialKind) {
    setMaterialKind(nextMaterialKind);
    setMaterialTitle('');
    setNoteContent('');
    setQuizQuestions([emptyQuestion()]);
    setFlashcards([emptyCard()]);
    setError('');
    setPage('create');
  }
  function updateQuestion(questionIndex, field, value) {
    setQuizQuestions((currentQuestions) =>
      currentQuestions.map((question, currentIndex) =>
        currentIndex === questionIndex ? { ...question, [field]: value } : question,
      ),
    );
  }
  function updateOption(questionIndex, optionIndex, value) {
    setQuizQuestions((currentQuestions) =>
      currentQuestions.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option,
              ),
            }
          : question,
      ),
    );
  }
  function updateCard(cardIndex, field, value) {
    setFlashcards((currentCards) =>
      currentCards.map((card, currentIndex) =>
        currentIndex === cardIndex ? { ...card, [field]: value } : card,
      ),
    );
  }
  function validateDraft() {
    if (!materialTitle.trim()) return 'Please enter a title.';
    if (materialKind === 'notes' && !noteContent.trim()) return 'Please enter your notes.';
    if (
      materialKind === 'flashcards' &&
      flashcards.some((card) => !card.front.trim() || !card.back.trim())
    ) {
      return 'Please fill in both sides of every flashcard.';
    }

    if (materialKind === 'quiz') {
      const hasIncompleteQuestion = quizQuestions.some(
        (question) =>
          !question.prompt.trim() ||
          (question.type === 'identification'
            ? !question.answer.trim()
            : question.options.some((option) => !option.trim())),
      );
      if (hasIncompleteQuestion) return 'Please complete each question and all answer fields.';

      const hasDuplicateOptions = quizQuestions.some(
        (question) =>
          question.type === 'multiple' &&
          new Set(question.options.map(normalizeAnswer)).size !== question.options.length,
      );
      if (hasDuplicateOptions) return 'Multiple-choice options must be distinct.';
    }

    return '';
  }
  async function save() {
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    const materialContent =
      materialKind === 'notes'
        ? { notes: noteContent.trim() }
        : materialKind === 'quiz'
          ? { questions: quizQuestions }
          : { cards: flashcards };
    const newMaterial = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kind: materialKind,
      title: materialTitle.trim(),
      ...materialContent,
    };
    if (await persist([newMaterial, ...materials])) setPage('list');
  }
  function openMaterial(material) {
    setSelectedMaterial(material);
    setStudyIndex(0);
    setFlipped(false);
    setAnswerResponse(null);
    setAnswerResults([]);
    setAnswerChecked(false);
    setPendingDelete(false);
    setError('');
    setPage('detail');
  }
  async function removeMaterial() {
    if (await persist(materials.filter((material) => material.id !== selectedMaterial.id))) {
      setPendingDelete(false);
      setPage('list');
    }
  }
  function checkAnswer() {
    if (answerResponse === null || (typeof answerResponse === 'string' && !answerResponse.trim())) {
      setError('Choose or enter an answer first.');
      return;
    }

    const isCorrect = isAnswerCorrect(currentQuestion, answerResponse);
    setAnswerResults((currentResults) => [...currentResults, isCorrect]);
    setAnswerChecked(true);
    setError('');
  }
  function nextQuestion() {
    if (studyIndex + 1 === selectedMaterial.questions.length) {
      setPage('result');
      return;
    }
    setStudyIndex(studyIndex + 1);
    setAnswerResponse(null);
    setAnswerChecked(false);
    setError('');
  }
  function goBack() {
    setError('');
    if (page === 'list') onExit();
    else if (page === 'detail') {
      setPendingDelete(false);
      setPage('list');
    } else if (page === 'result') setPage('detail');
    else setPage('list');
  }
  return (
    <View style={styles.container}>
      <Header
        title={getHeaderTitle(page, materialKind, selectedMaterial)}
        subtitle={page === 'create' ? 'Your work stays on this device.' : ''}
        back={goBack}
      />
      <Entrance key={page} fill>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {page === 'list' && (
            <>
              <Text style={styles.heading}>Create study material</Text>
              <Text style={styles.intro}>
                Make quizzes, flashcards and notes, then study at your own pace.
              </Text>
              {storageError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {storageError}
                </Text>
              ) : null}
              <View style={styles.createRow}>
                <View style={{ flex: 1 }}>
                  <Action
                    label="+ Quiz"
                    onPress={() => startCreate('quiz')}
                    disabled={loading || !!storageError}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Action
                    label="+ Cards"
                    onPress={() => startCreate('flashcards')}
                    disabled={loading || !!storageError}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Action
                    label="+ Notes"
                    onPress={() => startCreate('notes')}
                    disabled={loading || !!storageError}
                  />
                </View>
              </View>
              <Text style={[styles.heading, { marginTop: 32 }]}>Your collection</Text>
              <Text style={styles.intro}>
                {loading
                  ? 'Loading your materials…'
                  : materials.length
                    ? 'Tap an item to study it.'
                    : 'Nothing here yet. Create your first study material above.'}
              </Text>
              {materials.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                  onPress={() => openMaterial(item)}
                  style={styles.material}
                >
                  <View style={styles.materialIcon}>
                    <Text style={styles.iconText}>
                      {item.kind === 'quiz' ? '✓' : item.kind === 'notes' ? '≡' : '✦'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.materialType}>
                      {item.kind === 'quiz'
                        ? 'QUIZ'
                        : item.kind === 'notes'
                          ? 'NOTES / REVIEWER'
                          : 'FLASHCARDS'}
                    </Text>
                    <Text style={styles.materialTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.arrow}>↗</Text>
                </Pressable>
              ))}
            </>
          )}
          {page === 'create' && (
            <>
              <Field
                label="Title"
                value={materialTitle}
                onChangeText={setMaterialTitle}
                placeholder="Give it a name"
              />
              {materialKind === 'notes' && (
                <Field
                  label="Notes / reviewer"
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  placeholder="Write your study notes here"
                />
              )}
              {materialKind === 'flashcards' && (
                <>
                  {flashcards.map((card, cardIndex) => (
                    <View key={cardIndex} style={styles.editorCard}>
                      <Text style={styles.cardHeading}>FLASHCARD {cardIndex + 1}</Text>
                      <Field
                        label={`Card ${cardIndex + 1} front`}
                        value={card.front}
                        onChangeText={(value) => updateCard(cardIndex, 'front', value)}
                        multiline
                        placeholder="Question or term"
                      />
                      <Field
                        label={`Card ${cardIndex + 1} back`}
                        value={card.back}
                        onChangeText={(value) => updateCard(cardIndex, 'back', value)}
                        multiline
                        placeholder="Answer or definition"
                      />
                      {flashcards.length > 1 && (
                        <Action
                          secondary
                          label="Remove card"
                          onPress={() =>
                            setFlashcards(
                              flashcards.filter((_, currentIndex) => currentIndex !== cardIndex),
                            )
                          }
                        />
                      )}
                    </View>
                  ))}
                  <Action
                    secondary
                    label="+ Add another card"
                    onPress={() => setFlashcards([...flashcards, emptyCard()])}
                  />
                </>
              )}
              {materialKind === 'quiz' && (
                <>
                  {quizQuestions.map((question, questionIndex) => (
                    <View key={questionIndex} style={styles.editorCard}>
                      <Text style={styles.cardHeading}>QUESTION {questionIndex + 1}</Text>
                      <Text style={styles.label}>Question type</Text>
                      <View style={styles.typeRow}>
                        {[
                          { value: 'multiple', label: 'Multiple choice' },
                          { value: 'identification', label: 'Identification' },
                        ].map(({ value, label }) => (
                          <Pressable
                            key={value}
                            accessibilityRole="button"
                            accessibilityState={{ selected: question.type === value }}
                            onPress={() => updateQuestion(questionIndex, 'type', value)}
                            style={[styles.chip, question.type === value && styles.chipSelected]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                question.type === value && styles.chipTextSelected,
                              ]}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Field
                        label={`Question ${questionIndex + 1}`}
                        value={question.prompt}
                        onChangeText={(value) => updateQuestion(questionIndex, 'prompt', value)}
                        multiline
                        placeholder="Write your question"
                      />
                      {question.type === 'identification' ? (
                        <Field
                          label={`Question ${questionIndex + 1} correct answer`}
                          value={question.answer}
                          onChangeText={(value) => updateQuestion(questionIndex, 'answer', value)}
                          placeholder="Expected answer"
                        />
                      ) : (
                        <>
                          <Text style={styles.label}>Options · tap the correct answer</Text>
                          {question.options.map((option, optionIndex) => (
                            <View key={optionIndex} style={styles.optionEdit}>
                              <Pressable
                                accessibilityRole="radio"
                                accessibilityLabel={`Mark option ${String.fromCharCode(65 + optionIndex)} correct`}
                                accessibilityState={{
                                  checked: question.correctIndex === optionIndex,
                                }}
                                onPress={() =>
                                  updateQuestion(questionIndex, 'correctIndex', optionIndex)
                                }
                                style={[
                                  styles.radio,
                                  question.correctIndex === optionIndex && styles.radioSelected,
                                ]}
                              >
                                <Text style={styles.radioText}>
                                  {question.correctIndex === optionIndex ? '✓' : ''}
                                </Text>
                              </Pressable>
                              <TextInput
                                accessibilityLabel={`Question ${questionIndex + 1} option ${String.fromCharCode(65 + optionIndex)}`}
                                value={option}
                                onChangeText={(value) =>
                                  updateOption(questionIndex, optionIndex, value)
                                }
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                placeholderTextColor="#80758e"
                                style={[styles.input, { flex: 1 }]}
                              />
                            </View>
                          ))}
                        </>
                      )}
                      {quizQuestions.length > 1 && (
                        <Action
                          secondary
                          label="Remove question"
                          onPress={() =>
                            setQuizQuestions(
                              quizQuestions.filter(
                                (_, currentIndex) => currentIndex !== questionIndex,
                              ),
                            )
                          }
                        />
                      )}
                    </View>
                  ))}
                  <Action
                    secondary
                    label="+ Add another question"
                    onPress={() => setQuizQuestions([...quizQuestions, emptyQuestion()])}
                  />
                </>
              )}
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <View style={{ marginTop: 20 }}>
                <Action
                  label={saving ? 'Saving…' : 'Save material'}
                  onPress={save}
                  disabled={saving}
                />
              </View>
              <Text style={styles.small}>
                Saved locally on this device. Your data is not synced.
              </Text>
            </>
          )}
          {page === 'detail' && selectedMaterial && (
            <>
              <Text style={styles.eyebrow}>
                {selectedMaterial.kind === 'quiz'
                  ? 'QUIZ'
                  : selectedMaterial.kind === 'notes'
                    ? 'NOTES / REVIEWER'
                    : 'FLASHCARD DECK'}
              </Text>
              {selectedMaterial.kind === 'notes' ? (
                <View style={styles.reading}>
                  <Text selectable style={styles.readingText}>
                    {selectedMaterial.notes}
                  </Text>
                </View>
              ) : selectedMaterial.kind === 'flashcards' ? (
                <>
                  <Text style={styles.intro}>
                    Card {studyIndex + 1} of {selectedMaterial.cards.length} · tap to flip
                  </Text>
                  <FlipCard
                    key={`${selectedMaterial.id}-${studyIndex}`}
                    flipped={flipped}
                    onFlip={() => setFlipped((value) => !value)}
                    front={selectedMaterial.cards[studyIndex].front}
                    back={selectedMaterial.cards[studyIndex].back}
                    frontLabel="FRONT"
                    backLabel="BACK"
                    cardStyle={styles.flashcard}
                    labelStyle={styles.flashLabel}
                    textStyle={styles.flashText}
                  />
                  <View style={styles.navRow}>
                    <Action
                      secondary
                      label="← Previous"
                      disabled={studyIndex === 0}
                      onPress={() => {
                        setStudyIndex(studyIndex - 1);
                        setFlipped(false);
                      }}
                    />
                    <Action
                      secondary
                      label="Next →"
                      disabled={studyIndex === selectedMaterial.cards.length - 1}
                      onPress={() => {
                        setStudyIndex(studyIndex + 1);
                        setFlipped(false);
                      }}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.intro}>
                    Question {studyIndex + 1} of {selectedMaterial.questions.length} ·{' '}
                    {currentQuestion.type === 'multiple' ? 'Multiple choice' : 'Identification'}
                  </Text>
                  <Text style={styles.question}>{currentQuestion.prompt}</Text>
                  {currentQuestion.type === 'multiple' ? (
                    currentQuestion.options.map((option, optionIndex) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: answerResponse === optionIndex,
                          disabled: answerChecked,
                        }}
                        disabled={answerChecked}
                        onPress={() => setAnswerResponse(optionIndex)}
                        key={optionIndex}
                        style={[
                          styles.answer,
                          answerResponse === optionIndex && styles.answerSelected,
                        ]}
                      >
                        <Text style={styles.answerText}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Field
                      label="Your answer"
                      value={typeof answerResponse === 'string' ? answerResponse : ''}
                      onChangeText={(value) => {
                        if (!answerChecked) setAnswerResponse(value);
                      }}
                      placeholder="Type your answer"
                    />
                  )}
                  {answerChecked ? (
                    <>
                      <Entrance>
                        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
                          {answerResults[answerResults.length - 1]
                            ? '✓ Correct!'
                            : `Not quite. Correct answer: ${getCorrectAnswer(currentQuestion)}`}
                        </Text>
                      </Entrance>
                      <Action
                        label={
                          studyIndex + 1 === selectedMaterial.questions.length
                            ? 'See results'
                            : 'Next question →'
                        }
                        onPress={nextQuestion}
                      />
                    </>
                  ) : (
                    <Action label="Check answer" onPress={checkAnswer} />
                  )}
                </>
              )}
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <View style={styles.deleteArea}>
                {pendingDelete ? (
                  <>
                    <Text style={styles.intro}>Delete this material permanently?</Text>
                    <View style={styles.navRow}>
                      <Action secondary label="Cancel" onPress={() => setPendingDelete(false)} />
                      <Action
                        secondary
                        label="Yes, delete"
                        disabled={saving}
                        onPress={removeMaterial}
                      />
                    </View>
                  </>
                ) : (
                  <Action
                    secondary
                    label="Delete material"
                    onPress={() => setPendingDelete(true)}
                    disabled={!!storageError}
                  />
                )}
              </View>
            </>
          )}
          {page === 'result' && selectedMaterial && (
            <>
              <Text style={styles.eyebrow}>QUIZ COMPLETE</Text>
              <Text style={styles.heading}>Nice work!</Text>
              <View style={styles.score}>
                <Text style={styles.scoreValue}>
                  {answerResults.filter(Boolean).length} / {answerResults.length}
                </Text>
                <Text style={styles.scoreCaption}>correct answers</Text>
              </View>
              <Action label="Try again" onPress={() => openMaterial(selectedMaterial)} />
              <View style={{ height: 10 }} />
              <Action secondary label="Back to collection" onPress={() => setPage('list')} />
              <Text style={styles.small}>Results are not saved.</Text>
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
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 27, lineHeight: 33, fontWeight: '800', color: '#fff', marginTop: 6 },
  headerSubtitle: { fontSize: 13, lineHeight: 19, color: '#e2d7ff', marginTop: 6 },
  body: { padding: 25, paddingBottom: 45 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '800',
    color: '#7e6c9a',
    marginBottom: 8,
  },
  heading: { fontSize: 23, fontWeight: '800', color: '#26163e' },
  intro: { fontSize: 14, lineHeight: 21, color: '#756981', marginTop: 8, marginBottom: 20 },
  createRow: { flexDirection: 'row', gap: 8 },
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
  material: {
    backgroundColor: '#faf9fc',
    borderWidth: 1,
    borderColor: '#eee8f6',
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  materialIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#eee5fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 21, color: '#5a24d4' },
  materialType: { fontSize: 9, letterSpacing: 1, fontWeight: '800', color: '#806da0' },
  materialTitle: { fontSize: 16, fontWeight: '800', color: '#291a40', marginTop: 4 },
  arrow: { fontSize: 19, color: '#846ba8' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#3c2a53', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d8cce7',
    borderRadius: 12,
    backgroundColor: '#fff',
    color: '#291a40',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  multiline: { minHeight: 85, textAlignVertical: 'top' },
  editorCard: { backgroundColor: '#f8f5fd', borderRadius: 17, padding: 16, marginBottom: 15 },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#7044bb',
    marginBottom: 16,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: '#d7cae9',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  chipSelected: { backgroundColor: '#5b24d8', borderColor: '#5b24d8' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#513b6b' },
  chipTextSelected: { color: '#fff' },
  optionEdit: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: '#9e88bc',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#5921db', backgroundColor: '#5921db' },
  radioText: { color: '#fff', fontWeight: '800' },
  error: { color: '#a32242', fontSize: 13, lineHeight: 19, marginVertical: 12 },
  small: { color: '#766a83', fontSize: 12, lineHeight: 18, marginTop: 16 },
  reading: { backgroundColor: '#f3edfd', borderRadius: 18, padding: 22 },
  readingText: { fontSize: 16, lineHeight: 25, color: '#3b2a52' },
  flashcard: {
    backgroundColor: '#672be0',
    borderRadius: 20,
    padding: 23,
    minHeight: 230,
    justifyContent: 'space-between',
  },
  flashLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#e1d3ff' },
  flashText: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#fff', marginVertical: 20 },
  navRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 15 },
  question: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: '#30203f', marginBottom: 20 },
  answer: {
    borderWidth: 1,
    borderColor: '#ded4eb',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  answerSelected: { borderColor: '#5b24d8', backgroundColor: '#f2ebff' },
  answerText: { color: '#342247', fontSize: 15 },
  feedback: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: '#5424b7',
    marginVertical: 15,
  },
  deleteArea: { marginTop: 35 },
  score: {
    backgroundColor: '#f1e9fd',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginVertical: 25,
  },
  scoreValue: { fontSize: 40, fontWeight: '800', color: '#5921db' },
  scoreCaption: { color: '#705b8e', marginTop: 5 },
});
