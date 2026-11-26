import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlipCard from './FlipCard';
import Entrance from './Entrance';

const STORAGE_KEY = '@prepcrux/materials-v1';
const emptyQuestion = () => ({ type: 'multiple', prompt: '', options: ['', '', '', ''], correctIndex: 0, answer: '' });
const emptyCard = () => ({ front: '', back: '' });
const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

function Action({ label, onPress, secondary, disabled }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && { opacity: 0.65 }]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}
function Field({ label, value, onChangeText, multiline = false, placeholder }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#80758e" multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}
function Header({ title, subtitle, back }) {
  return <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}</View></View>;
}

export default function MyMaterials({ onExit }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState('list');
  const [kind, setKind] = useState('quiz');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [cards, setCards] = useState([emptyCard()]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [response, setResponse] = useState(null);
  const [results, setResults] = useState([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!active) return;
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Invalid saved data');
        setMaterials(parsed);
      }
    }).catch(() => { if (active) setStorageError('Could not load your saved materials. Try restarting the app; creating or deleting is disabled to protect your data.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function persist(next) {
    setSaving(true);
    setError('');
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setMaterials(next); return true; }
    catch { setError('Could not save to this device. Please check available storage and try again.'); return false; }
    finally { setSaving(false); }
  }
  function startCreate(nextKind) {
    setKind(nextKind); setTitle(''); setNotes(''); setQuestions([emptyQuestion()]); setCards([emptyCard()]); setError(''); setPage('create');
  }
  function updateQuestion(i, field, value) { setQuestions(current => current.map((q, n) => n === i ? { ...q, [field]: value } : q)); }
  function updateOption(i, optionIndex, value) { setQuestions(current => current.map((q, n) => n === i ? { ...q, options: q.options.map((v, k) => k === optionIndex ? value : v) } : q)); }
  function updateCard(i, field, value) { setCards(current => current.map((card, n) => n === i ? { ...card, [field]: value } : card)); }
  async function save() {
    if (!title.trim()) return setError('Please enter a title.');
    if (kind === 'notes' && !notes.trim()) return setError('Please enter your notes.');
    if (kind === 'flashcards' && cards.some(card => !card.front.trim() || !card.back.trim())) return setError('Please fill in both sides of every flashcard.');
    if (kind === 'quiz' && questions.some(q => !q.prompt.trim() || (q.type === 'identification' ? !q.answer.trim() : q.options.some(option => !option.trim())))) return setError('Please complete each question and all answer fields.');
    if (kind === 'quiz' && questions.some(q => q.type === 'multiple' && new Set(q.options.map(normalize)).size !== q.options.length)) return setError('Multiple-choice options must be distinct.');
    const material = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, title: title.trim(), ...(kind === 'notes' ? { notes: notes.trim() } : kind === 'quiz' ? { questions } : { cards }) };
    if (await persist([material, ...materials])) setPage('list');
  }
  function openMaterial(item) { setSelected(item); setIndex(0); setFlipped(false); setResponse(null); setResults([]); setChecked(false); setPendingDelete(false); setError(''); setPage('detail'); }
  async function removeMaterial() { if (await persist(materials.filter(item => item.id !== selected.id))) { setPendingDelete(false); setPage('list'); } }
  function checkAnswer() {
    if (response === null || (typeof response === 'string' && !response.trim())) return setError('Choose or enter an answer first.');
    const q = selected.questions[index];
    const correct = q.type === 'multiple' ? response === q.correctIndex : normalize(response) === normalize(q.answer);
    setResults(current => [...current, correct]); setChecked(true); setError('');
  }
  function nextQuestion() {
    if (index + 1 === selected.questions.length) { setPage('result'); return; }
    setIndex(index + 1); setResponse(null); setChecked(false); setError('');
  }
  function back() {
    setError('');
    if (page === 'list') onExit();
    else if (page === 'detail') { setPendingDelete(false); setPage('list'); }
    else if (page === 'result') setPage('detail');
    else setPage('list');
  }
  return <View style={styles.container}><Header title={page === 'list' ? 'My materials' : page === 'create' ? `New ${kind === 'flashcards' ? 'flashcard deck' : kind === 'notes' ? 'notes' : 'quiz'}` : selected?.title || 'My materials'} subtitle={page === 'list' ? 'Create and study your materials.' : page === 'create' ? 'Your work stays on this device.' : ''} back={back}/>
    <Entrance key={page} fill><ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {page === 'list' && <><Text style={styles.eyebrow}>CREATE</Text><Text style={styles.heading}>Create study material</Text><Text style={styles.intro}>Make quizzes, flashcards and notes, then study at your own pace.</Text>
        {storageError ? <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text> : null}
        <View style={styles.createRow}><Action label="+ Quiz" onPress={() => startCreate('quiz')} disabled={loading || !!storageError}/><Action label="+ Flashcards" onPress={() => startCreate('flashcards')} disabled={loading || !!storageError}/><Action label="+ Notes" onPress={() => startCreate('notes')} disabled={loading || !!storageError}/></View>
        <Text style={[styles.heading, { marginTop: 32 }]}>Your collection</Text><Text style={styles.intro}>{loading ? 'Loading your materials…' : materials.length ? 'Tap an item to study it.' : 'Nothing here yet. Create your first study material above.'}</Text>
        {materials.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => openMaterial(item)} style={styles.material}><View style={styles.materialIcon}><Text style={styles.iconText}>{item.kind === 'quiz' ? '✓' : item.kind === 'notes' ? '≡' : '✦'}</Text></View><View style={{ flex: 1 }}><Text style={styles.materialType}>{item.kind === 'quiz' ? 'QUIZ' : item.kind === 'notes' ? 'NOTES / REVIEWER' : 'FLASHCARDS'}</Text><Text style={styles.materialTitle}>{item.title}</Text></View><Text style={styles.arrow}>↗</Text></Pressable>)}
      </>}
      {page === 'create' && <><Field label="Title" value={title} onChangeText={setTitle} placeholder="Give it a name"/>
        {kind === 'notes' && <Field label="Notes / reviewer" value={notes} onChangeText={setNotes} multiline placeholder="Write your study notes here"/>}
        {kind === 'flashcards' && <>{cards.map((card, i) => <View key={i} style={styles.editorCard}><Text style={styles.cardHeading}>FLASHCARD {i + 1}</Text><Field label={`Card ${i + 1} front`} value={card.front} onChangeText={value => updateCard(i, 'front', value)} multiline placeholder="Question or term"/><Field label={`Card ${i + 1} back`} value={card.back} onChangeText={value => updateCard(i, 'back', value)} multiline placeholder="Answer or definition"/>{cards.length > 1 && <Action secondary label="Remove card" onPress={() => setCards(cards.filter((_, n) => n !== i))}/>}</View>)}<Action secondary label="+ Add another card" onPress={() => setCards([...cards, emptyCard()])}/></>}
        {kind === 'quiz' && <>{questions.map((q, i) => <View key={i} style={styles.editorCard}><Text style={styles.cardHeading}>QUESTION {i + 1}</Text><Text style={styles.label}>Question type</Text><View style={styles.typeRow}>{[['multiple','Multiple choice'],['identification','Identification']].map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected: q.type === value}} onPress={() => updateQuestion(i, 'type', value)} style={[styles.chip, q.type === value && styles.chipSelected]}><Text style={[styles.chipText, q.type === value && styles.chipTextSelected]}>{label}</Text></Pressable>)}</View><Field label={`Question ${i + 1}`} value={q.prompt} onChangeText={value => updateQuestion(i, 'prompt', value)} multiline placeholder="Write your question"/>
          {q.type === 'identification' ? <Field label={`Question ${i + 1} correct answer`} value={q.answer} onChangeText={value => updateQuestion(i, 'answer', value)} placeholder="Expected answer"/> : <><Text style={styles.label}>Options · tap the correct answer</Text>{q.options.map((option, n) => <View key={n} style={styles.optionEdit}><Pressable accessibilityRole="radio" accessibilityLabel={`Mark option ${String.fromCharCode(65+n)} correct`} accessibilityState={{checked: q.correctIndex === n}} onPress={() => updateQuestion(i, 'correctIndex', n)} style={[styles.radio, q.correctIndex === n && styles.radioSelected]}><Text style={styles.radioText}>{q.correctIndex === n ? '✓' : ''}</Text></Pressable><TextInput accessibilityLabel={`Question ${i + 1} option ${String.fromCharCode(65+n)}`} value={option} onChangeText={value => updateOption(i, n, value)} placeholder={`Option ${String.fromCharCode(65+n)}`} placeholderTextColor="#80758e" style={[styles.input, { flex: 1 }]}/></View>)}</>}{questions.length > 1 && <Action secondary label="Remove question" onPress={() => setQuestions(questions.filter((_, n) => n !== i))}/>}</View>)}<Action secondary label="+ Add another question" onPress={() => setQuestions([...questions, emptyQuestion()])}/></>}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<View style={{ marginTop: 20 }}><Action label={saving ? 'Saving…' : 'Save material'} onPress={save} disabled={saving}/></View><Text style={styles.small}>Saved locally on this device. Your data is not synced.</Text>
      </>}
      {page === 'detail' && selected && <><Text style={styles.eyebrow}>{selected.kind === 'quiz' ? 'QUIZ' : selected.kind === 'notes' ? 'NOTES / REVIEWER' : 'FLASHCARD DECK'}</Text>
        {selected.kind === 'notes' ? <View style={styles.reading}><Text selectable style={styles.readingText}>{selected.notes}</Text></View> : selected.kind === 'flashcards' ? <><Text style={styles.intro}>Card {index + 1} of {selected.cards.length} · tap to flip</Text><FlipCard key={`${selected.id}-${index}`} flipped={flipped} onFlip={() => setFlipped(value => !value)} front={selected.cards[index].front} back={selected.cards[index].back} frontLabel="FRONT" backLabel="BACK" cardStyle={styles.flashcard} labelStyle={styles.flashLabel} textStyle={styles.flashText}/><View style={styles.navRow}><Action secondary label="← Previous" disabled={index === 0} onPress={() => { setIndex(index - 1); setFlipped(false); }}/><Action secondary label="Next →" disabled={index === selected.cards.length - 1} onPress={() => { setIndex(index + 1); setFlipped(false); }}/></View></> : <><Text style={styles.intro}>Question {index + 1} of {selected.questions.length} · {selected.questions[index].type === 'multiple' ? 'Multiple choice' : 'Identification'}</Text><Text style={styles.question}>{selected.questions[index].prompt}</Text>{selected.questions[index].type === 'multiple' ? selected.questions[index].options.map((option, i) => <Pressable accessibilityRole="button" accessibilityState={{ selected: response === i, disabled: checked }} disabled={checked} onPress={() => setResponse(i)} key={i} style={[styles.answer, response === i && styles.answerSelected]}><Text style={styles.answerText}>{String.fromCharCode(65+i)}. {option}</Text></Pressable>) : <Field label="Your answer" value={typeof response === 'string' ? response : ''} onChangeText={value => { if (!checked) setResponse(value); }} placeholder="Type your answer"/>}
          {checked ? <><Entrance><Text accessibilityLiveRegion="polite" style={styles.feedback}>{results[results.length - 1] ? '✓ Correct!' : `Not quite. Correct answer: ${selected.questions[index].type === 'multiple' ? selected.questions[index].options[selected.questions[index].correctIndex] : selected.questions[index].answer}`}</Text></Entrance><Action label={index + 1 === selected.questions.length ? 'See results' : 'Next question →'} onPress={nextQuestion}/></> : <Action label="Check answer" onPress={checkAnswer}/>}</>}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<View style={styles.deleteArea}>{pendingDelete ? <><Text style={styles.intro}>Delete this material permanently?</Text><View style={styles.navRow}><Action secondary label="Cancel" onPress={() => setPendingDelete(false)}/><Action secondary label="Yes, delete" disabled={saving} onPress={removeMaterial}/></View></> : <Action secondary label="Delete material" onPress={() => setPendingDelete(true)} disabled={!!storageError}/>}</View>
      </>}
      {page === 'result' && selected && <><Text style={styles.eyebrow}>QUIZ COMPLETE</Text><Text style={styles.heading}>Nice work!</Text><View style={styles.score}><Text style={styles.scoreValue}>{results.filter(Boolean).length} / {results.length}</Text><Text style={styles.scoreCaption}>correct answers</Text></View><Action label="Try again" onPress={() => openMaterial(selected)}/><View style={{ height: 10 }}/><Action secondary label="Back to collection" onPress={() => setPage('list')}/><Text style={styles.small}>Results are not saved.</Text></>}
    </ScrollView></Entrance></View>;
}

const styles = StyleSheet.create({
 container:{flex:1,backgroundColor:'#fff'},header:{backgroundColor:'#5921db',paddingHorizontal:25,paddingTop:24,paddingBottom:28,borderBottomRightRadius:36,flexDirection:'row',alignItems:'flex-start',gap:15},back:{width:38,height:38,borderRadius:19,backgroundColor:'#7549e7',alignItems:'center',justifyContent:'center'},backText:{fontSize:30,lineHeight:34,color:'#fff'},headerCopy:{flex:1},headerTitle:{fontSize:27,lineHeight:33,fontWeight:'800',color:'#fff',marginTop:6},headerSubtitle:{fontSize:13,lineHeight:19,color:'#e2d7ff',marginTop:6},body:{padding:25,paddingBottom:45},eyebrow:{fontSize:10,letterSpacing:1.3,fontWeight:'800',color:'#7e6c9a',marginBottom:8},heading:{fontSize:23,fontWeight:'800',color:'#26163e'},intro:{fontSize:14,lineHeight:21,color:'#756981',marginTop:8,marginBottom:20},createRow:{gap:9},button:{minHeight:50,backgroundColor:'#5921db',borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:14,paddingVertical:12},buttonText:{color:'#fff',fontSize:14,fontWeight:'800',textAlign:'center'},secondary:{backgroundColor:'#f1eafb'},secondaryText:{color:'#5523bf'},material:{borderWidth:1,borderColor:'#eee8f6',borderRadius:16,marginBottom:10,padding:14,flexDirection:'row',gap:12,alignItems:'center'},materialIcon:{width:45,height:45,borderRadius:13,backgroundColor:'#eee5fd',alignItems:'center',justifyContent:'center'},iconText:{fontSize:21,color:'#5a24d4'},materialType:{fontSize:9,letterSpacing:1,fontWeight:'800',color:'#806da0'},materialTitle:{fontSize:16,fontWeight:'800',color:'#291a40',marginTop:4},arrow:{fontSize:19,color:'#846ba8'},field:{marginBottom:16},label:{fontSize:13,fontWeight:'700',color:'#3c2a53',marginBottom:8},input:{borderWidth:1,borderColor:'#d8cce7',borderRadius:12,backgroundColor:'#fff',color:'#291a40',fontSize:15,minHeight:48,paddingHorizontal:14,paddingVertical:11},multiline:{minHeight:85,textAlignVertical:'top'},editorCard:{backgroundColor:'#f8f5fd',borderRadius:17,padding:16,marginBottom:15},cardHeading:{fontSize:11,fontWeight:'800',letterSpacing:1,color:'#7044bb',marginBottom:16},typeRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16},chip:{borderWidth:1,borderColor:'#d7cae9',borderRadius:20,paddingVertical:9,paddingHorizontal:12},chipSelected:{backgroundColor:'#5b24d8',borderColor:'#5b24d8'},chipText:{fontSize:12,fontWeight:'700',color:'#513b6b'},chipTextSelected:{color:'#fff'},optionEdit:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:10},radio:{width:32,height:32,borderRadius:16,borderColor:'#9e88bc',borderWidth:2,alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:'#5921db',backgroundColor:'#5921db'},radioText:{color:'#fff',fontWeight:'800'},error:{color:'#a32242',fontSize:13,lineHeight:19,marginVertical:12},small:{color:'#766a83',fontSize:12,lineHeight:18,marginTop:16},reading:{backgroundColor:'#f3edfd',borderRadius:18,padding:22},readingText:{fontSize:16,lineHeight:25,color:'#3b2a52'},flashcard:{backgroundColor:'#672be0',borderRadius:20,padding:23,minHeight:230,justifyContent:'space-between'},flashLabel:{fontSize:10,letterSpacing:1,fontWeight:'800',color:'#e1d3ff'},flashText:{fontSize:22,lineHeight:30,fontWeight:'700',color:'#fff',marginVertical:20},navRow:{flexDirection:'row',gap:10,justifyContent:'space-between',marginTop:15},question:{fontSize:20,lineHeight:28,fontWeight:'700',color:'#30203f',marginBottom:20},answer:{borderWidth:1,borderColor:'#ded4eb',borderRadius:12,padding:15,marginBottom:10},answerSelected:{borderColor:'#5b24d8',backgroundColor:'#f2ebff'},answerText:{color:'#342247',fontSize:15},feedback:{fontSize:15,lineHeight:22,fontWeight:'700',color:'#5424b7',marginVertical:15},deleteArea:{marginTop:35},score:{backgroundColor:'#f1e9fd',borderRadius:20,padding:25,alignItems:'center',marginVertical:25},scoreValue:{fontSize:40,fontWeight:'800',color:'#5921db'},scoreCaption:{color:'#705b8e',marginTop:5}
});
