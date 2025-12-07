import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ProjectList({ teamId, currentProject, onProjectChange, projects, onUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#FF69B4')

  const colors = [
    '#FF69B4', '#FFB6C1', '#87CEEB', '#4682B4',
    '#90EE90', '#32CD32', '#FFD700', '#FFA500',
    '#D3D3D3', '#A9A9A9'
  ]

  // プロジェクト作成
  const createProject = async (e) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    const { data, error } = await supabase
      .from('projects')
      .insert({
        team_id: teamId,
        project_name: newProjectName,
        description: newProjectDesc,
        color_code: newProjectColor,
        is_completed: false,
        is_archived: false
      })
      .select()

    if (data) {
      setNewProjectName('')
      setNewProjectDesc('')
      setNewProjectColor('#FF69B4')
      setShowModal(false)
      onUpdate()
      alert('プロジェクト作成したよ！🚀')
    } else {
      alert('エラー: ' + error.message)
    }
  }

  return (
    <div>
      {/* プロジェクトタブ */}
      <div className="project-tabs-container">
        <div className="project-tabs">
          {/* ALL タブ */}
          <button
            onClick={() => onProjectChange(null)}
            className={`project-tab ${!currentProject ? 'active' : ''}`}
          >
            ALL
          </button>

          {/* プロジェクトタブ */}
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onProjectChange(project.id)}
              className={`project-tab ${currentProject === project.id ? 'active' : ''}`}
              style={{
                borderBottom: `3px solid ${project.color_code}`
              }}
            >
              {project.project_name}
            </button>
          ))}

          {/* プロジェクト追加ボタン */}
          <button
            onClick={() => setShowModal(true)}
            className="project-tab project-tab-add"
          >
            ＋ プロジェクト
          </button>
        </div>
      </div>

      {/* プロジェクト作成モーダル */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>新しいプロジェクト 🚀</h2>

            <form onSubmit={createProject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  プロジェクト名
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例：Webサイトリニューアル"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  概要（任意）
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="プロジェクトの説明..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  色
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {colors.map(color => (
                    <div
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: newProjectColor === color ? '3px solid #333' : '3px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f0f0f0',
                    color: '#555',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ff69b4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
