import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import { analyzeMealImage } from './claude'
import { loadLog, saveEntry, deleteEntry, loadApiKey, saveApiKey } from './storage'
import { getWarnings, sumMacros, getProgressPercent } from './warnings'
import type { Screen, FoodEntry, Macros } from './types'

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function timeStr(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MacroProgress({ label, value, nutrient, color }: {
  label: string; value: number; nutrient: Parameters<typeof getProgressPercent>[1]; color: string
}) {
  const pct = getProgressPercent(value, nutrient)
  return (
    <div className="progress-bar-wrap">
      <div className="progress-label">
        <span style={{ color }}>{label}</span>
        <span style={{ color }}>{value}{nutrient === 'calories' ? 'kcal' : 'g'}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MacroGrid({ macros }: { macros: Macros }) {
  return (
    <div className="macro-grid">
      <div className="macro-card px-box-yellow">
        <span className="macro-label">CALORIES</span>
        <span className="macro-value macro-cal">{macros.calories}</span>
        <span className="macro-unit">kcal</span>
      </div>
      <div className="macro-card px-box-cyan">
        <span className="macro-label">CARBS</span>
        <span className="macro-value macro-carb">{macros.carbs}</span>
        <span className="macro-unit">g</span>
      </div>
      <div className="macro-card px-box">
        <span className="macro-label">PROTEIN</span>
        <span className="macro-value macro-prot">{macros.protein}</span>
        <span className="macro-unit">g</span>
      </div>
      <div className="macro-card px-box-orange">
        <span className="macro-label">FAT</span>
        <span className="macro-value macro-fat">{macros.fat}</span>
        <span className="macro-unit">g</span>
      </div>
      <div className="macro-card px-box" style={{ gridColumn: 'span 2', borderColor: '#9b59b6', boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 6px #9b59b6' }}>
        <span className="macro-label">FIBER</span>
        <span className="macro-value macro-fib">{macros.fiber}</span>
        <span className="macro-unit">g</span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Camera
// ────────────────────────────────────────────────────────────
function CameraScreen({ onCapture, onBack }: { onCapture: (b64: string, mime: string) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          setStreaming(true)
        }
      })
      .catch(() => setError('Camera unavailable — use file upload below'))
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  function shoot() {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current
    canvasRef.current.width = v.videoWidth
    canvasRef.current.height = v.videoHeight
    canvasRef.current.getContext('2d')!.drawImage(v, 0, 0)
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7)
    setPreview(dataUrl)
  }

  function confirm() {
    if (!preview) return
    const b64 = preview.split(',')[1]
    onCapture(b64, 'image/jpeg')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function confirmFile() {
    if (!preview) return
    const [header, b64] = preview.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    onCapture(b64, mime)
  }

  return (
    <>
      <div className="screen">
        {!preview ? (
          <>
            {error ? (
              <div className="px-box-red" style={{ padding: 12, fontSize: 8, color: 'var(--red)', lineHeight: 1.8 }}>
                {error}
              </div>
            ) : (
              <div className="camera-container">
                <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
                <div className="camera-overlay">
                  <div className="scan-line" />
                  <div className="corner corner-tl" />
                  <div className="corner corner-tr" />
                  <div className="corner corner-bl" />
                  <div className="corner corner-br" />
                </div>
              </div>
            )}
            <div className="desc-text">📸 Point camera at your meal, then tap SCAN</div>
            <button className="btn btn-green btn-lg" onClick={shoot} disabled={!streaming} style={{ width: '100%' }}>
              ▶ SCAN MEAL
            </button>
            <button className="btn btn-cyan" onClick={() => fileRef.current?.click()} style={{ width: '100%' }}>
              📁 UPLOAD PHOTO
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </>
        ) : (
          <>
            <img src={preview} alt="preview" className="camera-preview" />
            <div className="desc-text" style={{ textAlign: 'center', fontSize: 8, color: 'var(--yellow)' }}>
              ★ READY TO ANALYZE? ★
            </div>
            <button className="btn btn-yellow btn-lg" onClick={streaming ? confirm : confirmFile} style={{ width: '100%' }}>
              ✓ ANALYZE
            </button>
            <button className="btn btn-red" onClick={() => setPreview(null)} style={{ width: '100%' }}>
              ✗ RETAKE
            </button>
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="bottom-bar">
        <button className="btn btn-red btn-sm" onClick={onBack}>← BACK</button>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────────────────
function Dashboard({ entries, onDelete, onNewScan }: {
  entries: FoodEntry[]
  onDelete: (id: string) => void
  onNewScan: () => void
}) {
  const totals = sumMacros(entries)
  const warnings = getWarnings(totals)

  return (
    <>
      <div className="screen">
        <div className="cal-banner px-box-yellow">
          <div className="cal-big">{totals.calories}</div>
          <div className="cal-label">TOTAL CALORIES TODAY</div>
        </div>

        <div>
          <div className="section-header">TODAY'S MACROS</div>
          <div style={{ paddingTop: 12 }}>
            <MacroProgress label="CARBS" value={totals.carbs} nutrient="carbs" color="var(--cyan)" />
            <MacroProgress label="PROTEIN" value={totals.protein} nutrient="protein" color="var(--green)" />
            <MacroProgress label="FAT" value={totals.fat} nutrient="fat" color="var(--orange)" />
            <MacroProgress label="FIBER" value={totals.fiber} nutrient="fiber" color="#9b59b6" />
          </div>
        </div>

        {warnings.length > 0 && (
          <div>
            <div className="section-header" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
              ⚠ ALERTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
              {warnings.map(w => (
                <div key={w.nutrient} className={w.severity === 'critical' ? 'warning-card px-box-red' : 'warning-card px-box-orange'}>
                  <span className="warning-emoji">{w.emoji}</span>
                  <div className="warning-content">
                    <div className="warning-nutrient" style={{ color: w.severity === 'critical' ? 'var(--red)' : 'var(--orange)' }}>
                      LOW {w.nutrient}
                    </div>
                    <div className="warning-msg">{w.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="section-header">FOOD LOG</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10 }}>
            {entries.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">🍽️</span>
                <div className="empty-text">NO MEALS LOGGED YET<br />SCAN YOUR FIRST MEAL!</div>
              </div>
            ) : (
              [...entries].reverse().map(e => (
                <div key={e.id} className="entry">
                  {e.imageData
                    ? <img src={`data:image/jpeg;base64,${e.imageData.startsWith('/') ? e.imageData : e.imageData}`} alt="" className="entry-thumb" />
                    : <div className="entry-thumb-ph">🍴</div>
                  }
                  <div className="entry-info">
                    <div className="entry-desc">{e.description}</div>
                    <div className="entry-macros">
                      <span style={{ color: 'var(--yellow)' }}>{e.macros.calories}kcal</span>
                      <span style={{ color: 'var(--cyan)' }}>C:{e.macros.carbs}g</span>
                      <span style={{ color: 'var(--green)' }}>P:{e.macros.protein}g</span>
                      <span style={{ color: 'var(--orange)' }}>F:{e.macros.fat}g</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="entry-time">{timeStr(e.timestamp)}</span>
                    <button className="btn btn-red btn-sm" onClick={() => onDelete(e.id)} style={{ fontSize: 7, padding: '4px 8px' }}>✗</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <button className="btn btn-green btn-lg" onClick={onNewScan} style={{ flex: 1 }}>
          + SCAN MEAL
        </button>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Settings
// ────────────────────────────────────────────────────────────
function Settings({ onBack }: { onBack: () => void }) {
  const [key, setKey] = useState(loadApiKey)
  const [saved, setSaved] = useState(false)

  function save() {
    saveApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="screen">
        <div className="section-header">SETTINGS</div>
        <div className="settings-field px-box-cyan" style={{ padding: 12 }}>
          <label className="settings-label">ANTHROPIC API KEY</label>
          <input
            type="password"
            className="settings-input"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
          />
          <div className="settings-hint">
            Your key is stored locally on-device only.<br />
            Get yours at console.anthropic.com
          </div>
        </div>
        <button className="btn btn-yellow btn-lg" onClick={save} style={{ width: '100%' }}>
          {saved ? '✓ SAVED!' : '💾 SAVE KEY'}
        </button>
        <div className="px-box" style={{ padding: 12 }}>
          <div className="section-header" style={{ fontSize: 8, marginBottom: 10 }}>HOW TO USE</div>
          <div className="settings-hint" style={{ lineHeight: 2.2 }}>
            1. Enter your Anthropic API key above<br />
            2. Go home and tap SCAN MEAL<br />
            3. Take a photo of your food<br />
            4. AI analyzes macros instantly<br />
            5. Track your daily intake!
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <button className="btn btn-red btn-sm" onClick={onBack}>← BACK</button>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Result
// ────────────────────────────────────────────────────────────
function ResultScreen({ entry, onSave, onDiscard }: {
  entry: FoodEntry; onSave: () => void; onDiscard: () => void
}) {
  return (
    <>
      <div className="screen">
        <div className="desc-text" style={{ textAlign: 'center', fontSize: 9, color: 'var(--green)' }}>
          ★ ANALYSIS COMPLETE ★
        </div>
        {entry.imageData && (
          <img
            src={`data:image/jpeg;base64,${entry.imageData}`}
            alt="meal"
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', border: '3px solid var(--yellow)', boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 6px var(--yellow)' }}
          />
        )}
        <div className="px-box-cyan" style={{ padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--white)', lineHeight: 1.8 }}>{entry.description}</div>
        </div>
        <MacroGrid macros={entry.macros} />
      </div>
      <div className="bottom-bar">
        <button className="btn btn-green" onClick={onSave} style={{ flex: 2 }}>✓ LOG IT</button>
        <button className="btn btn-red" onClick={onDiscard} style={{ flex: 1 }}>✗ SKIP</button>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Home
// ────────────────────────────────────────────────────────────
function HomeScreen({ entries, onScan, onDashboard }: {
  entries: FoodEntry[]; onScan: () => void; onDashboard: () => void
}) {
  const totals = sumMacros(entries)
  const hasEntries = entries.length > 0

  return (
    <div className="screen">
      <div className="home-hero">
        <div className="pixel-logo">CARB<br />QUEST</div>
        <div className="pixel-subtitle">8-BIT MACRO TRACKER</div>
        <span className="pixel-sprite">🎮</span>
      </div>

      {hasEntries && (
        <div className="px-box-yellow cal-banner" style={{ cursor: 'pointer' }} onClick={onDashboard}>
          <div className="cal-big">{totals.calories}</div>
          <div className="cal-label">CALORIES TODAY — TAP FOR DETAILS</div>
        </div>
      )}

      <button className="btn btn-green btn-lg" onClick={onScan} style={{ width: '100%', textAlign: 'center' }}>
        📷 SCAN MEAL
      </button>

      {hasEntries && (
        <button className="btn btn-cyan" onClick={onDashboard} style={{ width: '100%', textAlign: 'center' }}>
          📊 VIEW DASHBOARD
        </button>
      )}

      <div className="px-box" style={{ padding: 12 }}>
        <div style={{ fontSize: 7, color: 'var(--gray)', lineHeight: 2.2 }}>
          MEALS TODAY: <span style={{ color: 'var(--green)' }}>{entries.length}</span><br />
          CARBS: <span style={{ color: 'var(--cyan)' }}>{totals.carbs}g</span>  
          PROTEIN: <span style={{ color: 'var(--green)' }}>{totals.protein}g</span>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Root App
// ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [entries, setEntries] = useState<FoodEntry[]>(() => loadLog().entries)
  const [pendingEntry, setPendingEntry] = useState<FoodEntry | null>(null)
  const [error, setError] = useState('')

  const refreshEntries = useCallback(() => setEntries(loadLog().entries), [])

  async function handleCapture(b64: string, mime: string) {
    const apiKey = loadApiKey()
    if (!apiKey) {
      setError('API key not set — go to Settings first')
      setScreen('home')
      return
    }
    setScreen('analyzing')
    try {
      const result = await analyzeMealImage(b64, mime, apiKey)
      const entry: FoodEntry = {
        id: uid(),
        timestamp: Date.now(),
        description: result.description,
        imageData: b64,
        macros: result.macros,
      }
      setPendingEntry(entry)
      setScreen('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setScreen('home')
    }
  }

  function handleSave() {
    if (!pendingEntry) return
    saveEntry(pendingEntry)
    setPendingEntry(null)
    refreshEntries()
    setScreen('dashboard')
  }

  function handleDiscard() {
    setPendingEntry(null)
    setScreen('home')
  }

  function handleDelete(id: string) {
    deleteEntry(id)
    refreshEntries()
  }

  const navTitle: Record<Screen, string> = {
    home: 'CARB QUEST',
    camera: 'SCAN',
    analyzing: 'ANALYZING',
    result: 'RESULT',
    dashboard: 'DASHBOARD',
    settings: 'SETTINGS',
  }

  return (
    <div className="app crt">
      <nav className="nav">
        <span className="nav-title">{navTitle[screen]}</span>
        <div className="nav-btns">
          {screen !== 'settings' && (
            <button className="btn btn-cyan btn-sm" onClick={() => setScreen('settings')}>⚙</button>
          )}
          {(screen === 'dashboard' || screen === 'camera') && (
            <button className="btn btn-red btn-sm" onClick={() => setScreen('home')}>🏠</button>
          )}
        </div>
      </nav>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--red)', color: '#000', fontSize: 8, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setError('')}>
          ⚠ {error} (tap to dismiss)
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen entries={entries} onScan={() => setScreen('camera')} onDashboard={() => setScreen('dashboard')} />
      )}
      {screen === 'camera' && (
        <CameraScreen onCapture={handleCapture} onBack={() => setScreen('home')} />
      )}
      {screen === 'analyzing' && (
        <div className="analyzing-screen">
          <span className="pixel-spinner">⚙</span>
          <div style={{ fontSize: 10, color: 'var(--green)', textShadow: '0 0 8px var(--green)' }}>SCANNING...</div>
          <div className="blink" style={{ fontSize: 8, color: 'var(--cyan)' }}>AI ANALYZING YOUR MEAL</div>
          <div style={{ fontSize: 7, color: 'var(--gray)', textAlign: 'center', lineHeight: 2 }}>
            CLAUDE IS CALCULATING<br />YOUR MACROS...
          </div>
        </div>
      )}
      {screen === 'result' && pendingEntry && (
        <ResultScreen entry={pendingEntry} onSave={handleSave} onDiscard={handleDiscard} />
      )}
      {screen === 'dashboard' && (
        <Dashboard entries={entries} onDelete={handleDelete} onNewScan={() => setScreen('camera')} />
      )}
      {screen === 'settings' && (
        <Settings onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
