import React, { useState, useEffect } from 'react';
import AudioPlayer from './components/AudioPlayer';
import './App.css';

function App() {
  // 使用狀態來儲存從後端獲取的 MP3 URL
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 使用 useEffect 在組件載入時獲取 MP3 URL
  useEffect(() => {
    // 呼叫後端新建立的 API 來獲取最新的 MP3 URL
    const fetchAudioUrl = async () => {
      try {
        // 💡 注意：這裡必須使用後端的完整 URL (包含協定、域名、port)
        // 呼叫後端 Port 9487 的 API
        const response = await fetch('http://localhost:9487/api/latest_upload_url');

        if (!response.ok) {
          // 如果 HTTP 狀態碼不是 2xx (例如 404 沒有檔案, 500 伺服器錯誤)
          if (response.status === 404) {
              throw new Error('目前沒有可播放的 MP3 檔案，請先上傳。');
          }
          // 其他錯誤
          const errorData = response.headers.get('Content-Type')?.includes('application/json')
            ? await response.json() : { message: response.statusText };
          throw new Error(`獲取音源 URL 失敗: 狀態碼 ${response.status}, 錯誤訊息: ${errorData.message}`);
        }

        const data = await response.json();
        // 假設後端回傳的 JSON 格式是 { url: '...', filename: '...' }
        if (data.url) {
          console.log("成功獲取音源 URL:", data.url);
          setAudioUrl(data.url); // 設定獲取到的 URL
        } else {
          throw new Error('後端回應中找不到音源 URL。');
        }
      } catch (err) {
        console.error('獲取音源 URL 錯誤:', err);
        setError(err.message); // 儲存錯誤訊息
      } finally {
        setLoading(false); // 載入完成 (無論成功或失敗)
      }
    };

    fetchAudioUrl();

  }, []); // 空的依賴陣列表示只在組件初次載入時執行一次

  // 根據狀態渲染不同的內容
  if (loading) {
    return (
      <div className="App">
        <h1>我的音頻播放器</h1>
        <p>載入音源中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <h1>我的音頻播放器</h1>
        <p style={{ color: 'red' }}>載入音源失敗: {error}</p>
        {/* 如果有錯誤，也可以提供一個上傳檔案的提示或連結 */}
        <p>請確認後端伺服器已啟動，並已透過上傳頁面上傳 MP3 檔案。</p>
      </div>
    );
  }

  // 如果成功獲取到 URL，則渲染 AudioPlayer
  return (
    <div className="App">
      <h1>我的音頻播放器</h1>
      {/* 將獲取的 URL 傳遞給 AudioPlayer 組件 */}
      {/* AudioPlayer 會使用這個 src 來播放 */}
      <AudioPlayer src={audioUrl} />
    </div>
  );
}

export default App;
