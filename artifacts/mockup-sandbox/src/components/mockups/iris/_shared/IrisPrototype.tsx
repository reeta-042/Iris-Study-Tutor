import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import '../_group.css';

type Entry = 'welcome' | 'session' | 'camera' | 'notes' | 'quiz' | 'contrast' | 'large';
type Screen = 'welcome' | 'greeting' | 'session' | 'camera' | 'notes' | 'quiz' | 'ended';

const quizQuestions = [
  {
    question: 'Which organelle releases most of the energy a cell can use?',
    options: ['Ribosome', 'Mitochondrion', 'Golgi apparatus', 'Cell membrane'],
    correct: 1,
    explanation: 'Correct. Mitochondria release usable energy through cellular respiration.',
  },
  {
    question: 'Which organelle makes proteins from genetic instructions?',
    options: ['Ribosome', 'Lysosome', 'Vacuole', 'Chloroplast'],
    correct: 0,
    explanation: 'Correct. Ribosomes assemble proteins from amino acids.',
  },
];

function Icon({ children }: { children: string }) {
  return <span className="iris-icon" aria-hidden="true">{children}</span>;
}

function AccessibilityNotes({
  entry,
  screen,
  sessionState,
  greetingStep,
  options,
  cameraStep,
  answer,
  questionIndex,
}: {
  entry: Entry;
  screen: Screen;
  sessionState: 'Listening' | 'Thinking' | 'Speaking';
  greetingStep: 'asking' | 'confirm' | 'welcomed';
  options: string[];
  cameraStep: 'align' | 'captured' | 'thinking' | 'response';
  answer: number | null;
  questionIndex: number;
}) {
  const cues = entry === 'welcome'
    ? 'Start: rising tone + one short pulse; tutor asks the name; confirmation repeats the name with two short pulses.'
    : entry === 'camera'
      ? 'Speak “Tilt the page left”; alignment: rising tone + two short pulses; capture: shutter tone + one long pulse.'
      : entry === 'notes'
        ? 'File chosen: one short pulse; tutor reads the two-sentence orientation then offers Explain, Key points, Quiz me.'
        : entry === 'quiz'
          ? 'Read question and A–D options in order; correct: rising tone + one pulse; incorrect: neutral tone + two pulses. Timer is silent unless requested.'
          : 'Listening: soft rising tone + one pulse; Thinking: no repeating cues; Speaking: soft falling tone; End: two long pulses.';
  let focusLines: string[];
  let labels: string[];
  if (screen === 'welcome') {
    focusLines = ['Start', 'Accessibility and prototype notes'];
    labels = ['“Start. Begin study and tell Iris your name by voice”', '“Accessibility and prototype notes, open”'];
  } else if (screen === 'greeting' && greetingStep === 'asking') {
    focusLines = ['Say my name', 'Type your name', 'Accessibility and prototype notes'];
    labels = ['“Use simulated voice to say Amaka”', '“Type your name”', '“Continue with typed name” (available after typing)', '“Accessibility and prototype notes, open”'];
  } else if (screen === 'greeting' && greetingStep === 'confirm') {
    focusLines = ['Yes, that’s right', 'Edit your name', 'Accessibility and prototype notes'];
    labels = ['“Yes, that’s right”', '“Edit your name”', '“Accessibility and prototype notes, open”'];
  } else if (screen === 'greeting') {
    focusLines = ['Start a study session', 'Edit name', 'Accessibility and prototype notes'];
    labels = ['“Start a study session”', '“Edit name”', '“Accessibility and prototype notes, open”'];
  } else if (screen === 'session') {
    focusLines = ['Live captions and accessibility notes', ...(sessionState === 'Listening' ? ['Circular microphone button'] : []), 'Page camera preview', 'Add notes', 'End'];
    labels = ['“Live captions and accessibility notes, open”', ...(sessionState === 'Listening' ? ['“Speak to Iris. Simulate a voice question”'] : []), '“Page camera preview, open camera coaching”', '“Add notes”', '“End study session”'];
  } else if (screen === 'camera') {
    const cameraActions = cameraStep === 'align'
      ? ['Page is aligned']
      : cameraStep === 'response'
        ? ['Return to study session', 'Try another page']
        : ['Return to session'];
    focusLines = ['Return to study session', ...cameraActions, 'Accessibility and prototype notes'];
    labels = ['“Return to study session”', ...cameraActions.map((action) => `“${action}”`), '“Accessibility and prototype notes, open”'];
  } else if (screen === 'notes') {
    focusLines = ['Return to study session', 'Choose a local notes file', 'Use demo notes', 'Explain', 'Key points', 'Quiz me', 'Accessibility and prototype notes'];
    labels = ['“Return to study session”', '“Choose a local notes file”', '“Use demo notes”', '“Explain”', '“Key points”', '“Quiz me”', '“Accessibility and prototype notes, open”'];
  } else if (screen === 'quiz') {
    const nextLabel = questionIndex >= quizQuestions.length - 1 ? 'Finish quiz and repeat' : 'Next question';
    const nextAction = answer === null ? [] : [nextLabel];
    focusLines = ['End quiz', 'Pause or resume timer', 'Extend timer', ...options.map((option, index) => `Option ${String.fromCharCode(65 + index)}`), 'Retry this question', ...nextAction, 'Accessibility and prototype notes'];
    labels = ['“End quiz and return to session”', '“Pause timer” or “Resume timer”', '“Extend timer by 30 seconds”', ...options.map((option, index) => `“Option ${String.fromCharCode(65 + index)}, ${option}”`), '“Retry this question”', ...(answer === null ? ['“Next question” unavailable until answered'] : [`“${nextLabel}”`]), '“Accessibility and prototype notes, open”'];
  } else if (screen === 'ended') {
    focusLines = ['Back to welcome', 'Accessibility and prototype notes'];
    labels = ['“Back to welcome”', '“Accessibility and prototype notes, open”'];
  } else {
    focusLines = ['Accessibility and prototype notes'];
    labels = ['“Accessibility and prototype notes, open”'];
  }

  return (
    <div className="iris-handoff-scroll">
      <section className="iris-handoff-section">
        <h3>Focus order</h3>
        <ol>{focusLines.map((line) => <li key={line}>{line}</li>)}</ol>
      </section>
      <section className="iris-handoff-section">
        <h3>Screen reader labels</h3>
        <p>{labels.join(' · ')}. Labels update with state.</p>
      </section>
      <section className="iris-handoff-section">
        <h3>Announcements</h3>
        <p>Tutor transcript, listening/thinking/speaking state, file selection and capture results are announced politely. Answer feedback is announced assertively and states correctness in words, not color alone.</p>
      </section>
      <section className="iris-handoff-section">
        <h3>Audio and haptics</h3>
        <p>{cues} This is the native behavior specification, not active audio. Nothing plays before a user gesture. Voice and spoken options are transcript simulations. Only quiz vibration is attempted in this browser; other haptics are specified, not implemented.</p>
      </section>
      <section className="iris-handoff-section">
        <h3>Contrast and type</h3>
        <p>White and pale pink on deep navy; deep navy on pink actions. Contrast figures are visual targets, not a complete audit. Base body 19px, session state 36px, display 43–59px. Touch targets are at least 64px; Start is 410px. Large text uses 28px body copy with reflow and scrolling. The default orb breathes and pulses during simulated speech. While listening, it briefly becomes a looking eye after a few seconds, then returns to the orb. Reduced motion keeps the orb still.</p>
      </section>
      <section className="iris-handoff-section">
        <h3>What is simulated</h3>
        <p>Name “Amaka”, tutor content, notes and quiz are local demo content. The demo-file chip shows a filename only. The local picker never reads or uploads files. Camera page art is CSS, not a camera feed. No AI, microphone, camera or speech service is connected.</p>
      </section>
    </div>
  );
}

function IrisOrb({ state }: { state: 'Listening' | 'Thinking' | 'Speaking' }) {
  return (
    <div className={`iris-orb iris-orb-${state.toLowerCase()}`} aria-hidden="true">
      <div className="iris-orb-body">
        <span className="iris-orb-membrane membrane-one" />
        <span className="iris-orb-membrane membrane-two" />
        <span className="iris-orb-membrane membrane-three" />
        <span className="iris-orb-cloud" />
      </div>
      {state === 'Listening' && (
        <svg className="iris-listening-eye" viewBox="0 0 220 140" focusable="false">
          <path className="iris-eye-contour" d="M12 70 Q110 -19 208 70 Q110 159 12 70Z" />
          <g className="iris-eye-look">
            <circle className="iris-eye-iris" cx="110" cy="70" r="32" />
            <circle className="iris-eye-pupil" cx="110" cy="70" r="16" />
            <circle className="iris-eye-highlight" cx="101" cy="60" r="5" />
          </g>
        </svg>
      )}
    </div>
  );
}

export function IrisPrototype({ entry }: { entry: Entry }) {
  const variant = entry === 'contrast' ? 'high-contrast' : entry === 'large' ? 'large-text' : '';
  const [screen, setScreen] = useState<Screen>(entry === 'welcome' ? 'welcome' : entry === 'camera' ? 'camera' : entry === 'notes' ? 'notes' : entry === 'quiz' ? 'quiz' : 'session');
  const [name, setName] = useState('');
  const [greetingStep, setGreetingStep] = useState<'asking' | 'confirm' | 'welcomed'>('asking');
  const [sessionState, setSessionState] = useState<'Listening' | 'Thinking' | 'Speaking'>('Speaking');
  const [sessionText, setSessionText] = useState('Welcome, Amaka. What would you like to understand today?');
  const [captionDraft, setCaptionDraft] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<'captions' | 'notes'>('captions');
  const [fileName, setFileName] = useState(entry === 'notes' ? 'Cell_structure_week_04.pdf' : '');
  const [notesStatus, setNotesStatus] = useState('');
  const [notesResponse, setNotesResponse] = useState(entry === 'notes' ? 'These notes cover cell structure and the roles of organelles. We can work through them together, one idea at a time.' : '');
  const [cameraStep, setCameraStep] = useState<'align' | 'captured' | 'thinking' | 'response'>('align');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [seconds, setSeconds] = useState(42);
  const [quizFeedback, setQuizFeedback] = useState('');
  const sessionTimeout = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetTriggerRef = useRef<HTMLButtonElement>(null);
  const tabButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const currentQuestion = quizQuestions[questionIndex % quizQuestions.length];

  useEffect(() => () => {
    if (sessionTimeout.current) window.clearTimeout(sessionTimeout.current);
  }, []);

  useEffect(() => {
    if (screen === 'session' && sessionState === 'Speaking') {
      if (sessionTimeout.current) window.clearTimeout(sessionTimeout.current);
      sessionTimeout.current = window.setTimeout(() => setSessionState('Listening'), 1900);
      return () => {
        if (sessionTimeout.current) window.clearTimeout(sessionTimeout.current);
      };
    }
    return undefined;
  }, [screen, sessionState]);

  useEffect(() => {
    if (screen !== 'quiz' || timerPaused || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen, timerPaused, seconds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sheetOpen && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (!sheetOpen && dialog.open) {
      dialog.close();
    }
  }, [sheetOpen]);

  const openSheet = (tab: 'captions' | 'notes', trigger: HTMLButtonElement) => {
    sheetTriggerRef.current = trigger;
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const closeSheet = () => dialogRef.current?.close();

  const onSheetClose = () => {
    setSheetOpen(false);
    window.requestAnimationFrame(() => sheetTriggerRef.current?.focus());
  };

  const onDialogBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) closeSheet();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === 'Home'
      ? 'captions'
      : event.key === 'End'
        ? 'notes'
        : event.key === 'ArrowRight'
          ? 'notes'
          : 'captions';
    const nextIndex = nextTab === 'captions' ? 0 : 1;
    setSheetTab(nextTab);
    window.requestAnimationFrame(() => tabButtonsRef.current[nextIndex]?.focus());
  };

  const submitCaption = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!captionDraft.trim()) return;
    const message = captionDraft.trim();
    setSessionText(`You asked: ${message}`);
    setSessionState('Thinking');
    setCaptionDraft('');
    window.setTimeout(() => {
      setSessionText('Let’s work through that together, one step at a time.');
      setSessionState('Speaking');
    }, 900);
  };

  const renderHandoffTrigger = (tab: 'captions' | 'notes' = 'notes') => (
    <button
      ref={sheetTriggerRef}
      className="iris-glass-trigger"
      onClick={(event) => openSheet(tab, event.currentTarget)}
      aria-haspopup="dialog"
      aria-label={tab === 'captions' ? 'Live captions and accessibility notes, open' : 'Accessibility and prototype notes, open'}
    >
      <span className="iris-glass-indicator" aria-hidden="true" />
      <span>{tab === 'captions' ? 'Live captions' : 'Accessibility notes'}</span>
      <span className="iris-glass-secondary" aria-live={tab === 'captions' ? 'polite' : undefined}>{tab === 'captions' ? sessionText : 'Focus, labels, and simulation details'}</span>
      <span className="iris-glass-arrow" aria-hidden="true">›</span>
    </button>
  );

  const beginSession = () => {
    setScreen('session');
    setSessionState('Speaking');
    setSessionText(`Welcome, ${name || 'Amaka'}. What would you like to understand today?`);
  };

  const startGreeting = () => {
    setGreetingStep('asking');
    setScreen('greeting');
  };

  const simulateVoiceName = () => {
    setName('Amaka');
    setGreetingStep('confirm');
  };

  const answerWithVoice = () => {
    if (sessionState === 'Thinking') return;
    setSessionState('Thinking');
    setSessionText('Let me put that into a clear, simple idea.');
    window.setTimeout(() => {
      setSessionText('A cell is a small living system. Each organelle has a specific role, like a team working together.');
      setSessionState('Speaking');
      window.setTimeout(() => setSessionState('Listening'), 1650);
    }, 1050);
  };

  const enterCamera = () => {
    setCameraStep('align');
    setScreen('camera');
  };

  const selectDemoFile = () => {
    setFileName('Cell_structure_week_04.pdf');
    setNotesStatus('Ready to work through your demo notes.');
    setNotesResponse('These notes cover cell structure and the roles of organelles. We can work through them together, one idea at a time.');
  };

  const explainNotes = (action: string) => {
    setNotesStatus('Thinking through the demo notes…');
    window.setTimeout(() => {
      const responses: Record<string, string> = {
        Explain: 'A cell is the basic unit of life. Its organelles each do a different job, from making energy to building proteins.',
        'Key points': 'Key point one: mitochondria release energy. Key point two: ribosomes build proteins. Key point three: the cell membrane controls what enters and leaves.',
      };
      if (action === 'Quiz me') {
        setScreen('quiz');
        setAnswer(null);
        setQuizFeedback('');
        return;
      }
      setNotesResponse(responses[action]);
      setNotesStatus('Ready');
    }, 750);
  };

  const simulateAlignment = () => {
    setCameraStep('captured');
    window.setTimeout(() => {
      setCameraStep('thinking');
      window.setTimeout(() => setCameraStep('response'), 850);
    }, 650);
  };

  const chooseAnswer = (index: number) => {
    if (answer !== null) return;
    setAnswer(index);
    const isCorrect = index === currentQuestion.correct;
    setQuizFeedback(isCorrect ? currentQuestion.explanation : `Not quite. The best answer is ${String.fromCharCode(65 + currentQuestion.correct)}, ${currentQuestion.options[currentQuestion.correct]}. Try again when you are ready.`);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(isCorrect ? 35 : [25, 35, 25]); } catch { /* optional browser enhancement */ }
    }
  };

  const nextQuestion = () => {
    if (answer === null) return;
    if (questionIndex >= quizQuestions.length - 1) {
      setQuestionIndex(0);
    } else {
      setQuestionIndex((index) => index + 1);
    }
    setAnswer(null);
    setQuizFeedback('');
    setSeconds(42);
  };

  const resetWelcome = () => {
    setScreen('welcome');
    setGreetingStep('asking');
  };

  const renderWelcome = () => (
    <div className="iris-screen iris-start-screen">
      <div className="iris-welcome-copy">
        <div className="eyebrow">Your study companion</div>
        <h1>Study on<br />your terms.</h1>
        <p>Ask a question. Hear a clear answer. Keep moving.</p>
      </div>
      <button className="iris-btn primary iris-start" onClick={startGreeting} aria-label="Start. Begin study and tell Iris your name by voice">
        <span>Start</span><span className="iris-start-arrow" aria-hidden="true">→</span>
      </button>
      <div className="iris-whisper">Voice first. You are always in control.</div>
      {renderHandoffTrigger()}
    </div>
  );

  const renderGreeting = () => (
    <div className="iris-screen iris-greeting">
      <div className="iris-step">Getting started · {greetingStep === 'asking' ? '1 of 2' : '2 of 2'}</div>
      {greetingStep === 'asking' ? (
        <>
          <h1>Let’s begin<br />with your name.</h1>
          <div className="iris-transcript" aria-live="polite">
            <strong>Iris is speaking</strong>
            “Hi, I’m Iris. What name would you like me to use?”
          </div>
          <div className="iris-form-actions">
            <button className="iris-btn primary" onClick={simulateVoiceName} aria-label="Use simulated voice to say Amaka">
              <Icon>◖</Icon><span>Say my name<span className="button-note">Use simulated voice · “Amaka”</span></span>
            </button>
            <label>
              <span className="iris-top-label">Or type your name</span>
              <input className="iris-input" value={name} onChange={(event) => setName(event.target.value)} aria-label="Type your name" placeholder="Your name" />
            </label>
            <button className="iris-btn compact" onClick={() => setGreetingStep('confirm')} aria-label="Continue with typed name" disabled={!name.trim()}>Continue</button>
          </div>
        </>
      ) : (
        <>
          <h1>{greetingStep === 'welcomed' ? `Welcome, ${name || 'Amaka'}` : 'Did I get that right?'}</h1>
          {greetingStep === 'confirm' ? (
            <>
              <div className="iris-transcript" aria-live="polite"><strong>Name heard</strong>{name || 'Amaka'}</div>
              <div className="iris-form-actions">
                <button className="iris-btn primary" onClick={() => setGreetingStep('welcomed')}>Yes, that’s right</button>
                <label><span className="iris-top-label">Edit your name</span><input className="iris-input" value={name} onChange={(event) => setName(event.target.value)} aria-label="Edit your name" /></label>
              </div>
            </>
          ) : (
            <>
              <p>Good to have you here. We can take it one idea at a time.</p>
              <div className="iris-form-actions">
                <button className="iris-btn primary" onClick={beginSession}>Start a study session</button>
                <button className="iris-btn subtle compact" onClick={() => setGreetingStep('confirm')}>Edit name</button>
              </div>
            </>
          )}
        </>
      )}
      {renderHandoffTrigger()}
    </div>
  );

  const renderSession = () => (
    <div className="iris-screen iris-session-screen">
      <div className="iris-session-head">
        <div><h1>Study session</h1><p>With Iris · just for you</p></div>
        <span className="iris-session-count">01 / 01</span>
      </div>
      <IrisOrb state={sessionState} />
      {renderHandoffTrigger('captions')}
      <div className="iris-state-label" aria-live="polite">{sessionState}</div>
      <div className="iris-voice-control">
        {sessionState === 'Listening' ? (
          <>
            <button className="iris-session-major" onClick={answerWithVoice} aria-label="Speak to Iris. Simulate a voice question">
              <svg viewBox="0 0 32 32" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
                <rect x="11" y="3" width="10" height="17" rx="5" />
                <path d="M6 15v1a10 10 0 0 0 20 0v-1M16 26v4M11 30h10" />
              </svg>
            </button>
            <span className="iris-call-hint">Your turn · tap to speak</span>
          </>
        ) : <span className="iris-call-hint">{sessionState === 'Speaking' ? 'Iris is speaking. Just listen.' : 'A moment to think…'}</span>}
      </div>
      <button className="iris-camera-thumb" onClick={enterCamera} aria-label="Page camera preview, open camera coaching">
        <span className="iris-thumb-page" aria-hidden="true" />
        <span className="iris-thumb-copy">Page camera<span className="button-note">Open coaching</span></span>
        <span style={{ marginLeft: 'auto', fontSize: 24 }} aria-hidden="true">›</span>
      </button>
      <div className="iris-footer-actions">
        <button className="iris-btn compact" onClick={() => { setScreen('notes'); setNotesStatus(''); }} aria-label="Add notes">＋ Add notes</button>
        <button className="iris-btn compact subtle" onClick={() => setScreen('ended')} aria-label="End study session">End</button>
      </div>
    </div>
  );

  const renderCamera = () => {
    const copy = cameraStep === 'align' ? 'Tilt the page left' : cameraStep === 'captured' ? 'Page captured' : cameraStep === 'thinking' ? 'Thinking' : 'I can help with this page.';
    return (
      <div className="iris-screen iris-camera-content">
        <button className="iris-btn compact subtle" onClick={() => setScreen('session')} aria-label="Return to study session">← Back to session</button>
        <div className="iris-step">Page coaching</div>
        <h1 aria-live="polite">{copy}</h1>
        <div className="iris-frame-guide" role="img" aria-label="Illustrative sample page inside a framing guide">
          <div className="iris-page-sample" aria-hidden="true">
            <strong>Cell structure</strong><div className="iris-page-line" /><div className="iris-page-line" /><div className="iris-page-line" /><div className="iris-page-diagram" /><div className="iris-page-line" />
          </div>
          <div className="iris-guide-corners" />
        </div>
        <p className="iris-camera-note" aria-live="polite">
          {cameraStep === 'align' ? 'Move the page slowly until it feels steady in the frame.' : cameraStep === 'captured' ? 'The page is held in this local demo.' : cameraStep === 'thinking' ? 'I’m finding a useful place to begin.' : 'This section introduces organelles and what each one does.'}
        </p>
        <div className="iris-camera-actions">
          {cameraStep === 'align' ? <button className="iris-btn primary" onClick={simulateAlignment}>Page is aligned</button> : cameraStep === 'response' ? <button className="iris-btn primary" onClick={() => setScreen('session')}>Return to study session</button> : <button className="iris-btn" onClick={() => setScreen('session')}>Return to session</button>}
          {cameraStep === 'response' && <button className="iris-btn compact" onClick={() => { setCameraStep('align'); }}>Try another page</button>}
        </div>
        {renderHandoffTrigger()}
      </div>
    );
  };

  const renderNotes = () => (
    <div className="iris-screen iris-notes-content">
      <button className="iris-btn compact subtle" onClick={() => setScreen('session')} aria-label="Return to study session">← Back to session</button>
      <div className="iris-step">Add notes</div>
      <h1>Bring your<br />course notes.</h1>
      <p>Choose a file on this device, or use the demo notes to keep exploring.</p>
      <div className="iris-file-picker">
        <div className="iris-file-icon" aria-hidden="true">PDF</div>
        <label className="iris-file-label" htmlFor="iris-local-file">
          <strong>Choose a local file</strong><p>PDF or text · stays on this device</p>
          <input id="iris-local-file" className="iris-file" type="file" accept=".pdf,.txt,text/plain,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileName(file.name); setNotesStatus('File selected. This prototype does not read or upload it.'); setNotesResponse('Your file is selected. In this prototype, notes content is represented by the demo transcript only.'); } }} aria-label="Choose a local notes file" />
        </label>
      </div>
      <button className="iris-btn compact" onClick={selectDemoFile}>Use demo notes</button>
      {fileName && <div className="iris-file-name" aria-live="polite">Selected · {fileName}</div>}
      <div className="iris-upload-status" aria-live="polite">{notesStatus}</div>
      {notesResponse && <div className="iris-notes-transcript" aria-live="polite"><p>{notesResponse}</p></div>}
      <div className="iris-suggested">
        <button className="iris-btn" onClick={() => explainNotes('Explain')}>Explain</button>
        <button className="iris-btn" onClick={() => explainNotes('Key points')}>Key points</button>
        <button className="iris-btn primary" onClick={() => explainNotes('Quiz me')}>Quiz me</button>
      </div>
      {renderHandoffTrigger()}
    </div>
  );

  const renderQuiz = () => (
    <div className="iris-screen iris-quiz-content">
      <button className="iris-btn compact subtle" onClick={() => setScreen('session')} aria-label="End quiz and return to session">← End quiz</button>
      <div className="iris-quiz-top">
        <span>Quick check · {questionIndex + 1} of {quizQuestions.length}</span>
        <div className="iris-timer"><span aria-label={timerPaused ? 'Timer paused' : `${seconds} seconds remaining`}>{timerPaused ? 'Paused' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</span><button onClick={() => setTimerPaused((paused) => !paused)} aria-label={timerPaused ? 'Resume timer' : 'Pause timer'}>{timerPaused ? 'Resume' : 'Pause'}</button></div>
      </div>
      <button className="iris-btn compact subtle" onClick={() => setSeconds((time) => time + 30)} aria-label="Extend timer by 30 seconds">＋ Add 30 sec</button>
      <div className="iris-quiz-question">{currentQuestion.question}</div>
      <p className="iris-quiz-transcript" aria-live="polite">Iris asks: “{currentQuestion.question}” Options: {currentQuestion.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('; ')}.</p>
      <div className="iris-answer-list" role="group" aria-label="Choose an answer">
        {currentQuestion.options.map((option, index) => {
          const isCorrectAnswer = index === currentQuestion.correct;
          const isSelected = answer === index;
          const classes = ['iris-answer', isSelected ? 'selected' : '', answer !== null && isCorrectAnswer ? 'correct' : '', isSelected && !isCorrectAnswer ? 'incorrect' : ''].filter(Boolean).join(' ');
          return <button key={option} className={classes} onClick={() => chooseAnswer(index)} aria-pressed={isSelected} aria-label={`Option ${String.fromCharCode(65 + index)}, ${option}${answer !== null && isCorrectAnswer ? ', correct answer' : isSelected ? ', your answer' : ''}`}>
            <span className="iris-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
          </button>;
        })}
      </div>
      <div className="iris-feedback" aria-live="assertive">{quizFeedback || 'Choose an answer when you are ready. The timer never forces a submission.'}</div>
      <div className="iris-quiz-controls">
        <button className="iris-btn compact" onClick={() => { setAnswer(null); setQuizFeedback('Question reset. Choose any option when you are ready.'); }} aria-label="Retry this question">Retry</button>
        <button className="iris-btn primary compact" onClick={nextQuestion} disabled={answer === null} aria-label={questionIndex >= quizQuestions.length - 1 ? 'Finish quiz and repeat' : 'Next question'}>Next question</button>
      </div>
      {renderHandoffTrigger()}
    </div>
  );

  const renderEnded = () => (
    <div className="iris-screen iris-ended">
      <div className="iris-ended-mark" aria-hidden="true">✓</div>
      <div className="iris-step">Session ended</div>
      <h1>You did good work, {name || 'Amaka'}.</h1>
      <p>Your session has ended. Take a breath, or start again when you are ready.</p>
      <button className="iris-btn primary" onClick={resetWelcome}>Back to welcome</button>
      {renderHandoffTrigger()}
    </div>
  );

  let body: ReactNode;
  switch (screen) {
    case 'welcome': body = renderWelcome(); break;
    case 'greeting': body = renderGreeting(); break;
    case 'session': body = renderSession(); break;
    case 'camera': body = renderCamera(); break;
    case 'notes': body = renderNotes(); break;
    case 'quiz': body = renderQuiz(); break;
    default: body = renderEnded();
  }

  return (
    <main className={`iris-prototype ${variant}`}>
      <div className="iris-shell">
        <section className="iris-app" aria-label="IRIS study companion">
          <div className="iris-statusbar" aria-hidden="true"><span>9:41</span><span>●  ▮▮▮  ▰</span></div>
          <header className="iris-brandbar">
            <div className="iris-wordmark"><span className="iris-brand-mark" />IRIS</div>
            <span className="iris-top-label">Study together</span>
          </header>
          {body}
          <dialog
            ref={dialogRef}
            className="iris-dialog"
            aria-modal="true"
            aria-labelledby="iris-dialog-title"
            aria-describedby="iris-dialog-description"
            onClose={onSheetClose}
            onClick={onDialogBackdropClick}
          >
            <div className="iris-sheet">
              <div className="iris-sheet-handle" aria-hidden="true" />
              <header className="iris-sheet-header">
                <div>
                  <p className="iris-sheet-kicker">IRIS · {entry === 'contrast' ? 'high contrast' : entry === 'large' ? 'large text' : 'study companion'}</p>
                  <h2 id="iris-dialog-title">{screen === 'session' && sheetTab === 'captions' ? 'Captions & reply' : 'Accessibility notes'}</h2>
                </div>
                <button ref={closeButtonRef} className="iris-sheet-close" type="button" onClick={closeSheet} aria-label="Close captions and accessibility notes">Close</button>
              </header>
              <p id="iris-dialog-description" className="iris-sheet-description">
                {screen === 'session' && sheetTab === 'captions' ? 'Read every tutor response or type a message instead of speaking.' : 'Current screen focus, labels, announcements, and simulation details.'}
              </p>
              {screen === 'session' && (
                <div className="iris-sheet-tabs" role="tablist" aria-label="Session support">
                  <button
                    ref={(element) => { tabButtonsRef.current[0] = element; }}
                    className={`iris-sheet-tab ${sheetTab === 'captions' ? 'active' : ''}`}
                    type="button"
                    role="tab"
                    id="iris-tab-captions"
                    aria-selected={sheetTab === 'captions'}
                    aria-controls="iris-captions-panel"
                    tabIndex={sheetTab === 'captions' ? 0 : -1}
                    onClick={() => setSheetTab('captions')}
                    onKeyDown={onTabKeyDown}
                  >Captions</button>
                  <button
                    ref={(element) => { tabButtonsRef.current[1] = element; }}
                    className={`iris-sheet-tab ${sheetTab === 'notes' ? 'active' : ''}`}
                    type="button"
                    role="tab"
                    id="iris-tab-notes"
                    aria-selected={sheetTab === 'notes'}
                    aria-controls="iris-notes-panel"
                    tabIndex={sheetTab === 'notes' ? 0 : -1}
                    onClick={() => setSheetTab('notes')}
                    onKeyDown={onTabKeyDown}
                  >Accessibility notes</button>
                </div>
              )}
              <div className="iris-sheet-body">
                {screen === 'session' ? (
                  <>
                    <section
                      id="iris-captions-panel"
                      role="tabpanel"
                      aria-labelledby="iris-tab-captions"
                      className="iris-caption-panel"
                      hidden={sheetTab !== 'captions'}
                      tabIndex={0}
                    >
                      <h3>Live transcript</h3>
                      <p className="iris-transcript-live" aria-live="polite">{sessionText}</p>
                      <form className="iris-caption-form" onSubmit={submitCaption}>
                        <label htmlFor="iris-caption-reply">Type a message to Iris</label>
                        <input
                          id="iris-caption-reply"
                          className="iris-input"
                          value={captionDraft}
                          onChange={(event) => setCaptionDraft(event.target.value)}
                          placeholder="Type if you prefer"
                        />
                        <button className="iris-btn primary compact" type="submit">Send message</button>
                      </form>
                    </section>
                    <section
                      id="iris-notes-panel"
                      role="tabpanel"
                      aria-labelledby="iris-tab-notes"
                      className="iris-accessibility-panel"
                      hidden={sheetTab !== 'notes'}
                      tabIndex={0}
                    >
                      <AccessibilityNotes
                        entry={entry}
                        screen={screen}
                        sessionState={sessionState}
                        greetingStep={greetingStep}
                        options={currentQuestion.options}
                        cameraStep={cameraStep}
                        answer={answer}
                        questionIndex={questionIndex}
                      />
                    </section>
                  </>
                ) : (
                  <section
                    id="iris-accessibility-panel"
                    role="region"
                    aria-labelledby="iris-dialog-title"
                    className="iris-accessibility-panel"
                    tabIndex={0}
                  >
                    <AccessibilityNotes
                      entry={entry}
                      screen={screen}
                      sessionState={sessionState}
                      greetingStep={greetingStep}
                      options={currentQuestion.options}
                      cameraStep={cameraStep}
                      answer={answer}
                      questionIndex={questionIndex}
                    />
                  </section>
                )}
              </div>
            </div>
          </dialog>
          <div className="iris-bottom-nav" aria-hidden="true"><div className="iris-nav-pill" /></div>
        </section>
      </div>
    </main>
  );
}
