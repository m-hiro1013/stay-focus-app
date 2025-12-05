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
      padding: '20px'
    }}>

      <div style={{
        width: '80%',
        maxWidth: '1600px'
      }}>

        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: '#ff69b4', margin: 0 }}>stay-focus 🔥</h1>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* プロジェクト設定ボタン（プロジェクト選択時のみ表示） */}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
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
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
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
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
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
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              👥 メンバー管理
            </button>

            <button
              onClick={async () => {
                const confirmed = window.confirm('ログアウトしますか？')
                if (!confirmed) return

                await supabase.auth.signOut()
                // アラートは不要（ログイン画面に遷移するため）
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
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
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
            {currentProject ? 'プロジェクトのタスク' : 'すべてのタスク'} 📝
          </h2>
          <TaskList
            session={session}
            teamId={teamId}
            currentProject={currentProject}
            projects={projects}
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
