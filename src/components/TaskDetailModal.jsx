import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function TaskDetailModal({ task, onClose, onUpdate, teamId }) {
  const [taskName, setTaskName] = useState(task.task_name)
  const [memo, setMemo] = useState(task.memo || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [dueTime, setDueTime] = useState(task.due_time || '')
  const [priorityTimeFrame, setPriorityTimeFrame] = useState(task.priority_time_frame || '今日')
  const [isImportant, setIsImportant] = useState(task.is_important || false)
  const [isPinned, setIsPinned] = useState(task.is_pinned || false)
  const [assignees, setAssignees] = useState([])
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(task.project_id || '')

  const timeFrames = ['今日', '明日', '今週', '来週', '来月以降']

  // メンバー一覧を取得
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('team_id', teamId)

      if (data) {
        setAssignees(data)
      }
    }

    fetchMembers()
  }, [teamId])

  // プロジェクト一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_archived', false)
        .eq('is_completed', false)  // ✅ 完了済みも除外！

      if (data) {
        setProjects(data)
      }
    }

    fetchProjects()
  }, [teamId])

  // 既存の担当者を取得
  useEffect(() => {
    try {
      const parsed = JSON.parse(task.assignees || '[]')
      setSelectedAssignees(parsed)
    } catch (e) {
      setSelectedAssignees([])
    }
  }, [task.assignees])

  // 担当者の切り替え
  const toggleAssignee = (memberId) => {
    if (selectedAssignees.includes(memberId)) {
      setSelectedAssignees(selectedAssignees.filter(id => id !== memberId))
    } else {
      setSelectedAssignees([...selectedAssignees, memberId])
    }
  }

  // 保存
  const handleSave = async () => {
    const { error } = await supabase
      .from('tasks')
      .update({
        task_name: taskName,
        memo: memo,
        due_date: dueDate || null,
        due_time: dueTime || null,
        priority_time_frame: priorityTimeFrame,
        is_important: isImportant,
        is_pinned: isPinned,
        assignees: JSON.stringify(selectedAssignees),
        project_id: selectedProject || null
      })
      .eq('id', task.id)

    if (!error) {
      alert('保存したよ！✨')
      onUpdate()
      onClose()
    } else {
      alert('エラー: ' + error.message)
    }
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
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>タスク詳細 📝</h2>

        {/* タスク名 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            タスク名
          </label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
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

        {/* メモ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows="3"
            placeholder="詳細なメモを入力..."
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

        {/* プロジェクト */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            プロジェクト
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">プロジェクトなし</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>

        {/* 優先度 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            優先度（時間枠）
          </label>
          <select
            value={priorityTimeFrame}
            onChange={(e) => setPriorityTimeFrame(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            {timeFrames.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

{/* 期日 */}
<div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
    期日
  </label>
  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
    <input
      type="date"
      value={dueDate}
      onChange={(e) => setDueDate(e.target.value)}
      style={{
        flex: 1,
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px'
      }}
    />
    <select
      value={dueTime}
      onChange={(e) => setDueTime(e.target.value)}
      onFocus={(e) => {
        // ✅ 初回クリック時のみ、空なら17:00にする
        if (dueTime === '') {
          setDueTime('17:00')
        }
      }}
      style={{
        flex: 1,
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px',
        backgroundColor: 'white'
      }}
    >
      <option value="">時間なし</option>
      {Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2)
        const minute = (i % 2) * 30
        const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        return (
          <option key={timeValue} value={timeValue}>
            {timeValue}
          </option>
        )
      })}
    </select>
  </div>
  {(dueDate || dueTime) && (
    <button
      type="button"
      onClick={() => {
        setDueDate('')
        setDueTime('')
      }}
      style={{
        padding: '8px 16px',
        backgroundColor: '#f0f0f0',
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        width: '100%'
      }}
    >
      🗑️ 期日をクリア
    </button>
  )}
</div>

        {/* 重要マーク・ピン留め */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '20px' }}>{isImportant ? '⭐' : '☆'}</span>
            重要マーク
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            📌 ピン留め
          </label>
        </div>

        {/* 担当者 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            担当者
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {assignees.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>メンバーがいません</p>
            ) : (
              assignees.map(member => (
                <label
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    backgroundColor: selectedAssignees.includes(member.id) ? '#ff69b4' : '#f0f0f0',
                    color: selectedAssignees.includes(member.id) ? 'white' : '#555',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(member.id)}
                    onChange={() => toggleAssignee(member.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: member.color
                  }} />
                  {member.name}
                </label>
              ))
            )}
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            onClick={handleSave}
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
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
