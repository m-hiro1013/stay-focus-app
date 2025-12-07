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

// 🔥 統合CSSをインポート
import './styles/index.css'

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

      // html要素にもクラス追加（重要！）
      const htmlElement = document.documentElement
      const bodyElement = document.body

      if (pwaMode) {
        htmlElement.classList.add('pwa-mode')
        bodyElement.classList.add('pwa-mode')
        console.log('🔥 PWAモードで動作中')
        logPWAInfo()
      } else {
        htmlElement.classList.remove('pwa-mode')
        bodyElement.classList.remove('pwa-mode')
        console.log('🌐 Webモードで動作中')
      }
    }

    checkPWA()

    // display-mode変更を監視
    const cleanup = watchPWAMode((isPWAMode) => {
      setIsPWA(isPWAMode)
      const htmlElement = document.documentElement
      const bodyElement = document.body

      if (isPWAMode) {
        htmlElement.classList.add('pwa-mode')
        bodyElement.classList.add('pwa-mode')
        console.log('🔥 PWAモードに切り替わりました')
      } else {
        htmlElement.classList.remove('pwa-mode')
        bodyElement.classList.remove('pwa-mode')
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

  // 認証状態の監視
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

  // チームID取得
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

  // プロジェクト一覧取得
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

  // 現在のプロジェクト情報を取得
  const getCurrentProjectInfo = () => {
    if (!currentProject) return null
    return projects.find(p => p.id === currentProject)
  }

  const currentProjectInfo = getCurrentProjectInfo()

  // リフレッシュ処理
  const handleRefresh = async () => {
    console.log('🔄 リフレッシュ開始...')
    await fetchProjects()
    setRefreshKey(prev => prev + 1)
    console.log('✅ リフレッシュ完了！')
  }

  // ローディング画面
  if (loading) {
    return (
      <div className="loading-screen">
        読み込み中...⏳
      </div>
    )
  }

  // 未ログイン時
  if (!session) {
    return <Auth />
  }

  // メイン画面
  return (
    <div className="app-container">
      {/* 🔥 オフラインインジケーター */}
      {isPWA && !isOnline && (
        <div className="offline-indicator">
          📡 オフライン
        </div>
      )}

      <div className="app-wrapper">
        {/* ========== ヘッダー ========== */}
        <header className="app-header">
          <h1 className="app-title">
            stay-focus 🔥
            {/* 🔥 PWAモード時のみ表示 */}
            {isPWA && (
              <span className="pwa-indicator-subtitle">for PWA</span>
            )}
          </h1>

          <div className="header-buttons">
            {currentProject && (
              <button
                onClick={() => setShowProjectSettings(true)}
                className="btn"
              >
                ⚙️ プロジェクト設定
              </button>
            )}

            <button
              onClick={() => setShowArchive(true)}
              className="btn"
            >
              📦 アーカイブ
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="btn"
            >
              📊 レポート
            </button>

            <button
              onClick={() => setShowMemberManagement(true)}
              className="btn"
            >
              👥 メンバー管理
            </button>

            <button
              onClick={async () => {
                const confirmed = window.confirm('ログアウトしますか？')
                if (!confirmed) return
                await supabase.auth.signOut()
              }}
              className="btn"
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* ========== メインコンテンツ ========== */}
        <main className="main-content">
          {/* プロジェクト一覧・タブ */}
          <ProjectList
            teamId={teamId}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            projects={projects}
            onUpdate={fetchProjects}
          />

          {/* プロジェクト説明 */}
          {currentProjectInfo && currentProjectInfo.description && (
            <div
              className="project-description"
              style={{
                backgroundColor: `${currentProjectInfo.color_code}15`,
                borderLeft: `5px solid ${currentProjectInfo.color_code}`
              }}
            >
              {currentProjectInfo.description}
            </div>
          )}

          {/* サブタイトル */}
          <h2 className="app-subtitle">
            {currentProject ? 'プロジェクトのタスク' : 'すべてのタスク'} 📝
          </h2>

          {/* タスク一覧 */}
          <TaskList
            key={refreshKey}
            session={session}
            teamId={teamId}
            currentProject={currentProject}
            projects={projects}
          />

          {/* 更新ボタン */}
          <div className="refresh-section">
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
              className="btn btn-primary refresh-btn"
            >
              <span className="refresh-icon">🔄</span>
              最新の状態に更新
            </button>
          </div>
        </main>
      </div>

      {/* ========== モーダル群 ========== */}
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
