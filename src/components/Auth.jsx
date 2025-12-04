import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      
      if (isSignUp) {
        // サインアップ
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        })
        
        if (error) throw error
        
        alert('確認メールを送信したよ！メールをチェックしてね！📧✨')
      } else {
        // ログイン
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        
        if (error) throw error
        
        alert('ログイン成功！🎉')
      }
    } catch (error) {
      alert('エラー: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#ff69b4',
          marginBottom: '30px'
        }}>
          {isSignUp ? '新規登録 ✨' : 'ログイン 🔐'}
        </h1>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#555'
            }}>
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#555'
            }}>
              パスワード
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ff69b4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? '処理中...' : (isSignUp ? '新規登録' : 'ログイン')}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#ff69b4',
              border: '1px solid #ff69b4',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : '新規登録はこちら'}
          </button>
        </form>
      </div>
    </div>
  )
}
