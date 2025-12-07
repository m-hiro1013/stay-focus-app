import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Report({ teamId, onClose }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [resultMemo, setResultMemo] = useState('')
  const [editingTaskName, setEditingTaskName] = useState('')
  const [editingMemo, setEditingMemo] = useState('')

  // 今月の1日〜今日をデフォルトに設定
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  // レポートデータを取得
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('開始日と終了日を選択してね！')
      return
    }

    setLoading(true)

    // 完了タスクを取得
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_completed', true)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate + 'T23:59:59')

    // 完了プロジェクトを取得
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_completed', true)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate + 'T23:59:59')

    // タスクとプロジェクトを結合して日付順にソート
    const combined = [
      ...(tasks || []).map(t => ({ ...t, type: 'task' })),
      ...(projects || []).map(p => ({ ...p, type: 'project' }))
    ].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

    setReportData(combined)
    setLoading(false)
  }

  // 初回読み込み
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport()
    }
  }, [startDate, endDate, teamId])

  // 日付ごとにグループ化
  const groupedData = reportData.reduce((acc, item) => {
    const date = item.completed_at.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  // タスク詳細を編集
  const handleEditTask = (task) => {
    setSelectedTask(task)
    setEditingTaskName(task.task_name)
    setEditingMemo(task.memo || '')
    setResultMemo(task.result_memo || '')
  }

  // 保存
  const handleSaveTask = async () => {
    const { error } = await supabase
      .from('tasks')
      .update({
        task_name: editingTaskName,
        memo: editingMemo,
        result_memo: resultMemo
      })
      .eq('id', selectedTask.id)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('保存したよ！✨')
    setTimeout(() => {
      setSelectedTask(null)
      fetchReport()
    }, 100)
  }

  // タスク削除
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('このタスクを削除するよん？\n振り返りコメントも一緒に消えちゃうよ！')) return

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
      fetchReport()
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
          <h2 style={{ margin: 0 }}>振り返りレポート 📊</h2>
          <button
            onClick={onClose}
            className="btn"
          >
            閉じる
          </button>
        </div>

        {/* 期間選択 */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-text"
            style={{ flex: '1 1 auto', minWidth: '140px' }}
          />
          <span>〜</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-text"
            style={{ flex: '1 1 auto', minWidth: '140px' }}
          />
          <button
            onClick={fetchReport}
            className="btn btn-primary"
          >
            表示
          </button>
        </div>

        {/* レポート一覧 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            読み込み中...⏳
          </div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            この期間に完了したタスク・プロジェクトはないよ！
          </div>
        ) : (
          Object.keys(groupedData).sort().reverse().map(date => (
            <div key={date} style={{ marginBottom: '30px' }}>
              {/* 日付ヘッダー */}
              <div style={{
                padding: '10px 15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#555'
              }}>
                {date}
              </div>

              {/* アイテム一覧 */}
              {groupedData[date].map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '15px',
                    backgroundColor: item.type === 'project' ? '#f0f8ff' : '#fff',
                    border: item.type === 'project' ? '1px solid #add8e6' : '1px solid #eee',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* タスク情報エリア */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      cursor: item.type === 'task' ? 'pointer' : 'default'
                    }}
                    onClick={() => item.type === 'task' && handleEditTask(item)}
                  >
                    {item.type === 'project' ? (
                      // プロジェクト完了
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '5px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            PROJECT DONE
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '16px', wordBreak: 'break-word' }}>
                            {item.project_name}
                          </span>
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '13px', color: '#666', wordBreak: 'break-word' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      // タスク完了
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', wordBreak: 'break-word' }}>
                          {item.task_name}
                        </div>
                        {item.memo && (
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px', wordBreak: 'break-word' }}>
                            {item.memo}
                          </div>
                        )}
                        {item.result_memo ? (
                          <div style={{
                            marginTop: '8px',
                            padding: '10px',
                            backgroundColor: '#f9f9f9',
                            borderLeft: '4px solid #ff69b4',
                            borderRadius: '4px',
                            fontSize: '14px',
                            wordBreak: 'break-word'
                          }}>
                            📝 {item.result_memo}
                          </div>
                        ) : (
                          <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#ccc'
                          }}>
                            (結果を入力...)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 削除ボタン（タスクのみ） */}
                  {item.type === 'task' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(item.id)
                      }}
                      className="btn btn-danger"
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* タスク編集モーダル */}
        {selectedTask && (
          <div className="modal-overlay" style={{ zIndex: 1001 }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <h3 style={{ marginTop: 0 }}>振り返り & 編集 📝</h3>

              {/* タスク名 */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  タスク名
                </label>
                <input
                  type="text"
                  value={editingTaskName}
                  onChange={(e) => setEditingTaskName(e.target.value)}
                  className="input-text"
                />
              </div>

              {/* メモ */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  メモ
                </label>
                <textarea
                  value={editingMemo}
                  onChange={(e) => setEditingMemo(e.target.value)}
                  rows="2"
                  className="input-textarea"
                />
              </div>

              {/* 結果・気づき */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  結果・気づき
                </label>
                <textarea
                  value={resultMemo}
                  onChange={(e) => setResultMemo(e.target.value)}
                  rows="4"
                  placeholder="ここに結果や気づきを書いてねん！"
                  className="input-textarea"
                />
              </div>

              {/* ボタン */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="btn"
                >
                  閉じる
                </button>
                <button
                  onClick={handleSaveTask}
                  className="btn btn-primary"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
