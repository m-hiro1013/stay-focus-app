import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ConfirmModal from './ConfirmModal'

export default function ProjectSettings({ project, teamId, onClose, onUpdate }) {
  const [projectName, setProjectName] = useState(project.project_name)
  const [description, setDescription] = useState(project.description || '')
  const [colorCode, setColorCode] = useState(project.color_code)
  const [canComplete, setCanComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const colors = [
    '#FF69B4', '#FFB6C1', '#87CEEB', '#4682B4',
    '#90EE90', '#32CD32', '#FFD700', '#FFA500',
    '#D3D3D3', '#A9A9A9'
  ]

  // プロジェクトの全タスクが完了しているか確認
  useEffect(() => {
    const checkTasksCompletion = async () => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, is_completed')
        .eq('project_id', project.id)

      if (tasks && tasks.length > 0) {
        const allCompleted = tasks.every(task => task.is_completed)
        setCanComplete(allCompleted)
      } else {
        setCanComplete(false)
      }
      setLoading(false)
    }

    checkTasksCompletion()
  }, [project.id])

  // 保存
  const handleSave = async () => {
    const { error } = await supabase
      .from('projects')
      .update({
        project_name: projectName,
        description: description,
        color_code: colorCode
      })
      .eq('id', project.id)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('保存したよ！✨')
    setTimeout(() => {
      onUpdate()
      onClose()
    }, 100)
  }

  // プロジェクト完了
  const handleComplete = async () => {
    if (!window.confirm('このプロジェクトを完了にするよん？🎉')) return

    const { error } = await supabase
      .from('projects')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', project.id)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('お疲れ様！プロジェクト完了だよん！🎉')
    setTimeout(() => {
      onUpdate()
      onClose()
    }, 100)
  }

  // アーカイブ
  const handleArchive = async () => {
    if (!window.confirm('このプロジェクトをアーカイブするよん？📦')) return

    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', project.id)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('アーカイブしたよ！📦')
    setTimeout(() => {
      onUpdate()
      onClose()
    }, 100)
  }

  // 削除
  const handleDelete = async () => {
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    setShowDeleteConfirm(false)

    // プロジェクトに紐づくタスクを削除
    await supabase
      .from('tasks')
      .delete()
      .eq('project_id', project.id)

    // プロジェクトを削除
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('削除したよん！🗑️')
    setTimeout(() => {
      onUpdate()
      onClose()
    }, 100)
  }

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>プロジェクト設定 ⚙️</h2>

          {/* プロジェクト名 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              プロジェクト名
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="input-text"
            />
          </div>

          {/* 概要 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              概要
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="プロジェクトの説明..."
              className="input-textarea"
            />
          </div>

          {/* 色 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              色
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <div
                  key={color}
                  onClick={() => setColorCode(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: colorCode === color ? '3px solid #333' : '3px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* 完了ボタン（全タスク完了時のみ表示） */}
            {!loading && canComplete && (
              <button
                type="button"
                onClick={handleComplete}
                className="btn"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                ✅ プロジェクト完了
              </button>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDelete}
                className="btn"
                style={{
                  flex: 1,
                  minWidth: '120px',
                  color: '#ff4d4d',
                  border: '1px solid #ff4d4d',
                  fontWeight: 'bold'
                }}
              >
                削除
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="btn"
                style={{
                  flex: 1,
                  minWidth: '120px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                📦 アーカイブ
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn"
                style={{
                  flex: 1,
                  minWidth: '120px'
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  minWidth: '120px',
                  fontWeight: 'bold'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 確認モーダル */}
      {showDeleteConfirm && (
        <ConfirmModal
          message="マジで削除する？タスクも全部消えるよん！🗑️"
          onConfirm={executeDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
