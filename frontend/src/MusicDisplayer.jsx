import { useState, useEffect, useRef, useMemo } from 'react';
import './MusicDisplayer.css'; // 引入 CSS 檔案

// --- 輔助函數 (這些函數保持不變) ---

function hsvToRgb(h, s, v) {
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [r, g, b];
}

function LR(pre, cur) {
    const alpha = 0.3;
    let res = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        res[i] = Math.round(pre[i] + (cur[i] - pre[i]) * alpha);
    }
    return res;
}

function generateData(WIDTH, HEIGHT, chord, amplitude) {

    const rnd = (x) => {
        return Math.floor(Math.random() * x);
    }

    // const RESET_RATE = 20; // 未使用
    const CHANGE_COUNT = 500;

    let board = [];

    for (let i = 0; i < WIDTH; i++) {
        board.push(new Array(HEIGHT).fill([0, 0, 0]));
    }

    let changeStamp = [[]]; // 為了確保 changeStamp[0] 存在而初始化

    for (let i = 0; i < WIDTH; i++) {
        changeStamp[0].push([]);
        for (let j = 0; j < HEIGHT; j++) {
            changeStamp[0][i].push([0, 0, 0]); // 初始化第一幀為黑色
        }
    }

    // 處理 amplitude 為空的情況
    const ampRef = amplitude.length > 0 ? Math.max(...amplitude) * 0.9 : 1.0;
    // 如果 ampRef 為 0 或 NaN，設定一個安全的預設值以避免除以零
    const safeAmpRef = ampRef === 0 || isNaN(ampRef) ? 1.0 : ampRef;


    let HueShiftRng = [];
    // let HueShiftRngMax = 0.0; // 未使用

    for (let t = 0; t < chord.length; t++) {

        const b_len = Math.min(10, t + 1);
        let avgAmp = 0.0;

        for (let i = t - b_len + 1; i <= t; i++) {
            avgAmp += amplitude[i];
        }
        avgAmp /= b_len;

        const val = Math.pow(Math.min(avgAmp / safeAmpRef, 1.0), 3);
        HueShiftRng.push(val);
        // HueShiftRngMax = Math.max(HueShiftRngMax, val);
    }

    // 處理 HueShiftRng 為空或最大值為 0 的情況
    const maxHueShiftRng = Math.max(...HueShiftRng);
    const HueShiftRngMul = maxHueShiftRng === 0 || isNaN(maxHueShiftRng) ? 0 : 180.0 / maxHueShiftRng;


    for (let t = 0; t < chord.length; t++) {
        HueShiftRng[t] *= HueShiftRngMul;
    }

    for (let t = 0; t < chord.length; t++) {

        const HueBase = Math.round((chord[t] - 0.5) * 30);

        for (let c = 0; c < CHANGE_COUNT; c++) {

            const HueShift = rnd(2 * HueShiftRng[t]) - HueShiftRng[t];

            const clr = hsvToRgb(
                (HueBase + 360 + HueShift) % 360, // Hue
                1.0, // Saturation
                Math.min(1.0, amplitude[t] / safeAmpRef) // Brightness
            );
            let x = rnd(WIDTH), y = rnd(HEIGHT);
            // 這裡的 nclr 變量沒有被使用，可以直接應用 LR 到 board[x][y]
            board[x][y] = LR(board[x][y], clr);
        }
        changeStamp.push([]);
        for (let i = 0; i < WIDTH; i++) {
            changeStamp[t + 1].push([]);
            for (let j = 0; j < HEIGHT; j++) {
                changeStamp[t + 1][i].push(Array.from(board[i][j]));
            }
        }
    }

    return {
        changeStamp: changeStamp,
    };
}

// --- MusicDisplayer 組件 ---

function MusicDisplayer({onGoBack, musicPath, musicMetadata}) {

    const canvasRef = useRef(null);
    const audioRef = useRef(null); // 用於取得 audio DOM 元素的引用

    const WIDTH = 32, HEIGHT = 32;
    const CELL_SIZE = 20;

    // 處理數據 (使用 useMemo，確保在 musicMetadata 改變時重新生成)
    const u = useMemo(() => {
        // 確保 musicMetadata.features 存在且包含必要的屬性
        if (!musicMetadata || !musicMetadata.features || !musicMetadata.features.chord || !musicMetadata.features.amplitude) {
            console.warn("Music metadata is incomplete or missing. Returning default data.");
            return {
                changeStamp: Array(1).fill(Array(WIDTH).fill(Array(HEIGHT).fill([0, 0, 0]))),
            }; // 返回一個空的或預設的數據
        }
        return generateData(
            WIDTH,
            HEIGHT,
            musicMetadata.features.chord,
            musicMetadata.features.amplitude
        );
    }, [musicMetadata, WIDTH, HEIGHT]); // 確保依賴項正確

    const [canvaIdx, setCanvaIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1); // 0 to 1

    // 格式化時間函數 (秒 -> MM:SS)
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
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
            setCanvaIdx(0); // 畫布也回到第一幀
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

        const updateCanvasIndex = () => {
            if (!musicMetadata || !musicMetadata.features || musicMetadata.features.sample_rate === undefined || u.changeStamp.length === 0) {
                 return; // 如果數據不完整，不更新畫布
            }
            const newIndex = Math.min(
                Math.floor(audio.currentTime / musicMetadata.features.sample_rate),
                u.changeStamp.length - 1
            );
            setCanvaIdx(newIndex);
        };

        const itv = setInterval(updateCanvasIndex, 100); // 每100ms更新一次畫布幀

        // 清除事件監聽器 (在組件卸載時)
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);

            clearInterval(itv);
        };
    }, [audioRef, u.changeStamp.length, musicMetadata]); // 依賴 audioRef, u.changeStamp.length, musicMetadata 確保正確更新

    // 當 musicPath prop 改變時重新載入音源
    useEffect(() => {
        if (audioRef.current && musicPath) {
            audioRef.current.src = musicPath;
            audioRef.current.load(); // 載入新的音源
            setIsPlaying(false); // 新載入時預設不是播放狀態
            setCurrentTime(0); // 時間歸零
            setDuration(0); // 時長歸零直到 metadata 載入
            setCanvaIdx(0); // 畫布索引歸零
        }
    }, [musicPath]);


    // 播放/暫停切換邏輯
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play().catch(error => {
                    console.error("Audio playback failed:", error);
                    // 處理自動播放被瀏覽器阻止的情況
                    alert("音頻自動播放被瀏覽器阻止。請點擊播放按鈕開始播放音頻。");
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

    // Canvas 渲染邏輯
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // 確保 canvas 元素存在

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // 確保 context 存在

        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除上一幀內容

        // 禁用圖像平滑，確保像素化效果
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        const board = u.changeStamp[canvaIdx]; // 取得當前幀的像素數據
        if (!board) return; // 確保板子數據存在

        for (let i = 0; i < WIDTH; i++) {
            for (let j = 0; j < HEIGHT; j++) {
                const pixelColor = board[i][j];
                // 確保 pixelColor 是有效的三個數字陣列
                if (Array.isArray(pixelColor) && pixelColor.length === 3) {
                    ctx.fillStyle = `rgb(${pixelColor[0]} ${pixelColor[1]} ${pixelColor[2]})`;
                    ctx.fillRect(
                        i * CELL_SIZE,
                        j * CELL_SIZE,
                        CELL_SIZE,
                        CELL_SIZE
                    );
                }
            }
        }
    }, [canvaIdx, u.changeStamp, WIDTH, HEIGHT, CELL_SIZE]); // 依賴項包含所有在 effect 內部使用的變量
    // 在 MusicDisplayer.jsx 中添加這個 useEffect 來動態更新 CSS 變量
    useEffect(() => {
        const volumeSlider = document.querySelector('.volume-slider');
        const progressBar = document.querySelector('.progress-bar-main');

        if (volumeSlider) {
            volumeSlider.style.setProperty('--volume-fill-percentage', `${volume * 100}%`);
        }

        if (progressBar) {
            const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
            progressBar.style.setProperty('--progress-fill-percentage', `${progressPercentage}%`);
        }
    }, [volume, currentTime, duration]); // 依賴於這些狀態，當它們變化時更新 CSS 變量
    return (
        <div className="music-displayer-container">
            {/* 1. 返回上一頁按鈕 (新的位置和樣式) */}
            <button className="back-button-topleft" onClick={onGoBack}>返回上一頁</button>

            {/* 主要內容區塊，包含畫布和所有控制項 */}
            <div className="main-content-area">
                {/* 畫布和音量控制區域 (並排) */}
                <div className="canvas-and-volume-wrapper">
                    {/* 畫布容器，現在可以點擊播放/暫停 */}
                    <div className="canvas" onClick={togglePlayPause}> {/* MODIFIED: Added onClick */}
                        <canvas
                            ref={canvasRef}
                            width={WIDTH * CELL_SIZE}
                            height={HEIGHT * CELL_SIZE}
                        />
                        {/* 這裡可以選擇性地添加一個疊加的播放/暫停圖標 */}
                        {/* { !isPlaying && <div className="play-overlay-icon">▶</div> } */}
                    </div>

                    {/* 垂直音量控制 */}
                    <div className="volume-control-vertical">
                        <input
                            type="range"
                            className="volume-slider"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            aria-label="音量調整" // 為了可訪問性
                        />
                    </div>
                </div>

                {/* 水平播放控制條 (播放/暫停、進度條、時間) */}
                <div className="playback-controls-horizontal">
                    {/* 播放/暫停按鈕 (獨立於畫布點擊事件，提供明確按鈕) */}
                    <button onClick={togglePlayPause} className="play-pause-main-button">
                        {isPlaying ? '暫停' : '播放'}
                    </button>
                    {/* 進度條 */}
                    <input
                        type="range"
                        className="progress-bar-main"
                        min="0"
                        max="100" // 使用百分比更容易處理
                        value={duration ? (currentTime / duration) * 100 : 0}
                        onChange={handleSeek}
                        disabled={isNaN(duration)} // 音頻未載入完成前禁用進度條
                        aria-label="播放進度" // 為了可訪問性
                    />
                    {/* 時間顯示 */}
                    <span className="time-display-main">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
            </div>

            {/* 隱藏的 audio 標籤 */}
            <audio ref={audioRef} style={{ display: 'none' }}></audio>
        </div>
    );
}

export default MusicDisplayer;