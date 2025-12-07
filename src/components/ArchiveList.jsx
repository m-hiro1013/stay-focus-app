import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ArchiveList({ teamId, onClose, onUpdate }) {
  const [archivedProjects, setArchivedProjects] = useState([])
  const [expandedProject, setExpandedProject] = useState(null)
  const [projectTasks, setProjectTasks] = useState({})
  const [loading, setLoading] = useState(true)

  // アーカイブ済みプロジェクトを取得
  useEffect(() => {
    if (!teamId) return

    const fetchArchivedProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_archived', true)
        .order('created_at', { ascending: false })

      if (data) {
        setArchivedProjects(data)
      }
      setLoading(false)
    }

    fetchArchivedProjects()
  }, [teamId])

  // プロジェクトのタスク一覧を取得
  const fetchProjectTasks = async (projectId) => {
    if (projectTasks[projectId]) {
      // すでに取得済みなら展開/折りたたみのみ
      setExpandedProject(expandedProject === projectId ? null : projectId)
      return
    }

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (data) {
      setProjectTasks({ ...projectTasks, [projectId]: data })
      setExpandedProject(projectId)
    }
  }

  // アーカイブを復元
  const unarchiveProject = async (projectId) => {
    if (!window.confirm('このプロジェクトを復元するよん？')) return

    const { error } = await supabase
      .from('projects')
      .update({ is_archived: false })
      .eq('id', projectId)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('復元したよ！ホームで確認してねん！✨')
    setTimeout(() => {
      setArchivedProjects(archivedProjects.filter(p => p.id !== projectId))
      if (onUpdate) onUpdate()
    }, 100)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <h2 style={{ margin: 0 }}>アーカイブ済みプロジェクト 📦</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn"
          >
            閉じる
          </button>
        </div>

        {/* アーカイブ一覧 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            読み込み中...📦
          </div>
        ) : archivedProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            アーカイブされたプロジェクトはないよん！
          </div>
        ) : (
          archivedProjects.map(project => (
            <div key={project.id} style={{ marginBottom: '15px' }}>
              {/* プロジェクトカード */}
              <div
                onClick={() => fetchProjectTasks(project.id)}
                style={{
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: '1px solid #eee',
                  borderLeft: `5px solid ${project.color_code}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px', wordBreak: 'break-word' }}>
                      {project.project_name}
                    </div>
                    {project.description && (
                      <div style={{ fontSize: '13px', color: '#666', wordBreak: 'break-word' }}>
                        {project.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      unarchiveProject(project.id)
                    }}
                    className="btn"
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                  >
                    復元
                  </button>
                </div>
              </div>

              {/* タスク一覧（展開時） */}
              {expandedProject === project.id && (
                <div style={{
                  marginTop: '10px',
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #eee',
                  borderRadius: '8px'
                }}>
                  {projectTasks[project.id]?.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
                      タスクなし
                    </div>
                  ) : (
                    projectTasks[project.id]?.map(task => (
                      <div
                        key={task.id}
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #eee',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{
                          color: task.is_completed ? '#4CAF50' : '#999',
                          flexShrink: 0
                        }}>
                          {task.is_completed ? '✔' : '・'}
                        </span>
                        <span style={{
                          color: task.is_completed ? '#aaa' : '#333',
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                          wordBreak: 'break-word',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {task.task_name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
