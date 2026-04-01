import { useEffect, useMemo, useState } from 'react'
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

function App() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(EMPTY_RESULT)
  const [isLoading, setIsLoading] = useState(false)

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
        <header className="header">
          <p className="eyebrow">Secure Systems Midterm</p>
          <h1>Password Strength Intelligence</h1>
          <p className="subtitle">
            NIST-inspired scoring with entropy, dictionary risk, and pattern detection.
          </p>
        </header>

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

export default App
