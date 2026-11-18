import { useEffect, useRef, useState, type ReactNode } from 'react';
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

function Annotations({ entry }: { entry: Entry }) {
  const cues = entry === 'welcome'
    ? 'Start: rising tone + one short pulse; tutor asks the name; confirmation repeats the name with two short pulses.'
    : entry === 'camera'
      ? 'Speak “Tilt the page left”; alignment: rising tone + two short pulses; capture: shutter tone + one long pulse.'
      : entry === 'notes'
        ? 'File chosen: one short pulse; tutor reads the two-sentence orientation then offers Explain, Key points, Quiz me.'
        : entry === 'quiz'
          ? 'Read question and A–D options in order; correct: rising tone + one pulse; incorrect: neutral tone + two pulses. Timer is silent unless requested.'
          : 'Listening: soft rising tone + one pulse; Thinking: no repeating cues; Speaking: soft falling tone; End: two long pulses.';
  const focusLines = entry === 'welcome'
    ? ['Start — “Start. Begin study and tell Iris your name by voice”', 'Say my name — simulated “Amaka”', 'Type your name — optional local fallback', 'Continue / Yes, that’s right — confirm name']
    : entry === 'camera'
      ? ['Back to session', 'Page is aligned']
      : entry === 'notes'
        ? ['Back to session', 'Choose a local notes file', 'Use demo notes', 'Explain', 'Key points', 'Quiz me']
        : entry === 'quiz'
          ? ['End quiz', 'Pause timer', 'Add 30 seconds', 'Options A, B, C, D', 'Retry this question', 'Next question (disabled until answered)']
          : ['Voice action — initial state: Speaking', 'Page camera preview', 'Live captions — collapsed', 'Add notes', 'End study session'];
  const labels = entry === 'welcome'
    ? ['“Start. Begin study and tell Iris your name by voice”']
    : entry === 'camera'
      ? ['“Return to study session”', '“Page is aligned”']
      : entry === 'notes'
        ? ['“Return to study session”', '“Choose a local notes file”', '“Use demo notes”', '“Explain”', '“Key points”', '“Quiz me”']
        : entry === 'quiz'
          ? ['“End quiz and return to session”', '“Pause timer”', '“Extend timer by 30 seconds”', '“Option A, Ribosome”', '“Option B, Mitochondrion”', '“Option C, Golgi apparatus”', '“Option D, Cell membrane”', '“Retry this question”', '“Next question” (unavailable until answered)']
          : ['“Voice action, simulate response”', '“Page camera preview, open camera coaching”', '“Live captions, expand”', '“Add notes”', '“End study session”'];

  return (
    <aside className="iris-annotation" aria-label="Prototype accessibility and simulation notes">
      <h2>Dev handoff · {entry === 'contrast' ? 'high contrast' : entry === 'large' ? 'large text' : entry}</h2>
      <p><strong>Focus order</strong> {focusLines.map((line, index) => `${index + 1}. ${line}`).join('  ·  ')}</p>
      <p><strong>Exact initial screen-reader labels</strong> {labels.join(' · ')}. Labels that describe state update when the state changes.</p>
      <p><strong>Announcements</strong> Simulated tutor transcript, listening/thinking/speaking state, answer feedback, file selection and capture result are polite live announcements. Errors and answer correctness are assertive.</p>
      <p><strong>Audio & haptics specification</strong> {cues} These are native implementation requirements, not active audio. No audio starts before a user gesture. Voice and spoken options are transcript simulations. Only quiz vibration is attempted in this browser; other haptics are specified, not implemented.</p>
      <p className="annotation-meta"><strong>Contrast & metrics</strong> App text: near-white on near-black (&gt;15:1), yellow #FFD400 on black (&gt;13:1), black on yellow (&gt;13:1). High-contrast variant is true black/white plus yellow. Base body 19px, status 36px, display 43–59px; interactive targets 64px minimum (main Start 410px). Large-text session uses 28px body text and reflows with internal scrolling. Text contrast targets AAA; this is not a complete accessibility audit.</p>
      <p><strong>Simulation notes</strong> Name “Amaka”, study transcript, notes and quiz are local demo content. Selecting a demo file creates a filename chip only. File picker stays on device; no file content is read or uploaded. Camera sample page is CSS artwork, not a camera preview.</p>
    </aside>
  );
}

export function IrisPrototype({ entry }: { entry: Entry }) {
  const variant = entry === 'contrast' ? 'high-contrast' : entry === 'large' ? 'large-text' : '';
  const [screen, setScreen] = useState<Screen>(entry === 'welcome' ? 'welcome' : entry === 'camera' ? 'camera' : entry === 'notes' ? 'notes' : entry === 'quiz' ? 'quiz' : 'session');
  const [name, setName] = useState('');
  const [greetingStep, setGreetingStep] = useState<'asking' | 'confirm' | 'welcomed'>('asking');
  const [sessionState, setSessionState] = useState<'Listening' | 'Thinking' | 'Speaking'>('Speaking');
  const [sessionText, setSessionText] = useState('Welcome, Amaka. What would you like to understand today?');
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
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
  }, [screen, sessionState]);

  useEffect(() => {
    if (screen !== 'quiz' || timerPaused || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen, timerPaused, seconds]);

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
    setCaptionsOpen(false);
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
    </div>
  );

  const renderSession = () => (
    <div className="iris-screen iris-session-screen">
      <div className="iris-session-head">
        <div><h1>Study session</h1><p>With Iris · just for you</p></div>
        <span className="iris-session-count">01 / 01</span>
      </div>
      <div className="iris-visualizer" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <span className="iris-wave" key={index} />)}
      </div>
      <div className="iris-state-label" aria-live="polite">{sessionState}</div>
      <p className="iris-session-quote" aria-live="polite">{sessionText}</p>
      <button className="iris-session-major" onClick={answerWithVoice} aria-label={`Voice action, ${sessionState === 'Listening' ? 'start listening' : 'simulate response'}`}>
        <Icon>{sessionState === 'Listening' ? '◖' : 'Ⅱ'}</Icon>
        {sessionState === 'Listening' ? 'Talk to Iris' : 'Continue with Iris'}
      </button>
      <button className="iris-camera-thumb" onClick={enterCamera} aria-label="Page camera preview, open camera coaching">
        <span className="iris-thumb-page" aria-hidden="true" />
        <span>Page camera <span className="button-note">Open coaching</span></span>
        <span style={{ marginLeft: 'auto', fontSize: 24 }} aria-hidden="true">›</span>
      </button>
      <button className="iris-caption-toggle" aria-expanded={captionsOpen} onClick={() => setCaptionsOpen((open) => !open)} aria-label={`Live captions, ${captionsOpen ? 'collapse' : 'expand'}`}>
        <span>Live captions</span><span aria-hidden="true">{captionsOpen ? '−' : '+'}</span>
      </button>
      {captionsOpen && <div className="iris-caption-body">
        <p aria-live="polite">“{sessionText}”</p>
        <form onSubmit={(event) => { event.preventDefault(); if (captionDraft.trim()) { setSessionText(`You asked: ${captionDraft.trim()}`); setSessionState('Thinking'); setCaptionDraft(''); window.setTimeout(() => { setSessionText('Let’s work through that together, one step at a time.'); setSessionState('Speaking'); }, 900); } }}>
          <input className="iris-input" value={captionDraft} onChange={(event) => setCaptionDraft(event.target.value)} aria-label="Type a message to Iris" placeholder="Type if you prefer" />
          <button className="iris-btn compact" type="submit">Send message</button>
        </form>
      </div>}
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
    </div>
  );

  const renderEnded = () => (
    <div className="iris-screen iris-ended">
      <div className="iris-ended-mark" aria-hidden="true">✓</div>
      <div className="iris-step">Session ended</div>
      <h1>You did good work, {name || 'Amaka'}.</h1>
      <p>Your session has ended. Take a breath, or start again when you are ready.</p>
      <button className="iris-btn primary" onClick={resetWelcome}>Back to welcome</button>
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
          <div className="iris-bottom-nav" aria-hidden="true"><div className="iris-nav-pill" /></div>
        </section>
        <Annotations entry={entry} />
      </div>
    </main>
  );
}
