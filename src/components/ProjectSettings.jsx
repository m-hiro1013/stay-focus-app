import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ProjectSettings({ project, teamId, onClose, onUpdate }) {
  const [projectName, setProjectName] = useState(project.project_name)
  const [description, setDescription] = useState(project.description || '')
  const [colorCode, setColorCode] = useState(project.color_code)
  const [canComplete, setCanComplete] = useState(false)
  const [loading, setLoading] = useState(true)

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
    if (!window.confirm('マジで削除する？タスクも全部消えるよん！')) return

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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
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
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
              onClick={handleComplete}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ✅ プロジェクト完了
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#ff4d4d',
                border: '1px solid #ff4d4d',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              削除
            </button>
            <button
              onClick={handleArchive}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📦 アーカイブ
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
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
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#ff69b4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
