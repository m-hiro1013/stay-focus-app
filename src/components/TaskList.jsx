import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import TaskDetailModal from './TaskDetailModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ========================================
// SortableTaskItem コンポーネント
// ========================================
function SortableTaskItem({
  task,
  assignees,
  onToggle,
  onDelete,
  onClick,
  projectColor,
  onToggleImportant,
  onTogglePin,
  checkTaskStatus
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  // ステータスチェック
  const { isOverdue, isTimeFrameMismatch } = checkTaskStatus(task)
  const hasWarning = isOverdue || isTimeFrameMismatch

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={(e) => !isDragging && (e.currentTarget.style.backgroundColor = hasWarning ? '#ffe6e6' : '#f9f9f9')}
      onMouseLeave={(e) => !isDragging && (e.currentTarget.style.backgroundColor = hasWarning ? '#fff5f5' : 'transparent')}
    >
      <div
        className={`task-card ${hasWarning ? 'task-warning' : ''}`}
        style={{
          borderLeft: projectColor ? `5px solid ${projectColor}` : 'none',
        }}
      >
        {/* ドラッグハンドル */}
        <span
          {...attributes}
          {...listeners}
          className="icon-drag"
        >
          ☰
        </span>

        {/* ピン留めアイコン */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(task.id, task.is_pinned)
          }}
          className={`icon-pin ${task.is_pinned ? 'active' : 'inactive'}`}
          title={task.is_pinned ? 'ピン留め解除' : 'ピン留め'}
        >
          📌
        </span>

        {/* 重要マーク */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onToggleImportant(task.id, task.is_important)
          }}
          className={`icon-star ${task.is_important ? 'active' : 'inactive'}`}
          title={task.is_important ? '重要マーク解除' : '重要マーク'}
        >
          {task.is_important ? '⭐' : '☆'}
        </span>

        {/* チェックボックス */}
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={(e) => onToggle(task.id, task.is_completed, e)}
          onClick={(e) => e.stopPropagation()}
          className="task-checkbox"
        />

        {/* タスク情報 */}
        <div className="task-card-content">
          <div className="task-name">
            {hasWarning && (
              <span
                className="task-warning-icon"
                title={
                  isOverdue
                    ? '⚠️ 期日が過ぎています！'
                    : '⚠️ 期日が近いのに遠い時間枠に入っています！'
                }
              >
                🚨
              </span>
            )}
            {task.task_name}
          </div>

          {/* 担当者表示 */}
          {assignees.length > 0 && (
            <div className="task-assignees">
              {assignees.map((assignee, index) => (
                <span key={index} className="task-assignee">
                  <div
                    className="assignee-color"
                    style={{ backgroundColor: assignee.color }}
                  />
                  {assignee.name}
                </span>
              ))}
            </div>
          )}

          {/* メモ */}
          {task.memo && (
            <div className="task-memo">
              {task.memo}
            </div>
          )}

          {/* 期日 */}
          {task.due_date && (
            <div className={`task-meta ${hasWarning ? 'task-meta-warning' : ''}`}>
              📅 {task.due_date} {task.due_time || ''}
            </div>
          )}
        </div>

        {/* 削除ボタン */}
        <button
          type="button"
          onClick={(e) => onDelete(task.id, e)}
          className="icon-delete"
          title="削除"
        >
          <span className="delete-text">削除</span>
          <span className="delete-icon">🗑️</span>
        </button>
      </div>
    </div>
  )
}
// ========================================
// DroppableTimeFrame コンポーネント
// ========================================
function DroppableTimeFrame({
  timeFrame,
  tasks,
  assignees,
  onToggle,
  onDelete,
  onClick,
  getProjectColor,
  onToggleImportant,
  onTogglePin,
  checkTaskStatus
}) {
  const {
    setNodeRef,
  } = useSortable({ id: `group-${timeFrame}` })

  return (
    <div ref={setNodeRef}>
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.length === 0 ? (
          <div className="task-dropzone-empty">
            ここにドロップ 👇
          </div>
        ) : (
          tasks.map(task => (
            <SortableTaskItem
              key={task.id}
              task={task}
              assignees={assignees(task.assignees)}
              onToggle={onToggle}
              onDelete={onDelete}
              onClick={() => onClick(task)}
              projectColor={getProjectColor(task.project_id)}
              onToggleImportant={onToggleImportant}
              onTogglePin={onTogglePin}
              checkTaskStatus={checkTaskStatus}
            />
          ))
        )}
      </SortableContext>
    </div>
  )
}

// ========================================
// TaskList メインコンポーネント
// ========================================
export default function TaskList({ session, teamId, currentProject, projects }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTaskName, setNewTaskName] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [members, setMembers] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTaskData, setNewTaskData] = useState({
    task_name: '',
    memo: '',
    due_date: '',
    due_time: '',
    priority_time_frame: '今日',
    is_important: false,
    is_pinned: false,
    assignees: []
  })

  const timeFrames = ['今日', '明日', '今週', '来週', '来月以降']
  const UNDO_STACK_MAX_SIZE = 10

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ========================================
  // 期日切れ & 時間枠不一致チェック
  // ========================================
  const checkTaskStatus = (task) => {
    if (!task.due_date || task.is_completed) {
      return { isOverdue: false, isTimeFrameMismatch: false }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const dueDateParts = task.due_date.split('-')
    const dueDate = new Date(
      parseInt(dueDateParts[0]),
      parseInt(dueDateParts[1]) - 1,
      parseInt(dueDateParts[2])
    )

    const isOverdue = dueDate < today

    let isTimeFrameMismatch = false

    if (task.priority_time_frame && task.due_date) {
      const daysDiff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24))

      const timeFrameMinDays = {
        '今日': 0,
        '明日': 1,
        '今週': 3,
        '来週': 5,
        '来月以降': 10
      }

      const minDays = timeFrameMinDays[task.priority_time_frame]

      if (minDays !== undefined && daysDiff >= 0 && daysDiff < minDays) {
        isTimeFrameMismatch = true
      }
    }

    return { isOverdue, isTimeFrameMismatch }
  }

  // ========================================
  // Undo機能（Command + Z / Ctrl + Z）
  // ========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undoStack])

  const handleUndo = async () => {
    if (undoStack.length === 0) {
      alert('戻す操作がないよ！')
      return
    }

    const lastAction = undoStack[undoStack.length - 1]

    if (lastAction.action === 'complete') {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: lastAction.task.is_completed,
          completed_at: lastAction.task.completed_at
        })
        .eq('id', lastAction.task.id)

      if (!error) {
        setUndoStack(undoStack.slice(0, -1))
        fetchTasks()
        alert('完了を取り消したよ！↩️')
      }
    }
  }

  // ========================================
  // メンバー一覧を取得
  // ========================================
  useEffect(() => {
    if (!teamId) return

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('team_id', teamId)

      if (data) {
        setMembers(data)
      }
    }

    fetchMembers()
  }, [teamId])

  // ========================================
  // プロジェクトIDからカラーを取得
  // ========================================
  const getProjectColor = (projectId) => {
    if (!projectId) return null
    const project = projects.find(p => p.id === projectId)
    return project ? project.color_code : null
  }

  // ========================================
  // タスク一覧を取得
  // ========================================
  const fetchTasks = async () => {
    if (!teamId) return

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_completed', false)

    if (currentProject) {
      query = query.eq('project_id', currentProject)
    }

    const { data, error } = await query

    if (data) {
      const sorted = data.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
        if (a.is_important !== b.is_important) return a.is_important ? -1 : 1
        return (a.sort_order || 0) - (b.sort_order || 0)
      })
      setTasks(sorted)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [teamId, currentProject])

  // ========================================
  // タスク作成フォーム送信
  // ========================================
  const handleTaskInputSubmit = (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    setNewTaskData({
      task_name: newTaskName,
      memo: '',
      due_date: '',
      due_time: '',
      priority_time_frame: '今日',
      is_important: false,
      is_pinned: false,
      assignees: []
    })
    setShowCreateModal(true)
  }

  // ========================================
  // タスク作成
  // ========================================
  const createTask = async () => {
    if (!newTaskData.task_name.trim()) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        team_id: teamId,
        task_name: newTaskData.task_name,
        memo: newTaskData.memo,
        project_id: currentProject || null,
        is_completed: false,
        priority_time_frame: newTaskData.priority_time_frame,
        is_important: newTaskData.is_important,
        is_pinned: newTaskData.is_pinned,
        due_date: newTaskData.due_date || null,
        due_time: newTaskData.due_time || null,
        assignees: JSON.stringify(newTaskData.assignees),
        sort_order: tasks.length
      })
      .select()

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    if (data) {
      alert('タスク作成したよ！✨')
      setTimeout(() => {
        setTasks([...tasks, data[0]])
        setNewTaskName('')
        setNewTaskData({
          task_name: '',
          memo: '',
          due_date: '',
          due_time: '',
          priority_time_frame: '今日',
          is_important: false,
          is_pinned: false,
          assignees: []
        })
        setShowCreateModal(false)
        fetchTasks()
      }, 100)
    }
  }

  // ========================================
  // タスク完了切り替え
  // ========================================
  const toggleTask = async (taskId, isCompleted, e) => {
    e.stopPropagation()

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newUndoStack = [...undoStack, {
      action: 'complete',
      task: { ...task }
    }]

    if (newUndoStack.length > UNDO_STACK_MAX_SIZE) {
      newUndoStack.shift()
    }

    setUndoStack(newUndoStack)

    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: !isCompleted,
        completed_at: !isCompleted ? new Date().toISOString() : null
      })
      .eq('id', taskId)

    if (!error) {
      fetchTasks()
    }
  }

  // ========================================
  // 重要マークの切り替え
  // ========================================
  const toggleImportant = async (taskId, isImportant) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, is_important: !isImportant }
        : task
    ).sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      if (a.is_important !== b.is_important) return a.is_important ? -1 : 1
      return (a.sort_order || 0) - (b.sort_order || 0)
    }))

    const { error } = await supabase
      .from('tasks')
      .update({ is_important: !isImportant })
      .eq('id', taskId)

    if (error) {
      console.error('重要マーク更新エラー:', error)
      fetchTasks()
    }
  }

  // ========================================
  // ピン留めの切り替え
  // ========================================
  const togglePin = async (taskId, isPinned) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, is_pinned: !isPinned }
        : task
    ).sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      if (a.is_important !== b.is_important) return a.is_important ? -1 : 1
      return (a.sort_order || 0) - (b.sort_order || 0)
    }))

    const { error } = await supabase
      .from('tasks')
      .update({ is_pinned: !isPinned })
      .eq('id', taskId)

    if (error) {
      console.error('ピン留め更新エラー:', error)
      fetchTasks()
    }
  }

  // ========================================
  // タスク削除
  // ========================================
  const deleteTask = async (taskId, e) => {
    e.stopPropagation()

    if (!window.confirm('本当に削除する？')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('削除したよ！🗑️')
    setTimeout(() => {
      setTasks(tasks.filter(task => task.id !== taskId))
    }, 100)
  }

  // ========================================
  // 担当者名を取得
  // ========================================
  const getAssigneeNames = (assigneesJson) => {
    try {
      const assigneeIds = JSON.parse(assigneesJson || '[]')
      if (assigneeIds.length === 0) return []

      return assigneeIds.map(id => {
        const member = members.find(m => m.id === id)
        return member ? { name: member.name, color: member.color } : null
      }).filter(Boolean)
    } catch (e) {
      return []
    }
  }
  // ========================================
  // 時間枠ごとにグループ化
  // ========================================
  const groupedTasks = timeFrames.reduce((acc, timeFrame) => {
    acc[timeFrame] = tasks.filter(task => task.priority_time_frame === timeFrame)
    return acc
  }, {})

  // すべてのタスクIDとグループIDを含む配列
  const allItems = [
    ...timeFrames.map(tf => `group-${tf}`),
    ...tasks.map(t => t.id)
  ]

  // ========================================
  // ドラッグ開始
  // ========================================
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // ========================================
  // ドラッグ終了時の処理
  // ========================================
  const handleDragEnd = async (event) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    let targetTimeFrame = null

    if (over.id.toString().startsWith('group-')) {
      targetTimeFrame = over.id.toString().replace('group-', '')
    } else {
      const overTask = tasks.find(t => t.id === over.id)
      if (overTask) {
        targetTimeFrame = overTask.priority_time_frame
      }
    }

    if (!targetTimeFrame) return

    const sourceTimeFrame = activeTask.priority_time_frame

    if (sourceTimeFrame === targetTimeFrame && !over.id.toString().startsWith('group-')) {
      const tasksInGroup = groupedTasks[targetTimeFrame]
      const oldIndex = tasksInGroup.findIndex(t => t.id === active.id)
      const newIndex = tasksInGroup.findIndex(t => t.id === over.id)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const newOrder = arrayMove(tasksInGroup, oldIndex, newIndex)

      const otherTasks = tasks.filter(t => t.priority_time_frame !== targetTimeFrame)
      const updatedTasks = [
        ...otherTasks,
        ...newOrder.map((task, index) => ({
          ...task,
          sort_order: index
        }))
      ]

      setTasks(updatedTasks)

      Promise.all(
        newOrder.map((task, index) =>
          supabase
            .from('tasks')
            .update({ sort_order: index })
            .eq('id', task.id)
        )
      )
    } else {
      const targetTasks = groupedTasks[targetTimeFrame]
      const newSortOrder = targetTasks.length

      const updatedTasks = tasks.map(task => {
        if (task.id === active.id) {
          return {
            ...task,
            priority_time_frame: targetTimeFrame,
            sort_order: newSortOrder
          }
        }
        return task
      })

      setTasks(updatedTasks)

      await supabase
        .from('tasks')
        .update({
          priority_time_frame: targetTimeFrame,
          sort_order: newSortOrder
        })
        .eq('id', active.id)
    }
  }

  // ========================================
  // ローディング表示
  // ========================================
  if (loading) {
    return (
      <div className="task-loading">
        読み込み中...⏳
      </div>
    )
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // ========================================
  // JSX return
  // ========================================
  return (
    <div>
      {/* タスク作成フォーム */}
      <form onSubmit={handleTaskInputSubmit} className="task-create-form">
        <input
          type="text"
          placeholder="新しいタスクを入力してね！"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="input-text task-input"
        />
        <button type="submit" className="btn btn-primary">
          追加 ➕
        </button>
      </form>

      {/* Undo通知 */}
      {undoStack.length > 0 && (
        <div className="undo-notification">
          <span>💡 間違えた？ <strong>Command + Z</strong>（Ctrl + Z）で戻せるよ！</span>
          <span className="undo-count">{undoStack.length}</span>
        </div>
      )}

      {/* タスク一覧（グループ表示） */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allItems}>
          {tasks.length === 0 ? (
            <p className="task-empty-message">
              タスクがないよ！上から追加してね〜！✨
            </p>
          ) : (
            timeFrames.map(timeFrame => (
              <div key={timeFrame} className="timeframe-section">
                {/* 時間枠ヘッダー */}
                <div className="timeframe-header">
                  <span className="timeframe-label">{timeFrame}</span>
                  <span className="timeframe-count">
                    {groupedTasks[timeFrame].length}
                  </span>
                </div>

                {/* タスクカードコンテナ */}
                <div className="timeframe-tasks">
                  <DroppableTimeFrame
                    timeFrame={timeFrame}
                    tasks={groupedTasks[timeFrame]}
                    assignees={getAssigneeNames}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onClick={setSelectedTask}
                    getProjectColor={getProjectColor}
                    onToggleImportant={toggleImportant}
                    onTogglePin={togglePin}
                    checkTaskStatus={checkTaskStatus}
                  />
                </div>
              </div>
            ))
          )}
        </SortableContext>

        {/* ドラッグオーバーレイ */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="drag-overlay">
              <div className="drag-overlay-content">
                {activeTask.task_name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* タスク詳細モーダル */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          teamId={teamId}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}

      {/* タスク作成モーダル */}
      {showCreateModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content task-create-modal">
            <h2 className="modal-title">新しいタスク 📝</h2>

            {/* タスク名 */}
            <div className="form-group">
              <label className="form-label">タスク名</label>
              <input
                type="text"
                value={newTaskData.task_name}
                onChange={(e) => setNewTaskData({ ...newTaskData, task_name: e.target.value })}
                className="input-text"
              />
            </div>

            {/* メモ */}
            <div className="form-group">
              <label className="form-label">メモ</label>
              <textarea
                value={newTaskData.memo}
                onChange={(e) => setNewTaskData({ ...newTaskData, memo: e.target.value })}
                rows="3"
                placeholder="詳細なメモを入力..."
                className="input-textarea"
              />
            </div>

            {/* 優先度 */}
            <div className="form-group">
              <label className="form-label">優先度（時間枠）</label>
              <select
                value={newTaskData.priority_time_frame}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority_time_frame: e.target.value })}
                className="input-select"
              >
                {timeFrames.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* 期日 */}
            <div className="form-group">
              <label className="form-label">期日</label>
              <div className="form-row">
                <input
                  type="date"
                  value={newTaskData.due_date}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                  className="input-text"
                />
                <select
                  value={newTaskData.due_time}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_time: e.target.value })}
                  onFocus={(e) => {
                    if (newTaskData.due_time === '') {
                      setNewTaskData({ ...newTaskData, due_time: '17:00' })
                    }
                  }}
                  className="input-select"
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
              {(newTaskData.due_date || newTaskData.due_time) && (
                <button
                  type="button"
                  onClick={() => setNewTaskData({ ...newTaskData, due_date: '', due_time: '' })}
                  className="btn btn-clear-date"
                >
                  🗑️ 期日をクリア
                </button>
              )}
            </div>

            {/* 重要マーク・ピン留め */}
            <div className="form-group form-checkbox-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={newTaskData.is_important}
                  onChange={(e) => setNewTaskData({ ...newTaskData, is_important: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="form-checkbox-icon">
                  {newTaskData.is_important ? '⭐' : '☆'}
                </span>
                重要マーク
              </label>

              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={newTaskData.is_pinned}
                  onChange={(e) => setNewTaskData({ ...newTaskData, is_pinned: e.target.checked })}
                  className="form-checkbox"
                />
                📌 ピン留め
              </label>
            </div>

            {/* 担当者 */}
            <div className="form-group">
              <label className="form-label">担当者</label>
              <div className="assignee-selection">
                {members.length === 0 ? (
                  <p className="no-members-message">メンバーがいません</p>
                ) : (
                  members.map(member => (
                    <label
                      key={member.id}
                      className={`assignee-option ${newTaskData.assignees.includes(member.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={newTaskData.assignees.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTaskData({
                              ...newTaskData,
                              assignees: [...newTaskData.assignees, member.id]
                            })
                          } else {
                            setNewTaskData({
                              ...newTaskData,
                              assignees: newTaskData.assignees.filter(id => id !== member.id)
                            })
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div
                        className="assignee-color"
                        style={{ backgroundColor: member.color }}
                      />
                      {member.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* ボタン */}
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewTaskName('')
                }}
                className="btn"
              >
                キャンセル
              </button>
              <button
                onClick={createTask}
                className="btn btn-primary"
              >
                作成
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}