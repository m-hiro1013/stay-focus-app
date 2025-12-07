import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function MemberManagement({ teamId, onClose }) {
  const [members, setMembers] = useState([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberColor, setNewMemberColor] = useState('#FF69B4')

  const colors = [
    '#FF69B4', '#FFB6C1', '#87CEEB', '#4682B4',
    '#90EE90', '#32CD32', '#FFD700', '#FFA500',
    '#D3D3D3', '#A9A9A9'
  ]

  // メンバー一覧を取得
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })

      if (data) {
        setMembers(data)
      }
    }

    fetchMembers()
  }, [teamId])

  // メンバー追加
  const addMember = async (e) => {
    e.preventDefault()
    if (!newMemberName.trim() || !newMemberEmail.trim()) return

    const { data, error } = await supabase
      .from('members')
      .insert({
        team_id: teamId,
        name: newMemberName,
        email: newMemberEmail,
        color: newMemberColor
      })
      .select()

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    if (data) {
      alert('メンバー追加したよ！👥')
      setTimeout(() => {
        setMembers([...members, data[0]])
        setNewMemberName('')
        setNewMemberEmail('')
        setNewMemberColor('#FF69B4')
      }, 100)
    }
  }

  // メンバー削除
  const deleteMember = async (memberId) => {
    if (!window.confirm('このメンバーを削除する？')) return

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId)

    if (error) {
      alert('エラー: ' + error.message)
      return
    }

    alert('削除したよ！')
    setTimeout(() => {
      setMembers(members.filter(m => m.id !== memberId))
    }, 100)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>メンバー管理 👥</h2>

        {/* メンバー追加フォーム */}
        <form onSubmit={addMember} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              名前
            </label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="例：山田 太郎"
              required
              className="input-text"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="例：yamada@example.com"
              required
              className="input-text"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              色
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <div
                  key={color}
                  onClick={() => setNewMemberColor(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: newMemberColor === color ? '3px solid #333' : '3px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            メンバー追加 ➕
          </button>
        </form>

        {/* メンバー一覧 */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>現在のメンバー</h3>
          {members.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>
              メンバーがいません。上から追加してね！
            </p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: member.color,
                    flexShrink: 0
                  }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#999', wordBreak: 'break-all' }}>{member.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMember(member.id)}
                  className="btn btn-danger"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    flexShrink: 0,
                    marginLeft: '10px'
                  }}
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="btn"
          style={{
            width: '100%',
            marginTop: '20px'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
