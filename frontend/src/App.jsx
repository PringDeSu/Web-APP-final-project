import { useState, useEffect, useRef } from 'react';
import MusicUpload from './MusicUpload.jsx';
import MusicDisplayer from './MusicDisplayer.jsx';

function App() {

    const [clippedMusicPath, setClippedMusicPath] = useState(null);
    const [musicMetadata,    setMusicMetadata]    = useState(null);

    const [page, setPage] = useState(0);

    const handleResponse = (path, metadata) => {
        setClippedMusicPath(path);
        setMusicMetadata(metadata);
    };

    return (
        <>
            {page === 0 && <MusicUpload onChangePage={() => setPage(1)} onResponse={handleResponse} />}
            {page === 1 && <MusicDisplayer 
                onGoBack={() => setPage(0)} 
                musicPath={clippedMusicPath}
                musicMetadata={musicMetadata}
            />}
        </>
    );
}

export default App;
