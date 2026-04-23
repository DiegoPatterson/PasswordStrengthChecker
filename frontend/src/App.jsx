import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { evaluatePassword } from './api'

const EMPTY_RESULT = {
  score: 0,
  rating: 'Very Weak',
  entropy_bits: 0,
  guess_difficulty: 'Very Low',
  crack_time_estimate: '< 1 second',
  findings: [],
  advice: ['Start typing to analyze password strength.'],
  checks: {},
}

const PREFILL_KEY = 'psc-prefill-password'

const WORD_BANK = [
  'amber',
  'atlas',
  'bloom',
  'cinder',
  'cloud',
  'delta',
  'ember',
  'falcon',
  'garden',
  'harbor',
  'ivory',
  'jungle',
  'kernel',
  'lunar',
  'meadow',
  'nebula',
  'olive',
  'prairie',
  'quantum',
  'river',
  'solstice',
  'timber',
  'ultra',
  'violet',
  'willow',
  'xenon',
  'yellow',
  'zephyr',
]

const SPECIAL_CHARS = '!@#$%^&*()-_=+[]{};:,.?'

function randomInt(max) {
  return Math.floor(Math.random() * max)
}

function shuffle(values) {
  const items = [...values]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }
  return items
}

function pickRandom(value) {
  return value[randomInt(value.length)]
}

function buildCharacterPools(options) {
  const lower = options.excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  const upper = options.excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = options.excludeAmbiguous ? '23456789' : '0123456789'
  const special = SPECIAL_CHARS

  return {
    lower,
    upper,
    numbers,
    special,
  }
}

function buildPasswordCandidate(options) {
  const pools = buildCharacterPools(options)
  const length = Math.max(8, Number(options.length) || 12)

  if (options.passphraseMode) {
    const wordCount = Math.max(3, Math.min(8, Math.round(length / 4)))
    const separator = options.special ? pickRandom(['-', '_', '.']) : '-'
    const words = Array.from({ length: wordCount }, () => pickRandom(WORD_BANK))
    let phrase = words.join(separator)

    if (options.uppercase) {
      phrase = words.map((word) => word[0].toUpperCase() + word.slice(1)).join(separator)
    }

    if (options.numbers) {
      phrase += `${pickRandom('23456789')} ${pickRandom('23456789')}`.replace(' ', '')
    }

    return phrase
  }

  const activePools = [
    options.lowercase ? pools.lower : '',
    options.uppercase ? pools.upper : '',
    options.numbers ? pools.numbers : '',
    options.specialCharacters ? pools.special : '',
  ].filter(Boolean)

  const usablePools = activePools.length > 0 ? activePools : [pools.lower]
  const requiredChars = usablePools.map((pool) => pickRandom(pool))
  const remainingLength = Math.max(length - requiredChars.length, 0)
  const body = Array.from({ length: remainingLength }, () => pickRandom(pickRandom(usablePools)))

  return shuffle([...requiredChars, ...body]).join('')
}

function HeaderNav() {
  return (
    <div className="topbar">
      <div>
        <p className="eyebrow">Secure Systems Midterm</p>
        <h1>Password Strength Intelligence</h1>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        <Link className="nav-link" to="/">
          Checker
        </Link>
        <Link className="nav-link" to="/generator">
          Generator
        </Link>
      </nav>
    </div>
  )
}

function ScoreRing({ score }) {
  const degree = Math.round((Math.max(0, Math.min(100, score)) / 100) * 360)

  return (
    <div
      className="score-ring"
      style={{
        background: `conic-gradient(var(--accent) ${degree}deg, rgba(255,255,255,0.15) ${degree}deg)`,
      }}
    >
      <div className="score-core">
        <span>{score}</span>
        <small>/100</small>
      </div>
    </div>
  )
}

function HomePage() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const prefill = sessionStorage.getItem(PREFILL_KEY)
    if (prefill) {
      setPassword(prefill)
      sessionStorage.removeItem(PREFILL_KEY)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setIsLoading(true)
      try {
        const data = await evaluatePassword(password, controller.signal)
        setResult(data)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResult({
            ...EMPTY_RESULT,
            advice: ['Could not reach API. Start the Python server and try again.'],
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(run, 120)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [password])

  const checkItems = useMemo(() => {
    const checks = result.checks || {}
    return [
      ['Minimum Length', checks.meets_min_length],
      ['Common Password', checks.is_common_password],
      ['Dictionary Word', checks.contains_dictionary_word],
      ['Sequential Pattern', checks.contains_sequence],
      ['Keyboard Walk', checks.contains_keyboard_walk],
      ['Repetition Pattern', checks.contains_repetition],
      ['Leetspeak Pattern', checks.contains_leetspeak_word],
    ]
  }, [result.checks])

  return (
    <main className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className="panel">
        <HeaderNav />

        <p className="subtitle">
          NIST-inspired scoring with entropy, dictionary risk, and pattern detection.
        </p>

        <div className="page-actions">
          <Link className="button button-secondary" to="/generator">
            Open Generator
          </Link>
        </div>

        <div className="layout">
          <article className="input-card">
            <label htmlFor="password">Password Input</label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type a password or passphrase..."
              autoComplete="off"
            />

            <div className="meta-grid">
              <div>
                <span>Rating</span>
                <strong>{result.rating}</strong>
              </div>
              <div>
                <span>Entropy</span>
                <strong>{result.entropy_bits} bits</strong>
              </div>
              <div>
                <span>Guess Difficulty</span>
                <strong>{result.guess_difficulty}</strong>
              </div>
              <div>
                <span>Crack Time (Offline)</span>
                <strong>{result.crack_time_estimate}</strong>
              </div>
            </div>

            <div className="status">{isLoading ? 'Analyzing...' : 'Live analysis active'}</div>
          </article>

          <article className="score-card">
            <ScoreRing score={result.score} />
            <h2>Score</h2>
            <p>
              Higher scores indicate better resistance to guessing and common password attacks.
            </p>
          </article>
        </div>

        <div className="layout secondary">
          <article className="details-card">
            <h3>Findings</h3>
            <ul>
              {(result.findings || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="details-card">
            <h3>Advice</h3>
            <ul>
              {(result.advice || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="checks-card">
          <h3>Rule Breakdown</h3>
          <div className="check-grid">
            {checkItems.map(([name, state]) => {
              const flagged = name !== 'Minimum Length' ? state === true : state === false
              return (
                <div className={`check-item ${flagged ? 'warn' : 'ok'}`} key={name}>
                  <span>{name}</span>
                  <b>{flagged ? 'Flagged' : 'Pass'}</b>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </main>
  )
}

function GeneratorPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    specialCharacters: true,
    excludeAmbiguous: false,
    passphraseMode: false,
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [result, setResult] = useState(EMPTY_RESULT)
  const [status, setStatus] = useState('Generate a password to score it with the checker rules.')
  const [copyState, setCopyState] = useState('Copy to clipboard')

  const generatePassword = async (shouldForcePass = false) => {
    setStatus('Generating...')

    let candidate = ''
    let analysis = EMPTY_RESULT

    for (let attempt = 0; attempt < (shouldForcePass ? 40 : 1); attempt += 1) {
      candidate = buildPasswordCandidate(settings)
      analysis = await evaluatePassword(candidate)

      if (!shouldForcePass || analysis.score >= 70) {
        break
      }
    }

    setGeneratedPassword(candidate)
    setResult(analysis)
    setStatus(
      shouldForcePass && analysis.score < 70
        ? 'Generated the strongest match in the current setting.'
        : 'Password generated and scored with the existing evaluator.',
    )
    setCopyState('Copy to clipboard')
  }

  useEffect(() => {
    void generatePassword(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetSettings = () => {
    const defaults = {
      length: 16,
      lowercase: true,
      uppercase: true,
      numbers: true,
      specialCharacters: true,
      excludeAmbiguous: false,
      passphraseMode: false,
    }
    setSettings(defaults)
    setStatus('Generator options reset.')
  }

  const copyPassword = async () => {
    if (!generatedPassword) {
      return
    }

    await navigator.clipboard.writeText(generatedPassword)
    setCopyState('Copied')
  }

  const sendToChecker = () => {
    if (!generatedPassword) {
      return
    }

    sessionStorage.setItem(PREFILL_KEY, generatedPassword)
    navigate('/')
  }

  const handleGenerateAndScore = () => {
    void generatePassword(false)
  }

  const handleGenerateUntilPasses = () => {
    void generatePassword(true)
  }

  const sliderLabel = settings.passphraseMode ? 'Word Count' : 'Length'
  const sliderHelper = settings.passphraseMode
    ? 'Controls how many words the passphrase generator uses.'
    : 'Controls the target character length for the generated password.'

  return (
    <main className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className="panel generator-panel">
        <HeaderNav />

        <p className="subtitle">
          Generate a password or passphrase, score it with the existing evaluator, and send it to
          the checker without leaving the site.
        </p>

        <div className="page-actions">
          <Link className="button button-secondary" to="/">
            Back to Checker
          </Link>
          <button className="button button-secondary" type="button" onClick={resetSettings}>
            Reset Options
          </button>
        </div>

        <div className="generator-layout">
          <article className="input-card generator-card">
            <div className="slider-block">
              <div className="slider-head">
                <label htmlFor="length">{sliderLabel}</label>
                <strong>{settings.length}</strong>
              </div>
              <input
                id="length"
                type="range"
                min="8"
                max="24"
                value={settings.length}
                onChange={(event) => updateSetting('length', Number(event.target.value))}
              />
              <p className="slider-help">{sliderHelper}</p>
            </div>

            <div className="toggle-grid">
              {[
                ['lowercase', 'Lowercase'],
                ['uppercase', 'Uppercase'],
                ['numbers', 'Numbers'],
                ['specialCharacters', 'Special Characters'],
                ['excludeAmbiguous', 'Exclude Ambiguous Characters'],
                ['passphraseMode', 'Passphrase Mode'],
              ].map(([key, label]) => (
                <label className="toggle-item" key={key}>
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(event) => updateSetting(key, event.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="button-row">
              <button className="button" type="button" onClick={handleGenerateAndScore}>
                Generate
              </button>
              <button className="button button-secondary" type="button" onClick={handleGenerateUntilPasses}>
                Regenerate Until It Passes
              </button>
            </div>

            <div className="button-row">
              <button className="button button-secondary" type="button" onClick={copyPassword}>
                {copyState}
              </button>
              <button className="button button-secondary" type="button" onClick={sendToChecker}>
                Send to Checker
              </button>
            </div>
          </article>

          <article className="score-card generator-preview">
            <div className="generated-output" aria-live="polite">
              {generatedPassword || 'Generated password will appear here.'}
            </div>

            <div className="meta-grid generator-metrics">
              <div>
                <span>Score</span>
                <strong>{result.score}/100</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>{result.rating}</strong>
              </div>
              <div>
                <span>Entropy</span>
                <strong>{result.entropy_bits} bits</strong>
              </div>
              <div>
                <span>Guess Difficulty</span>
                <strong>{result.guess_difficulty}</strong>
              </div>
            </div>

            <div className="status">{status}</div>

            <div className="details-card generator-details">
              <h3>Why It Passed or Failed</h3>
              <ul>
                {(result.findings || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="details-card generator-details">
              <h3>Improvement Advice</h3>
              <ul>
                {(result.advice || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/generator" element={<GeneratorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
