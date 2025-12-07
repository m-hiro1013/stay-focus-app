import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ProjectList from './components/ProjectList'
import TaskList from './components/TaskList'
import MemberManagement from './components/MemberManagement'
import Report from './components/Report'
import ArchiveList from './components/ArchiveList'
import ProjectSettings from './components/ProjectSettings'

// 🔥 PWA判定ユーティリティをインポート
import { isPWAMode, watchPWAMode, logPWAInfo, getPWAInfo } from './utils/pwaDetector'

// 🔥 PWA専用CSSをインポート
import './pwa.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState(null)
  const [currentProject, setCurrentProject] = useState(null)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  const [projects, setProjects] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  // 🔥 PWA判定のstate
  const [isPWA, setIsPWA] = useState(false)
  const [pwaInfo, setPWAInfo] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // 🔥 PWAモード判定
  useEffect(() => {
    // 初回判定
    const checkPWA = () => {
      const pwaMode = isPWAMode()
      const info = getPWAInfo()

      setIsPWA(pwaMode)
      setPWAInfo(info)

      // bodyにクラス追加
      if (pwaMode) {
        document.body.classList.add('pwa-mode')
        console.log('🔥 PWAモードで動作中')
        logPWAInfo()
      } else {
        document.body.classList.remove('pwa-mode')
        console.log('🌐 Webモードで動作中')
      }
    }

    checkPWA()

    // display-mode変更を監視
    const cleanup = watchPWAMode((isPWAMode) => {
      setIsPWA(isPWAMode)
      if (isPWAMode) {
        document.body.classList.add('pwa-mode')
        console.log('🔥 PWAモードに切り替わりました')
      } else {
        document.body.classList.remove('pwa-mode')
        console.log('🌐 Webモードに切り替わりました')
      }
    })

    return cleanup
  }, [])

  // 🔥 オンライン/オフライン監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('✅ オンラインに復帰しました')

      if (isPWA) {
        // オンライン復帰時の処理（将来的に同期処理など）
        alert('オンラインに復帰しました！')
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('❌ オフラインになりました')

      if (isPWA) {
        alert('オフラインモードです')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isPWA])

  // 🔥 開発用：グローバルにPWA情報を公開
  useEffect(() => {
    window.__STAY_FOCUS_PWA__ = {
      isPWA,
      pwaInfo,
      isOnline,
      togglePWAMode: () => {
        setIsPWA(!isPWA)
        console.log('🔧 PWAモードを手動切替:', !isPWA)
      },
      showInfo: logPWAInfo
    }
  }, [isPWA, pwaInfo, isOnline])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    const getTeamId = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setTeamId(data.team_id)
      }
    }

    getTeamId()
  }, [session])

  const fetchProjects = async () => {
    if (!teamId) return

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_archived', false)
      .eq('is_completed', false)
      .order('created_at', { ascending: true })

    if (data) {
      setProjects(data)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [teamId])

  const getCurrentProjectInfo = () => {
    if (!currentProject) return null
    return projects.find(p => p.id === currentProject)
  }

  const currentProjectInfo = getCurrentProjectInfo()

  const handleRefresh = async () => {
    console.log('🔄 リフレッシュ開始...')
    await fetchProjects()
    setRefreshKey(prev => prev + 1)
    console.log('✅ リフレッシュ完了！')
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '20px',
        color: '#ff69b4'
      }}>
        読み込み中...⏳
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-container" style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* 🔥 PWAインジケーター（開発用） */}
      {isPWA && process.env.NODE_ENV === 'development' && (
        <div className="pwa-indicator">
          🔥 PWA Mode
        </div>
      )}

      {/* 🔥 オフラインインジケーター */}
      {isPWA && !isOnline && (
        <div className="offline-indicator">
          📡 オフライン
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h1 style={{
            color: '#ff69b4',
            margin: 0,
            fontSize: '32px'
          }}>
            stay-focus 🔥
          </h1>

          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {currentProject && (
              <button
                onClick={() => setShowProjectSettings(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                ⚙️ プロジェクト設定
              </button>
            )}

            <button
              onClick={() => setShowArchive(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              📦 アーカイブ
            </button>

            <button
              onClick={() => setShowReport(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              📊 レポート
            </button>

            <button
              onClick={() => setShowMemberManagement(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              👥 メンバー管理
            </button>

            <button
              onClick={async () => {
                const confirmed = window.confirm('ログアウトしますか？')
                if (!confirmed) return
                await supabase.auth.signOut()
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="main-content" style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <ProjectList
            teamId={teamId}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            projects={projects}
            onUpdate={fetchProjects}
          />

          {currentProjectInfo && currentProjectInfo.description && (
            <div style={{
              backgroundColor: `${currentProjectInfo.color_code}15`,
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
              borderLeft: `5px solid ${currentProjectInfo.color_code}`,
              color: '#555',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {currentProjectInfo.description}
            </div>
          )}

          <h2 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '24px'
          }}>
            {currentProject ? 'プロジェクトのタスク' : 'すべてのタスク'} 📝
          </h2>

          <TaskList
            key={refreshKey}
            session={session}
            teamId={teamId}
            currentProject={currentProject}
            projects={projects}
          />

          {/* 更新ボタン */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #eee'
          }}>
            <button
              onClick={async () => {
                const btn = document.getElementById('refresh-btn')
                const originalText = btn.innerHTML
                btn.innerHTML = '🔄 更新中...'
                btn.disabled = true
                btn.style.opacity = '0.6'

                await handleRefresh()

                btn.innerHTML = '✅ 更新完了！'
                setTimeout(() => {
                  btn.innerHTML = originalText
                  btn.disabled = false
                  btn.style.opacity = '1'
                }, 1000)
              }}
              id="refresh-btn"
              style={{
                padding: '14px 32px',
                backgroundColor: '#ff69b4',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 105, 180, 0.3)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = '#ff1493'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 105, 180, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = '#ff69b4'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 8px rgba(255, 105, 180, 0.3)'
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>🔄</span>
              最新の状態に更新
            </button>
          </div>
        </div>
      </div>

      {/* モーダル群 */}
      {showMemberManagement && (
        <MemberManagement
          teamId={teamId}
          onClose={() => setShowMemberManagement(false)}
        />
      )}

      {showReport && (
        <Report
          teamId={teamId}
          onClose={() => setShowReport(false)}
        />
      )}

      {showArchive && (
        <ArchiveList
          teamId={teamId}
          onClose={() => setShowArchive(false)}
          onUpdate={fetchProjects}
        />
      )}

      {showProjectSettings && currentProjectInfo && (
        <ProjectSettings
          project={currentProjectInfo}
          teamId={teamId}
          onClose={() => {
            setShowProjectSettings(false)
            fetchProjects()
            setCurrentProject(null)
          }}
          onUpdate={() => {
            fetchProjects()
          }}
        />
      )}
    </div>
  )
}

export default App
