import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ProjectList from './components/ProjectList'
import TaskList from './components/TaskList'
import MemberManagement from './components/MemberManagement'
import Report from './components/Report'
import ArchiveList from './components/ArchiveList'
import ProjectSettings from './components/ProjectSettings'

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

  // 🔥 スマホ判定
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // チームIDを取得
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

  // プロジェクト一覧を取得
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
    // ログインしてない場合 → ログイン画面を表示
    return <Auth />
  }

  // ログイン済みの場合 → メイン画面を表示
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      padding: isMobile ? '10px' : '20px' // 🔥 スマホは余白を小さく
    }}>

      <div style={{
        width: isMobile ? '90%' : '90%', // 🔥 スマホは100%幅
        maxWidth: isMobile ? '90%' : '90%' // 🔥 スマホは制限なし
      }}>

        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '15px' : '30px',
          flexWrap: isMobile ? 'nowrap' : 'nowrap' // 🔥 スマホは折り返し
        }}>
          <h1 style={{
            color: '#ff69b4',
            margin: 0,
            fontSize: isMobile ? '24px' : '32px' // 🔥 スマホは小さめ
          }}>
            stay-focus 🔥
          </h1>

          <div style={{
            display: 'flex',
            gap: isMobile ? '5px' : '10px',
            flexWrap: 'wrap',
            marginTop: isMobile ? '10px' : '0'
          }}>
            {/* プロジェクト設定ボタン（プロジェクト選択時のみ表示） */}
            {currentProject && (
              <button
                onClick={() => setShowProjectSettings(true)}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                ⚙️ {isMobile ? '設定' : 'プロジェクト設定'}
              </button>
            )}

            <button
              onClick={() => setShowArchive(true)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              📦 {isMobile ? '' : 'アーカイブ'}
            </button>

            <button
              onClick={() => setShowReport(true)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              📊 {isMobile ? '' : 'レポート'}
            </button>

            <button
              onClick={() => setShowMemberManagement(true)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              👥 {isMobile ? '' : 'メンバー管理'}
            </button>

            <button
              onClick={async () => {
                const confirmed = window.confirm('ログアウトしますか？')
                if (!confirmed) return

                await supabase.auth.signOut()
              }}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {isMobile ? '🚪' : 'ログアウト'}
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '30px' : '30px', // 🔥 スマホは余白小さく
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {/* プロジェクトタブ */}
          <ProjectList
            teamId={teamId}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            projects={projects}
            onUpdate={fetchProjects}
            isMobile={isMobile} // 🔥 スマホ判定を渡す
          />

          {/* プロジェクトの説明 */}
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

          {/* タスク一覧 */}
          <h2 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: isMobile ? '24x' : '24px' // 🔥 スマホは小さめ
          }}>
            {currentProject ? 'プロジェクトのタスク' : 'すべてのタスク'} 📝
          </h2>
          <TaskList
            session={session}
            teamId={teamId}
            currentProject={currentProject}
            projects={projects}
            isMobile={isMobile} // 🔥 スマホ判定を渡す
          />
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
