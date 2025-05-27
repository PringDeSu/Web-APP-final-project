// --- START OF FILE App.jsx ---

import { useState, useEffect, useRef } from 'react';
import MusicUpload from './MusicUpload.jsx';
import MusicDisplayer from './MusicDisplayer.jsx';
import './App.css'; // 引入 App.css

function App() {
    const [clippedMusicPath, setClippedMusicPath] = useState(null);
    const [musicMetadata, setMusicMetadata] = useState(null);
    const [page, setPage] = useState(0);

    const handleResponse = (path, metadata) => {
        setClippedMusicPath(path);
        setMusicMetadata(metadata);
    };

    return (
        <div className="app-container"> {/* 新增一個容器 div */}
            <header className="app-header"> {/* 新增 header */}
                <h1>音律光影</h1> {/* 專案標題 */}
            </header>
            <main className="app-main"> {/* 主要內容區域 */}
                {page === 0 && <MusicUpload onChangePage={() => setPage(1)} onResponse={handleResponse} />}
                {page === 1 && <MusicDisplayer
                    onGoBack={() => setPage(0)}
                    musicPath={clippedMusicPath}
                    musicMetadata={musicMetadata}
                />}
            </main>
            <footer className="app-footer"> {/* 頁腳 (可選) */}
                <p>© {new Date().getFullYear()}Web APP 開發 第四組</p>
            </footer>
        </div>
    );
}

export default App;
