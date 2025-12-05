export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '16px',
                maxWidth: '400px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.2s ease-out'
            }}>
                <div style={{
                    fontSize: '48px',
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    ⚠️
                </div>

                <p style={{
                    fontSize: '18px',
                    textAlign: 'center',
                    marginBottom: '30px',
                    lineHeight: '1.6',
                    color: '#333'
                }}>
                    {message}
                </p>

                <div style={{
                    display: 'flex',
                    gap: '10px'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            backgroundColor: '#f0f0f0',
                            color: '#555',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            backgroundColor: '#ff4d4d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        実行する
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    )
}