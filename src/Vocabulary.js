import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Entrance from './Entrance';

// A small curated list keeps the daily word and the quiz topics predictable and appropriate for learners.
const WORDS = ['curious', 'resilient', 'diligent', 'vivid', 'adapt', 'observe', 'generous', 'abundant', 'meticulous', 'serene', 'innovate', 'eloquent', 'fragile', 'cautious', 'versatile', 'radiant'];
const API = 'https://freedictionaryapi.com/api/v1/entries/en/';
const API_HOME = 'https://freedictionaryapi.com/';
const LICENSE = 'https://creativecommons.org/licenses/by-sa/4.0/';

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function dailyWord() {
  const now = new Date();
  // Calendar dates are calculated in the user's local timezone, without DST-related hour offsets.
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return WORDS[((day % WORDS.length) + WORDS.length) % WORDS.length];
}
async function fetchWord(word, signal) {
  const response = await fetch(API + encodeURIComponent(word), { signal });
  if (!response.ok) throw new Error('Dictionary request failed');
  const data = await response.json();
  for (const entry of data.entries || []) {
    const sense = (entry.senses || []).find(item => typeof item.definition === 'string' && item.definition.trim());
    if (sense) return { word, definition: sense.definition, partOfSpeech: entry.partOfSpeech || '', sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}` };
  }
  throw new Error('No definition available');
}
function Action({ label, onPress, secondary = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && styles.pressed]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}
function ExternalLink({ label, url }) {
  return <Text accessibilityRole="link" onPress={() => Linking.openURL(url).catch(() => {})} style={styles.link}>{label}</Text>;
}
function Credit({ entries = [] }) {
  return <View style={styles.credit}><Text style={styles.creditText}>Definitions from Wiktionary contributors via <ExternalLink label="Free Dictionary API" url={API_HOME} />. Licensed <ExternalLink label="CC BY-SA 4.0" url={LICENSE} />. Entries are selected and formatted for this activity.</Text>{entries.length > 0 && <Text style={styles.creditText}>Source entries: {entries.map((entry, i) => <Text key={entry.word}>{i > 0 ? ', ' : ''}<ExternalLink label={entry.word} url={entry.sourceUrl} /></Text>)}</Text>}</View>;
}

export default function Vocabulary({ onExit }) {
  const [page, setPage] = useState('menu');
  const [mode, setMode] = useState('quiz');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [dateWord, setDateWord] = useState(dailyWord);

  useEffect(() => {
    if (page !== 'daily' && page !== 'activity') return undefined;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    async function load() {
      setLoading(true); setError(''); setEntries([]);
      try {
        const words = page === 'daily' ? [dateWord] : shuffle(WORDS).slice(0, 8);
        // Individual failures do not prevent a quiz when enough dictionary entries are available.
        const fetched = await Promise.all(words.map(word => fetchWord(word, controller.signal).catch(() => null)));
        const available = fetched.filter(Boolean);
        if (available.length < (page === 'daily' ? 1 : 4)) throw new Error('Not enough definitions available');
        if (!active) return;
        setEntries(available);
        if (page === 'activity') {
          const quizQuestions = shuffle(available).slice(0, Math.min(5, available.length)).map(answer => ({ answer, options: shuffle([answer, ...shuffle(available.filter(item => item.word !== answer.word)).slice(0, 3)]) }));
          setQuestions(quizQuestions);
        }
      } catch {
        if (active) setError('Could not load dictionary content. Check your connection and try again.');
      } finally { clearTimeout(timeout); if (active) setLoading(false); }
    }
    load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [page, attempt, dateWord]);

  function startActivity(nextMode) { setMode(nextMode); setIndex(0); setScore(0); setChoice(null); setChecked(false); setSelectionError(false); setQuestions([]); setPage('activity'); }
  function startDaily() { setDateWord(dailyWord()); setPage('daily'); }
  function check() { if (choice === null) { setSelectionError(true); return; } if (checked) return; if (choice === questions[index].answer.word) setScore(value => value + 1); setChecked(true); }
  function next() { if (index + 1 === questions.length) setPage('result'); else { setIndex(index + 1); setChoice(null); setChecked(false); setSelectionError(false); } }
  function goBack() { if (page === 'menu') onExit(); else { setError(''); setPage('menu'); } }
  const current = questions[index];
  return <View style={styles.container}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={{ flex: 1 }}><Text style={styles.headerTitle}>{page === 'menu' ? 'Vocabulary' : page === 'daily' ? 'Word of the day' : mode === 'quiz' ? 'Word quiz' : 'Vocabulary test'}</Text><Text style={styles.headerSubtitle}>English dictionary activities</Text></View></View>
    <Entrance key={page} fill><ScrollView contentContainerStyle={styles.body}>
      {page === 'menu' && <><Text style={styles.heading}>Explore words</Text><Text style={styles.intro}>Learn a new word or test your knowledge with dictionary definitions.</Text><View style={styles.menu}><Action label="Word of the day" onPress={startDaily}/><Action label="Word quiz · choose the meaning" onPress={() => startActivity('quiz')}/><Action label="Vocabulary test · choose the word" onPress={() => startActivity('test')}/></View><Text style={styles.note}>An internet connection is required. Words are selected from a small curated list, not from Merriam-Webster.</Text><Credit /></>}
      {(page === 'daily' || page === 'activity') && <>{loading && <Text accessibilityLiveRegion="polite" style={styles.intro}>Loading dictionary content…</Text>}{error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Action label="Try again" onPress={() => setAttempt(value => value + 1)}/></> : null}
        {!loading && !error && page === 'daily' && entries[0] && <><Text style={styles.eyebrow}>TODAY'S WORD · SELECTED FROM OUR LIST</Text><Text style={styles.word}>{entries[0].word}</Text><Text style={styles.part}>{entries[0].partOfSpeech}</Text><View style={styles.card}><Text style={styles.cardLabel}>DEFINITION</Text><Text style={styles.definition}>{entries[0].definition}</Text></View><Text style={styles.note}>Changes each local calendar day; repeats after {WORDS.length} days.</Text><Credit entries={entries}/></>}
        {!loading && !error && page === 'activity' && current && <><Text style={styles.eyebrow}>QUESTION {index + 1} OF {questions.length}</Text><Text style={styles.question}>{mode === 'quiz' ? `What does “${current.answer.word}” mean?` : `Which word matches this definition?`}</Text>{mode === 'test' && <View style={styles.card}><Text style={styles.definition}>{current.answer.definition}</Text></View>}
          {current.options.map(option => <Pressable key={option.word} accessibilityRole="button" accessibilityState={{ selected: choice === option.word, disabled: checked }} disabled={checked} onPress={() => { setChoice(option.word); setSelectionError(false); }} style={[styles.option, choice === option.word && styles.optionSelected]}><Text style={styles.optionText}>{mode === 'quiz' ? option.definition : option.word}</Text></Pressable>)}
          {selectionError && <Text accessibilityRole="alert" style={styles.error}>Choose an answer first.</Text>}{checked ? <><Entrance><Text accessibilityLiveRegion="polite" style={styles.feedback}>{choice === current.answer.word ? 'Correct.' : `Incorrect. The answer is ${mode === 'quiz' ? current.answer.definition : current.answer.word}.`}</Text></Entrance><Action label={index + 1 === questions.length ? 'See results' : 'Next question'} onPress={next}/></> : <Action label="Check answer" onPress={check}/>}<Credit entries={mode === 'quiz' ? current.options : [current.answer]}/></>}
      </>}
      {page === 'result' && <><Text style={styles.heading}>Test complete</Text><View style={styles.score}><Text style={styles.scoreNumber}>{score} / {questions.length}</Text><Text style={styles.note}>correct answers</Text></View><Action label="Try another" onPress={() => startActivity(mode)}/><View style={{ height: 10 }}/><Action secondary label="Back to vocabulary" onPress={() => setPage('menu')}/><Text style={styles.note}>Scores are not saved. Questions use a small curated word list.</Text><Credit entries={entries}/></>}
    </ScrollView></Entrance></View>;
}
const styles = StyleSheet.create({
 container:{flex:1,backgroundColor:'#fff'},header:{backgroundColor:'#5921db',paddingHorizontal:25,paddingTop:24,paddingBottom:28,borderBottomRightRadius:36,flexDirection:'row',alignItems:'flex-start',gap:15},back:{width:38,height:38,borderRadius:19,backgroundColor:'#7549e7',alignItems:'center',justifyContent:'center'},backText:{fontSize:30,lineHeight:34,color:'#fff'},headerTitle:{fontSize:27,lineHeight:33,fontWeight:'800',color:'#fff'},headerSubtitle:{fontSize:13,lineHeight:19,color:'#e2d7ff',marginTop:6},body:{padding:25,paddingBottom:45},heading:{fontSize:23,fontWeight:'800',color:'#26163e'},intro:{fontSize:14,lineHeight:21,color:'#685a79',marginTop:8,marginBottom:20},menu:{gap:10},button:{minHeight:50,backgroundColor:'#5921db',borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:14,paddingVertical:12},buttonText:{color:'#fff',fontSize:14,fontWeight:'800',textAlign:'center'},secondary:{backgroundColor:'#f1eafb'},secondaryText:{color:'#5523bf'},pressed:{opacity:.7},note:{fontSize:12,lineHeight:19,color:'#6d5f7b',marginTop:18},credit:{borderTopWidth:1,borderTopColor:'#eee8f6',marginTop:24,paddingTop:14},creditText:{fontSize:12,lineHeight:19,color:'#625572',marginBottom:8},link:{color:'#5420bd',textDecorationLine:'underline'},eyebrow:{fontSize:10,letterSpacing:1,fontWeight:'800',color:'#715e8b',marginBottom:12},word:{fontSize:34,fontWeight:'800',color:'#27163e'},part:{fontSize:14,color:'#675775',marginTop:5},card:{backgroundColor:'#f3edfd',borderRadius:17,padding:20,marginVertical:16},cardLabel:{fontSize:10,letterSpacing:1,fontWeight:'800',color:'#7044bb',marginBottom:10},definition:{fontSize:16,lineHeight:24,color:'#342447'},question:{fontSize:20,lineHeight:28,fontWeight:'700',color:'#30203f',marginBottom:20},option:{borderWidth:1,borderColor:'#ded4eb',borderRadius:12,padding:15,marginBottom:10},optionSelected:{borderColor:'#5b24d8',backgroundColor:'#f2ebff'},optionText:{fontSize:15,lineHeight:22,color:'#342247'},feedback:{fontSize:15,lineHeight:22,fontWeight:'700',color:'#5424b7',marginVertical:15},error:{color:'#a32242',fontSize:14,lineHeight:20,marginBottom:15},score:{backgroundColor:'#f1e9fd',borderRadius:20,padding:25,alignItems:'center',marginVertical:25},scoreNumber:{fontSize:40,fontWeight:'800',color:'#5921db'}
});
