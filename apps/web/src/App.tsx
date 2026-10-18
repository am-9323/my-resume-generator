import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('読み込み中...')

  useEffect(() => {
    // Vite のプロキシ経由で NestJS の GET /api を呼ぶ
    fetch('/api')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.text()
      })
      .then(setMessage)
      .catch(() => setMessage('API に接続できませんでした'))
  }, [])

  return (
    <main>
      <h1>履歴書・職務経歴書ジェネレーター</h1>
      <p>API からの応答: {message}</p>
    </main>
  )
}

export default App
