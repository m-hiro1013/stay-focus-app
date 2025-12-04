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

    if (data) {
      setMembers([...members, data[0]])
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberColor('#FF69B4')
      alert('メンバー追加したよ！👥')
    } else {
      alert('エラー: ' + error.message)
    }
  }

  // メンバー削除
  const deleteMember = async (memberId) => {
    if (!confirm('このメンバーを削除する？')) return

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      setMembers(members.filter(m => m.id !== memberId))
      alert('削除したよ！')
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ff69b4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: member.color
                  }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{member.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMember(member.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ff4d4d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
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
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f0f0f0',
            color: '#555',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
