/**
 * PWAモード判定ユーティリティ
 */

/**
 * PWAモードかどうかを判定
 * @returns {boolean} PWAモードならtrue
 */
export const isPWAMode = () => {
    // 1. display-modeがstandaloneかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    // 2. iOS Safari（standalone）
    const isIOSStandalone =
        'standalone' in window.navigator &&
        window.navigator.standalone === true

    // 3. Android（TWA含む）
    const isAndroidStandalone = document.referrer.includes('android-app://')

    // 4. manifest経由で起動
    const isFromManifest = window.matchMedia('(display-mode: standalone)').matches

    return isStandalone || isIOSStandalone || isAndroidStandalone || isFromManifest
}

/**
 * デバイスタイプを判定
 * @returns {string} 'ios' | 'android' | 'desktop'
 */
export const getDeviceType = () => {
    const ua = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(ua)) {
        return 'ios'
    } else if (/android/.test(ua)) {
        return 'android'
    } else {
        return 'desktop'
    }
}

/**
 * PWA詳細情報を取得
 * @returns {object} PWA情報
 */
export const getPWAInfo = () => {
    return {
        isPWA: isPWAMode(),
        deviceType: getDeviceType(),
        isOnline: navigator.onLine,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasNotification: 'Notification' in window,
        hasPushManager: 'PushManager' in window,
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
}

/**
 * PWAモード変更を監視
 * @param {Function} callback コールバック関数
 * @returns {Function} cleanup関数
 */
export const watchPWAMode = (callback) => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    const handler = (e) => {
        callback(e.matches)
    }

    // 新しいAPI
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }
    // 古いAPI（互換性）
    else {
        mediaQuery.addListener(handler)
        return () => mediaQuery.removeListener(handler)
    }
}

/**
 * デバッグ情報をログ出力
 */
export const logPWAInfo = () => {
    const info = getPWAInfo()

    console.log(`
╔════════════════════════════════════════╗
║       stay-focus PWA情報               ║
╠════════════════════════════════════════╣
║ モード: ${info.isPWA ? '🔥 PWA' : '🌐 Web'}              ║
║ デバイス: ${info.deviceType.toUpperCase().padEnd(28)}║
║ オンライン: ${info.isOnline ? '✅' : '❌'}                  ║
║ ServiceWorker: ${info.hasServiceWorker ? '✅' : '❌'}        ║
║ 通知: ${info.hasNotification ? '✅' : '❌'}                  ║
║ プッシュ: ${info.hasPushManager ? '✅' : '❌'}              ║
║ 画面: ${info.viewport.width}x${info.viewport.height}${' '.repeat(Math.max(0, 16 - String(info.viewport.width).length - String(info.viewport.height).length))}║
╚════════════════════════════════════════╝
  `)
}
