import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'  // 🔥 追加
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

// ドラッグ可能なタスクカードコンポーネント
function SortableTaskItem({ task, assignees, onToggle, onDelete, onClick, projectColor, onToggleImportant, onTogglePin, checkTaskStatus, isMobile }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  // ✅ ステータスチェック
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '15px', // 🔥 スマホは間隔小さく
        padding: isMobile ? '12px 8px' : '15px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        borderLeft: projectColor ? `5px solid ${projectColor}` : 'none',
        backgroundColor: hasWarning ? '#fff5f5' : 'white',
        border: hasWarning ? '1px solid #ffcccc' : 'none'
      }}>
        {/* ドラッグハンドル */}
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            fontSize: isMobile ? '16px' : '20px',
            color: '#999',
            touchAction: 'none'
          }}
        >
          ☰
        </span>

        {/* ピン留めアイコン（クリック可能） */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(task.id, task.is_pinned)
          }}
          style={{
            fontSize: isMobile ? '14px' : '18px',
            cursor: 'pointer',
            opacity: task.is_pinned ? 1 : 0.3,
            filter: task.is_pinned ? 'none' : 'grayscale(100%)',
            transition: 'all 0.2s',
            userSelect: 'none'
          }}
          title={task.is_pinned ? 'ピン留め解除' : 'ピン留め'}
        >
          📌
        </span>

        {/* 重要マーク（クリック可能） */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onToggleImportant(task.id, task.is_important)
          }}
          style={{
            fontSize: isMobile ? '16px' : '20px',
            cursor: 'pointer',
            color: task.is_important ? '#FFD700' : '#e0e0e0',
            transition: 'color 0.2s',
            userSelect: 'none'
          }}
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
          style={{
            width: isMobile ? '18px' : '20px',
            height: isMobile ? '18px' : '20px',
            cursor: 'pointer'
          }}
        />

        {/* タスク情報 */}
        <div style={{ flex: 1, minWidth: 0 }}> {/* 🔥 minWidth: 0 でテキストの折り返しを強制 */}
          <div style={{
            fontWeight: 'bold',
            fontSize: isMobile ? '24px' : '24px', // 🔥 スマホはタイトルを大きく
            marginBottom: '4px',
            color: hasWarning ? '#d9534f' : 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            wordBreak: 'break-word' // 🔥 長いタスク名を折り返す
          }}>
            {hasWarning && (
              <span
                style={{
                  fontSize: isMobile ? '16px' : '18px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  flexShrink: 0 // 🔥 アイコンは縮小させない
                }}
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
            <div style={{
              display: 'flex',
              gap: '5px',
              marginBottom: '4px',
              flexWrap: 'wrap'
            }}>
              {assignees.map((assignee, index) => (
                <span key={index} style={{
                  fontSize: isMobile ? '10px' : '11px',
                  padding: '2px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '10px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: assignee.color
                  }} />
                  {assignee.name}
                </span>
              ))}
            </div>
          )}

          {task.memo && (
            <div style={{
              fontSize: isMobile ? '10px' : '16px',
              color: '#666',
              marginBottom: '4px',
              wordBreak: 'break-word' // 🔥 メモも折り返す
            }}>
              {task.memo}
            </div>
          )}
          {task.due_date && (
            <div style={{
              fontSize: isMobile ? '11px' : '12px',
              color: hasWarning ? '#d9534f' : '#999',
              fontWeight: hasWarning ? 'bold' : 'normal'
            }}>
              📅 {task.due_date} {task.due_time || ''}
            </div>
          )}
        </div>

        {/* 🔥 削除ボタン（スマホではシンプルなアイコンに） */}
        <button
          type="button"
          onClick={(e) => onDelete(task.id, e)}
          style={{
            padding: isMobile ? '6px' : '8px 16px',
            backgroundColor: isMobile ? 'transparent' : '#ff4d4d',
            color: isMobile ? '#999' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: isMobile ? '18px' : '14px',
            flexShrink: 0 // 🔥 削除ボタンは縮小させない
          }}
        >
          {isMobile ? '🗑️' : '削除'}
        </button>
      </div>
    </div>
  )
}

// ドロップ可能なグループコンテナ
function DroppableTimeFrame({ timeFrame, tasks, assignees, onToggle, onDelete, onClick, getProjectColor, onToggleImportant, onTogglePin, checkTaskStatus, isMobile }) {
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
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            border: '2px dashed #e0e0e0',
            borderRadius: '8px'
          }}>
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
              isMobile={isMobile} // 🔥 追加
            />
          ))
        )}
      </SortableContext>
    </div>
  )
}

export default function TaskList({ session, teamId, currentProject, projects, isMobile }) {
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ✅ 期日切れ & 時間枠が遅すぎるをチェックする関数（修正版）
  const checkTaskStatus = (task) => {
    if (!task.due_date || task.is_completed) {
      return { isOverdue: false, isTimeFrameMismatch: false }
    }

    // ✅ 日付のみで比較（時刻を無視）
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // ✅ 期日も0時にリセット
    const dueDateParts = task.due_date.split('-')
    const dueDate = new Date(
      parseInt(dueDateParts[0]),
      parseInt(dueDateParts[1]) - 1,
      parseInt(dueDateParts[2])
    )

    // ✅ 期日切れチェック（期日が今日より前）
    const isOverdue = dueDate < today

    // ✅ 時間枠が遅すぎるかチェック
    let isTimeFrameMismatch = false

    if (task.priority_time_frame && task.due_date) {
      const daysDiff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24))

      // ✅ 時間枠の「最小日数」を定義
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

  // Command + Z / Ctrl + Z でUndo
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

  // Undo処理
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

  // メンバー一覧を取得
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

  // プロジェクトIDからカラーを取得する関数
  const getProjectColor = (projectId) => {
    if (!projectId) return null
    const project = projects.find(p => p.id === projectId)
    return project ? project.color_code : null
  }

  // タスク一覧を取得
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

  // タスク作成フォーム送信（モーダルを開く）
  const handleTaskInputSubmit = (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    setNewTaskData({
      task_name: newTaskName,
      memo: '',
      due_date: '',
      due_time: '',  // ✅ 空にする！
      priority_time_frame: '今日',
      is_important: false,
      is_pinned: false,
      assignees: []
    })
    setShowCreateModal(true)
  }


  // タスク作成（モーダルから保存）
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

  // タスク完了切り替え
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

  // 重要マークの切り替え
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

  // ピン留めの切り替え
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

  // タスク削除
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

  // 担当者名を取得
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

  // 時間枠ごとにグループ化
  const groupedTasks = timeFrames.reduce((acc, timeFrame) => {
    acc[timeFrame] = tasks.filter(task => task.priority_time_frame === timeFrame)
    return acc
  }, {})

  // すべてのタスクIDとグループIDを含む配列
  const allItems = [
    ...timeFrames.map(tf => `group-${tf}`),
    ...tasks.map(t => t.id)
  ]

  // ドラッグ開始
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // ドラッグ終了時の処理
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...⏳</div>
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <div>
      {/* タスク作成フォーム */}
      <form onSubmit={handleTaskInputSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="新しいタスクを入力してね！"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff69b4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            追加 ➕
          </button>
        </div>
      </form>

      {/* Undo通知 */}
      {undoStack.length > 0 && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#856404',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>💡 間違えた？ <strong>Command + Z</strong>（Ctrl + Z）で戻せるよ！</span>
          <span style={{
            backgroundColor: '#ffc107',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '11px'
          }}>
            {undoStack.length}
          </span>
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
            <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              タスクがないよ！上から追加してね〜！✨
            </p>
          ) : (
            timeFrames.map(timeFrame => (
              <div key={timeFrame} style={{ marginBottom: '30px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  color: '#555'
                }}>
                  <span style={{ color: '#ff69b4' }}>{timeFrame}</span>
                  <span style={{
                    backgroundColor: '#ffe6f2',
                    color: '#ff69b4',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    {groupedTasks[timeFrame].length}
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #eee',
                  minHeight: '60px'
                }}>
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
                    isMobile={isMobile} // 🔥 追加
                  />
                </div>
              </div>
            ))
          )}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              border: '2px solid #ff69b4',
              opacity: 0.9
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
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
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>新しいタスク 📝</h2>

            {/* タスク名 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                タスク名
              </label>
              <input
                type="text"
                value={newTaskData.task_name}
                onChange={(e) => setNewTaskData({ ...newTaskData, task_name: e.target.value })}
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
                value={newTaskData.memo}
                onChange={(e) => setNewTaskData({ ...newTaskData, memo: e.target.value })}
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

            {/* 優先度 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                優先度（時間枠）
              </label>
              <select
                value={newTaskData.priority_time_frame}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority_time_frame: e.target.value })}
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
                  value={newTaskData.due_date}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <select
                  value={newTaskData.due_time}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_time: e.target.value })}
                  onFocus={(e) => {
                    // ✅ 初回クリック時のみ、空なら17:00にする
                    if (newTaskData.due_time === '') {
                      setNewTaskData({ ...newTaskData, due_time: '17:00' })
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
              {(newTaskData.due_date || newTaskData.due_time) && (
                <button
                  type="button"
                  onClick={() => setNewTaskData({ ...newTaskData, due_date: '', due_time: '' })}
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
                  checked={newTaskData.is_important}
                  onChange={(e) => setNewTaskData({ ...newTaskData, is_important: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '20px' }}>{newTaskData.is_important ? '⭐' : '☆'}</span>
                重要マーク
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newTaskData.is_pinned}
                  onChange={(e) => setNewTaskData({ ...newTaskData, is_pinned: e.target.checked })}
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
                {members.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px' }}>メンバーがいません</p>
                ) : (
                  members.map(member => (
                    <label
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 12px',
                        backgroundColor: newTaskData.assignees.includes(member.id) ? '#ff69b4' : '#f0f0f0',
                        color: newTaskData.assignees.includes(member.id) ? 'white' : '#555',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
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
                onClick={() => {
                  setShowCreateModal(false)
                  setNewTaskName('')
                }}
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
                onClick={createTask}
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
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
