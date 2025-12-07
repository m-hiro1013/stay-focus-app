import { useState, useEffect, useRef } from 'react'

export default function PullToRefresh({ onRefresh, children }) {
    const [startY, setStartY] = useState(0)
    const [currentY, setCurrentY] = useState(0)
    const [isPulling, setIsPulling] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const containerRef = useRef(null)

    const threshold = 80 // 引っ張る距離の閾値

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleTouchStart = (e) => {
            // スクロール位置が一番上の時だけ有効
            if (container.scrollTop === 0) {
                setStartY(e.touches[0].clientY)
                setIsPulling(true)
            }
        }

        const handleTouchMove = (e) => {
            if (!isPulling || isRefreshing) return

            const currentY = e.touches[0].clientY
            const distance = currentY - startY

            // 下方向に引っ張っている場合のみ
            if (distance > 0) {
                setCurrentY(distance)

                // 引っ張りすぎないように制限
                if (distance > threshold * 2) {
                    e.preventDefault()
                }
            }
        }

        const handleTouchEnd = async () => {
            if (!isPulling || isRefreshing) return

            const distance = currentY - startY

            if (distance > threshold) {
                // リフレッシュ実行
                setIsRefreshing(true)

                try {
                    await onRefresh()
                } catch (error) {
                    console.error('リフレッシュエラー:', error)
                }

                // 1秒後にリセット
                setTimeout(() => {
                    setIsRefreshing(false)
                    setIsPulling(false)
                    setCurrentY(0)
                }, 1000)
            } else {
                // 閾値に達していない場合は元に戻す
                setIsPulling(false)
                setCurrentY(0)
            }
        }

        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isPulling, isRefreshing, startY, currentY, onRefresh])

    const pullDistance = Math.min(currentY, threshold * 1.5)
    const progress = Math.min(pullDistance / threshold, 1)

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                minHeight: '100vh',
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            {/* リフレッシュインジケーター */}
            {(isPulling || isRefreshing) && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: `${pullDistance}px`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        paddingBottom: '10px',
                        background: 'linear-gradient(to bottom, rgba(255, 105, 180, 0.1), transparent)',
                        transition: isRefreshing ? 'height 0.3s ease' : 'none',
                        zIndex: 999
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        {/* アイコン */}
                        <div
                            style={{
                                fontSize: '24px',
                                transform: `rotate(${progress * 360}deg)`,
                                transition: isRefreshing ? 'transform 0.8s linear infinite' : 'transform 0.2s',
                                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none'
                            }}
                        >
                            {isRefreshing ? '🔄' : '⬇️'}
                        </div>

                        {/* テキスト */}
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#ff69b4',
                                fontWeight: 'bold'
                            }}
                        >
                            {isRefreshing
                                ? '更新中...'
                                : progress >= 1
                                    ? '離して更新'
                                    : '引っ張って更新'}
                        </div>
                    </div>
                </div>
            )}

            {/* コンテンツ */}
            <div
                style={{
                    transform: `translateY(${isPulling && !isRefreshing ? pullDistance : 0}px)`,
                    transition: isPulling && !isRefreshing ? 'none' : 'transform 0.3s ease'
                }}
            >
                {children}
            </div>

            {/* スピンアニメーション */}
            <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    )
}