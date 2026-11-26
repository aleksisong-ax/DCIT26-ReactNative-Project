import { useEffect, useMemo, useState } from 'react'

type Screen =
  | 'welcome'
  | 'library'
  | 'unit'
  | 'flashcard'
  | 'quiz'
  | 'reviewer'
  | 'summary'
  | 'materials'
  | 'vocabulary'

type Material = {
  id: string
  kind: 'notes' | 'flashcards'
  title: string
  content: string
}

const units = [
  {
    title: 'Learning how to learn',
    tag: 'The essentials',
    color: '#6842d8',
    accent: '#a890f4',
    fact: 'Active recall means retrieving information from memory rather than simply rereading it.',
    question: 'Which method asks you to retrieve information from memory?',
    options: ['Active recall', 'Passive rereading', 'Highlighting'],
    answer: 0,
    summary:
      'Active recall and spaced repetition help make study sessions more effective. Test yourself, then revisit ideas over time.',
  },
  {
    title: 'Building better habits',
    tag: 'Study routine',
    color: '#bd6fa2',
    accent: '#efb6d4',
    fact: 'A consistent study routine makes it easier to practice regularly.',
    question: 'What can help you study more consistently?',
    options: ['A regular routine', 'Skipping practice', 'Studying only once'],
    answer: 0,
    summary:
      'Small, consistent study sessions can be easier to maintain than occasional long sessions.',
  },
  {
    title: 'Focus & productivity',
    tag: 'Stay on track',
    color: '#1f7180',
    accent: '#86c3c8',
    fact: 'Removing distractions can help you focus on the task in front of you.',
    question: 'Which can support focused study?',
    options: ['More notifications', 'Fewer distractions', 'Multitasking constantly'],
    answer: 1,
    summary:
      'Choose a clear task, reduce distractions, and take breaks when needed.',
  },
  {
    title: 'Remembering more',
    tag: 'Memory tools',
    color: '#c77842',
    accent: '#f1ba94',
    fact: 'Spaced repetition means reviewing material at intervals over time.',
    question: 'What is spaced repetition?',
    options: ['Reviewing at intervals', 'Reading once', 'Avoiding practice'],
    answer: 0,
    summary:
      'Reviewing ideas over time gives you repeated opportunities to recall them.',
  },
]

const vocabulary = [
  ['resilient', 'able to recover quickly from difficulty'],
  ['diligent', 'showing careful and persistent effort'],
  ['vivid', 'producing powerful, clear images in the mind'],
  ['meticulous', 'showing very careful attention to detail'],
]

function Icon({
  name,
  size = 20,
}: {
  name: 'arrow' | 'back' | 'cards' | 'quiz' | 'book' | 'spark' | 'plus' | 'note'
  size?: number
}) {
  const paths = {
    arrow: <><path d="M7 17 17 7M8 7h9v9" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    cards: <><rect x="5" y="6" width="12" height="14" rx="2" /><path d="M8 3h9a2 2 0 0 1 2 2v11" /></>,
    quiz: <><path d="M9.1 9a3 3 0 1 1 4.8 2.4c-1.2.9-1.9 1.4-1.9 2.6" /><path d="M12 18h.01" /><circle cx="12" cy="12" r="9" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" /></>,
    spark: <><path d="m12 2 1.5 5.2L18 10l-4.5 2.8L12 18l-1.5-5.2L6 10l4.5-2.8L12 2Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    note: <><path d="M6 3h9l3 3v15H6z" /><path d="M9 11h6M9 15h6M15 3v4h4" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  )
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark"><Icon name="spark" size={18} /></span>
      <span>prepcrux<span className="brand-dot">.</span></span>
    </div>
  )
}

function BackButton({ onClick, label = 'Go back' }: { onClick: () => void; label?: string }) {
  return (
    <button className="icon-button" onClick={onClick} aria-label={label}>
      <Icon name="back" />
    </button>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [unitIndex, setUnitIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [choice, setChoice] = useState<number | null>(null)
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('prepcrux-materials') || '[]')
    } catch {
      return []
    }
  })
  const unit = units[unitIndex]

  useEffect(() => {
    localStorage.setItem('prepcrux-materials', JSON.stringify(materials))
  }, [materials])

  const openUnit = (index: number) => {
    setUnitIndex(index)
    setChoice(null)
    setFlipped(false)
    setScreen('unit')
  }

  const openActivity = (next: Screen) => {
    setChoice(null)
    setFlipped(false)
    setScreen(next)
  }

  return (
    <main className="shell">
      <section className="app-frame" aria-live="polite">
        <div className="screen" key={screen}>
          {screen === 'welcome' && <Welcome onStart={() => setScreen('library')} />}
          {screen === 'library' && (
            <Library
              onOpen={openUnit}
              onMaterials={() => setScreen('materials')}
              onVocabulary={() => setScreen('vocabulary')}
              savedCount={materials.length}
            />
          )}
          {screen === 'materials' && (
            <Materials
              materials={materials}
              setMaterials={setMaterials}
              onBack={() => setScreen('library')}
            />
          )}
          {screen === 'vocabulary' && <Vocabulary onBack={() => setScreen('library')} />}
          {(['unit', 'flashcard', 'quiz', 'reviewer', 'summary'] as Screen[]).includes(screen) && (
            <UnitExperience
              screen={screen}
              unit={unit}
              unitIndex={unitIndex}
              flipped={flipped}
              setFlipped={setFlipped}
              choice={choice}
              setChoice={setChoice}
              onBack={() => setScreen(screen === 'unit' ? 'library' : 'unit')}
              onOpen={openActivity}
            />
          )}
        </div>
      </section>
      <p className="preview-note">Interactive browser preview · Your materials save on this device</p>
    </main>
  )
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome">
      <header><Brand light /></header>
      <div className="hero-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="paper paper-back" />
        <div className="paper paper-front">
          <Icon name="spark" size={42} />
          <i /><i /><i />
        </div>
        <span className="floating-spark"><Icon name="spark" size={24} /></span>
      </div>
      <div className="welcome-copy">
        <span className="eyebrow light">Learn at your pace</span>
        <h1>Study smarter.<br />Remember <em>more.</em></h1>
        <p>Create quizzes, flashcards, and notes that make every study session count.</p>
      </div>
      <button className="primary-button light-button" onClick={onStart}>
        Let&apos;s get started <Icon name="arrow" />
      </button>
    </div>
  )
}

function Library({
  onOpen,
  onMaterials,
  onVocabulary,
  savedCount,
}: {
  onOpen: (index: number) => void
  onMaterials: () => void
  onVocabulary: () => void
  savedCount: number
}) {
  return (
    <div className="page library">
      <header className="library-header"><Brand /><span className="status-pill">Ready to learn</span></header>
      <div className="title-row">
        <div><span className="eyebrow">Your learning space</span><h2>Study materials</h2></div>
        <div className="progress-ring"><span>4</span><small>units</small></div>
      </div>
      <p className="lead">Pick up where you left off, or create something new.</p>
      <div className="action-grid">
        <button className="feature-action" onClick={onMaterials}>
          <span className="feature-icon violet"><Icon name="plus" /></span>
          <span><strong>Your materials</strong><small>{savedCount ? `${savedCount} saved` : 'Create your first set'}</small></span>
          <Icon name="arrow" />
        </button>
        <button className="feature-action" onClick={onVocabulary}>
          <span className="feature-icon rose"><Icon name="book" /></span>
          <span><strong>Vocabulary</strong><small>Daily word & quiz</small></span>
          <Icon name="arrow" />
        </button>
      </div>
      <div className="section-heading"><h3>Explore your units</h3><span>4 curated lessons</span></div>
      <div className="unit-list">
        {units.map((item, index) => (
          <button
            className="unit-card"
            style={{ '--card': item.color, '--accent': item.accent } as React.CSSProperties}
            key={item.title}
            onClick={() => onOpen(index)}
          >
            <span className="unit-number">0{index + 1}</span>
            <span className="unit-copy"><small>{item.tag}</small><strong>{item.title}</strong></span>
            <span className="round-arrow"><Icon name="arrow" /></span>
          </button>
        ))}
      </div>
    </div>
  )
}

function UnitExperience({
  screen,
  unit,
  unitIndex,
  flipped,
  setFlipped,
  choice,
  setChoice,
  onBack,
  onOpen,
}: {
  screen: Screen
  unit: typeof units[number]
  unitIndex: number
  flipped: boolean
  setFlipped: (value: boolean) => void
  choice: number | null
  setChoice: (value: number) => void
  onBack: () => void
  onOpen: (screen: Screen) => void
}) {
  const activities = [
    ['cards', 'Flashcard', 'Flip to reveal a key idea', 'flashcard'],
    ['quiz', 'Quick quiz', 'Put your knowledge to the test', 'quiz'],
    ['book', 'Reviewer', 'Get to know the essentials', 'reviewer'],
    ['spark', 'Summary', 'The big idea, in a nutshell', 'summary'],
  ] as const
  return (
    <div className="detail-page">
      <header className="unit-header" style={{ '--card': unit.color } as React.CSSProperties}>
        <div className="unit-nav"><BackButton onClick={onBack} /><span>{screen === 'unit' ? 'Your study unit' : 'Back to unit'}</span></div>
        <small>Unit 0{unitIndex + 1} · {unit.tag}</small>
        <h2>{unit.title}</h2>
        <div className="header-orbit" />
      </header>
      <div className="detail-content">
        {screen === 'unit' && <>
          <span className="eyebrow">Four ways to learn</span>
          <h3>Choose how to study</h3>
          <div className="activity-list">
            {activities.map(([icon, title, description, target], i) => (
              <button key={target} className="activity-card" onClick={() => onOpen(target)}>
                <span className={`activity-icon tone-${i}`}><Icon name={icon} /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        </>}
        {screen === 'flashcard' && <>
          <span className="eyebrow">Flashcard · 1 of 1</span><h3>Let&apos;s remember this.</h3>
          <button className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <span className="card-label">{flipped ? 'The idea' : 'Quick question'}</span>
            <strong>{flipped ? unit.fact : `What's one key idea from ${unit.title.toLowerCase()}?`}</strong>
            <span className="flip-hint">Tap to flip <span>↻</span></span>
          </button>
        </>}
        {screen === 'quiz' && <>
          <span className="eyebrow">Quick quiz · 1 of 1</span><h3>Give it a try.</h3>
          <p className="question">{unit.question}</p>
          <div className="options">
            {unit.options.map((option, index) => (
              <button className={choice === index ? 'selected' : ''} onClick={() => setChoice(index)} key={option}>
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            ))}
          </div>
          {choice !== null && <div className={`feedback ${choice === unit.answer ? 'correct' : ''}`}>
            <Icon name={choice === unit.answer ? 'spark' : 'quiz'} />
            <span><strong>{choice === unit.answer ? 'Exactly right.' : 'Almost there.'}</strong><small>{choice === unit.answer ? 'You’ve got the key idea.' : 'Try another answer.'}</small></span>
          </div>}
        </>}
        {(screen === 'reviewer' || screen === 'summary') && <>
          <span className="eyebrow">{screen === 'reviewer' ? 'Reviewer' : 'The short version'}</span>
          <h3>{screen === 'reviewer' ? 'The essentials.' : 'In a nutshell.'}</h3>
          <div className="reading-card">
            <span><Icon name="spark" /> {unit.tag}</span>
            <p>{screen === 'reviewer' ? unit.fact : unit.summary}</p>
            <div className="reading-rule" />
            <small>Take a moment to explain this idea in your own words.</small>
          </div>
        </>}
      </div>
    </div>
  )
}

function Materials({
  materials,
  setMaterials,
  onBack,
}: {
  materials: Material[]
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>
  onBack: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [kind, setKind] = useState<'notes' | 'flashcards'>('notes')
  const save = () => {
    if (!title.trim() || !content.trim()) return
    setMaterials((current) => [{ id: crypto.randomUUID(), title: title.trim(), content: content.trim(), kind }, ...current])
    setTitle('')
    setContent('')
    setCreating(false)
  }
  return (
    <div className="sub-page">
      <SubHeader title="Your materials" subtitle="Create it once. Remember it longer." onBack={onBack} />
      <div className="sub-content">
        {!creating ? <>
          <button className="create-banner" onClick={() => setCreating(true)}>
            <span><Icon name="plus" size={26} /></span>
            <div><strong>Create study material</strong><small>Notes or flashcards</small></div>
            <Icon name="arrow" />
          </button>
          <div className="section-heading"><h3>Your collection</h3><span>{materials.length} saved</span></div>
          {materials.length === 0 ? <div className="empty-state"><span><Icon name="note" size={30} /></span><h4>Nothing here yet</h4><p>Turn your notes into something you can come back to.</p></div> :
            <div className="saved-list">{materials.map((item) => <article key={item.id} className="saved-item">
              <span className="activity-icon tone-0"><Icon name={item.kind === 'notes' ? 'note' : 'cards'} /></span>
              <div><small>{item.kind}</small><strong>{item.title}</strong><p>{item.content}</p></div>
              <button aria-label={`Delete ${item.title}`} onClick={() => setMaterials((all) => all.filter((entry) => entry.id !== item.id))}>×</button>
            </article>)}</div>}
        </> : <>
          <span className="eyebrow">New material</span><h3>Create your own</h3>
          <div className="segmented">
            <button className={kind === 'notes' ? 'active' : ''} onClick={() => setKind('notes')}>Notes</button>
            <button className={kind === 'flashcards' ? 'active' : ''} onClick={() => setKind('flashcards')}>Flashcard</button>
          </div>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology midterm" /></label>
          <label>{kind === 'notes' ? 'Your notes' : 'Front and back'}<textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={kind === 'notes' ? 'Write the ideas you want to remember…' : 'Separate the question and answer with a dash…'} /></label>
          <button className="primary-button" disabled={!title.trim() || !content.trim()} onClick={save}>Save material <Icon name="arrow" /></button>
          <button className="text-button" onClick={() => setCreating(false)}>Cancel</button>
        </>}
      </div>
    </div>
  )
}

function Vocabulary({ onBack }: { onBack: () => void }) {
  const daily = vocabulary[new Date().getDate() % vocabulary.length]
  const [mode, setMode] = useState<'menu' | 'daily' | 'quiz'>('menu')
  const [choice, setChoice] = useState<number | null>(null)
  const options = useMemo(() => [daily, ...vocabulary.filter((word) => word !== daily).slice(0, 2)], [daily])
  return (
    <div className="sub-page">
      <SubHeader title="Vocabulary" subtitle="Grow your word power." onBack={mode === 'menu' ? onBack : () => { setChoice(null); setMode('menu') }} />
      <div className="sub-content">
        {mode === 'menu' && <>
          <span className="eyebrow">Words worth knowing</span><h3>Explore language</h3>
          <p className="lead">Build a richer vocabulary, one curious word at a time.</p>
          <button className="word-feature" onClick={() => setMode('daily')}>
            <small>Word of the day</small><strong>{daily[0]}</strong><span>Discover today&apos;s word <Icon name="arrow" /></span>
          </button>
          <button className="quiz-banner" onClick={() => setMode('quiz')}>
            <span className="feature-icon rose"><Icon name="quiz" /></span>
            <span><strong>Quick word quiz</strong><small>Choose the right meaning</small></span><Icon name="arrow" />
          </button>
        </>}
        {mode === 'daily' && <>
          <span className="eyebrow">Today&apos;s word</span>
          <div className="daily-word"><h3>{daily[0]}</h3><span>adjective</span></div>
          <div className="definition-card"><small>Definition</small><p>{daily[1]}.</p></div>
          <div className="example"><span>In a sentence</span><p>Her <strong>{daily[0]}</strong> approach helped her keep learning through every challenge.</p></div>
        </>}
        {mode === 'quiz' && <>
          <span className="eyebrow">Quick quiz · 1 of 1</span><h3>What does “{daily[0]}” mean?</h3>
          <div className="options vocabulary-options">{options.map((item, index) => <button key={item[0]} onClick={() => setChoice(index)} className={choice === index ? 'selected' : ''}><span>{String.fromCharCode(65 + index)}</span>{item[1]}</button>)}</div>
          {choice !== null && <div className={`feedback ${choice === 0 ? 'correct' : ''}`}><Icon name="spark" /><span><strong>{choice === 0 ? 'That’s it.' : 'Not quite.'}</strong><small>{choice === 0 ? 'A new word in your toolkit.' : 'Give it another try.'}</small></span></div>}
        </>}
      </div>
    </div>
  )
}

function SubHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <header className="sub-header"><BackButton onClick={onBack} /><div><h2>{title}</h2><p>{subtitle}</p></div><span className="mini-mark"><Icon name="spark" /></span></header>
}

export default App
