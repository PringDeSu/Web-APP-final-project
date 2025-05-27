import { useState, useEffect, useRef, useMemo } from 'react';

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

    const RESET_RATE = 20;
    const CHANGE_COUNT = 500;

    let board = [];
    
    for (let i = 0; i < WIDTH; i++) {
        board.push(new Array(HEIGHT).fill([0, 0, 0]));
    }

    let changeStamp = [[]];

    for (let i = 0; i < WIDTH; i++) {
        changeStamp[0].push([]);
        for (let j = 0; j < HEIGHT; j++) {
            changeStamp[0][i].push([0, 0, 0]);
        }
    }

    const ampRef = Math.max(...amplitude) * 0.9;

    let HueShiftRng = [];
    // let HueShiftRngMax = 0.0;

    for (let t = 0; t < chord.length; t++) {

        const b_len = Math.min(10, t + 1);
        let avgAmp = 0.0;

        for (let i = t - b_len + 1; i <= t; i++) {
            avgAmp += amplitude[i];
        }
        avgAmp /= b_len;

        const val = Math.pow(Math.min(avgAmp / ampRef, 1.0), 3);
        HueShiftRng.push(val);
        // HueShiftRngMax = Math.max(HueShiftRngMax, val);
    }

    const HueShiftRngMul = 180.0 / Math.max(...HueShiftRng); 

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
                Math.min(1.0, amplitude[t] / ampRef) // Brightness
            );
            let x = rnd(WIDTH), y = rnd(HEIGHT);
            const nclr = LR(board[x][y], clr);
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

function MusicDisplayer({onGoBack, musicPath, musicMetadata}) {

    const canvasRef = useRef(null);

    const WIDTH = 32, HEIGHT = 32;
    const CELL_SIZE = 20;

    // process the data

    const u = useMemo(() => generateData(
        WIDTH,
        HEIGHT,
        musicMetadata.features.chord,
        musicMetadata.features.amplitude
    ), []);

    const [canvaIdx, setCanvaIdx] = useState(0);

    useEffect(() => {
        const board = u.changeStamp[canvaIdx];
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < WIDTH; i++) {
            for (let j = 0; j < HEIGHT; j++) {
                ctx.fillStyle = `rgb(${board[i][j][0]} ${board[i][j][1]} ${board[i][j][2]})`;
                ctx.fillRect(
                    i * CELL_SIZE,
                    j * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }

    }, [canvaIdx]);

    // ------------------------------------------------

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

        const updateTrigger = () => {
            setCanvaIdx(Math.floor(audio.currentTime / musicMetadata.features.sample_rate));
        };

        const itv = setInterval(updateTrigger, 100);

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
    }, [audioRef]); // 依賴 audioRef，確保在 audio 元素可用後設定監聽器

    // // 當 src prop 改變時重新載入音源
    useEffect(() => {
        if (audioRef.current && musicPath) {
            audioRef.current.src = musicPath;
            audioRef.current.load(); // 載入新的音源
            setIsPlaying(false); // 新載入時預設不是播放狀態
            setCurrentTime(0); // 時間歸零
            setDuration(0); // 時長歸零直到 metadata 載入
        }
    }, [musicPath]);


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
        <>
            <div className="canvas">
                <canvas
                    ref={canvasRef}
                    width={WIDTH * CELL_SIZE}
                    height={HEIGHT * CELL_SIZE}
                />
            </div>
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
            <button onClick={onGoBack}>返回上一頁</button>
        </>
    );
}

export default MusicDisplayer;

