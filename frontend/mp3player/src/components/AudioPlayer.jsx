import React, { useRef, useState, useEffect } from 'react';

function AudioPlayer({ src }) {
  const audioRef = useRef(null); // 用於取得 audio DOM 元素的引用

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1

  // 格式化時間函數 (秒 -> MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
  };

  // 設定事件監聽器
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 當音頻載入完成，取得總時長
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // 當播放時間更新時
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // 當播放結束時
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0); // 回到開頭
    };

    // 播放錯誤處理
    const handleError = (e) => {
      console.error("Audio playback error:", e);
      // 你可以在這裡顯示錯誤訊息給使用者
    };

    // 監聽播放/暫停事件，更新 isPlaying 狀態
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);


    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);


    // 清除事件監聽器 (在組件卸載時)
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioRef]); // 依賴 audioRef，確保在 audio 元素可用後設定監聽器

  // 當 src prop 改變時重新載入音源
  useEffect(() => {
      if (audioRef.current && src) {
          audioRef.current.src = src;
          audioRef.current.load(); // 載入新的音源
          setIsPlaying(false); // 新載入時預設不是播放狀態
          setCurrentTime(0); // 時間歸零
          setDuration(0); // 時長歸零直到 metadata 載入
      }
  }, [src]);


  // 播放/暫停切換
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => {
          console.error("Playback failed:", error);
          // 處理自動播放被阻止的情況
          alert("請點擊播放按鈕開始播放音頻。");
        });
      }
      // setIsPlaying(!isPlaying); // 這裡其實可以不手動設定，因為 play/pause 事件會觸發更新
    }
  };

  // 處理進度條變化
  const handleSeek = (e) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    const audio = audioRef.current;
    if (audio && !isNaN(seekTime)) {
      audio.currentTime = seekTime;
      setCurrentTime(seekTime); // 立即更新顯示的時間
    }
  };

  // 處理音量變化
  const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      const audio = audioRef.current;
      if (audio) {
          audio.volume = newVolume;
          setVolume(newVolume);
      }
  };


  return (
    <div className="audio-player">
      {/* audio 標籤本身，隱藏或不顯示內建控制項 */}
      <audio ref={audioRef} /* src={src} */ ></audio> {/* src 放在 useEffect 中設定更靈活 */}

      {/* 自訂控制項 */}
      <button onClick={togglePlayPause}>
        {isPlaying ? '暫停' : '播放'}
      </button>

      {/* 進度條 */}
      <input
        type="range"
        min="0"
        max="100" // 使用百分比更容易處理
        value={duration ? (currentTime / duration) * 100 : 0}
        onChange={handleSeek}
        disabled={isNaN(duration)} // 音頻未載入完成前禁用進度條
      />

      {/* 時間顯示 */}
      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>

      {/* 音量控制 */}
      <input
         type="range"
         min="0"
         max="1"
         step="0.01"
         value={volume}
         onChange={handleVolumeChange}
      />

      {/* 可以在這裡加上載入指示器或其他狀態 */}
    </div>
  );
}

export default AudioPlayer;