import { useState, useEffect, useRef } from 'react';
import './App.css';

const Mp3Upload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'audio/mpeg' || selectedFile.type === 'audio/mp3')) {
      setFile(selectedFile);
      setUploadStatus('');
      setProgress(0);
    } else {
      setFile(null);
      setUploadStatus('Please select a valid MP3 file');
    }
  };

  const handleUpload = () => {
    if (!file) {
      setUploadStatus('Please select an MP3 file first');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('mp3File', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setUploadStatus('File uploaded successfully!');
        setProgress(100);
        setTimeout(() => {
          setFile(null);
          setIsUploading(false);
          onUploadSuccess();
        }, 1000); // 1-second delay before transitioning
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          setUploadStatus(`Upload failed: ${errorData.message || 'Please try again later'}`);
        } catch {
          setUploadStatus('Upload failed: Server error');
        }
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      setUploadStatus('An error occurred during upload.');
      setIsUploading(false);
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">MP3 File Upload</h1>
      <div className="mb-4">
        <input
          type="file"
          accept="audio/mpeg,audio/mp3"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:file:bg-gray-200 disabled:file:text-gray-500 disabled:cursor-not-allowed"
        />
      </div>
      {file && (
        <p className="text-sm text-gray-600 mb-4">
          Selected file: {file.name}
        </p>
      )}
      {isUploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Upload Progress: {progress}%</p>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`w-full py-2 px-4 rounded text-white font-semibold
          ${isUploading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Uploading...
          </span>
        ) : (
          'Upload MP3'
        )}
      </button>
      {uploadStatus && (
        <p className={`mt-4 text-sm ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

const GameOfLife = () => {
  const [gameState, setGameState] = useState({ generation: 0, clusters: [] });
  const canvasRef = useRef(null);
  const CELL_SIZE = 10;
  const WIDTH = 50;
  const HEIGHT = 50;

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        setGameState(data);
      } catch (error) {
        console.error('Error fetching game state:', error);
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e7eb';
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    gameState.clusters.forEach(cluster => {
      const size = cluster.size;
      ctx.fillStyle =
        size <= 5 ? '#3b82f6' :
        size <= 15 ? '#22c55e' :
        '#ef4444';
      cluster.cells.forEach(cell => {
        ctx.fillRect(
          cell.x * CELL_SIZE,
          cell.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      });
    });
  }, [gameState]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-black mb-4">Game of Life</h1>
      <p className="text-lg text-black mb-4">Generation: {gameState.generation}</p>
      <canvas
        ref={canvasRef}
        width={WIDTH * CELL_SIZE}
        height={HEIGHT * CELL_SIZE}
        className="border border-gray-300"
      />
      <div className="mt-4">
        <p className="text-black"><span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Small (1-5 cells)</p>
        <p className="text-black"><span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>Medium (6-15 cells)</p>
        <p className="text-black"><span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>Large (16+ cells)</p>
      </div>
    </div>
  );
};

const App = () => {
  const [showGame, setShowGame] = useState(false);

  const handleUploadSuccess = () => {
    setShowGame(true);
  };

  return (
    <div className="App">
      {showGame ? <GameOfLife /> : <Mp3Upload onUploadSuccess={handleUploadSuccess} />}
    </div>
  );
};

export default App;