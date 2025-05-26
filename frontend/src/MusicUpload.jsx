import { useState } from 'react';
import './MusicUpload.css'; // 引入 CSS

function MusicUpload({onChangePage, onResponse}) {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        // console.log('Selected file:', selectedFile);
        if (selectedFile && (selectedFile.type === 'audio/mpeg' || selectedFile.type === 'audio/mp3')) {
            setFile(selectedFile);
            setUploadStatus('');
        } else {
            setFile(null);
            setUploadStatus('請選擇有效的 MP3 文件');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('請先選擇一個 MP3 文件');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        // console.log('FormData file:', file);

        try {
            const response = await fetch('http://localhost:3000/api/post', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploadStatus('文件上傳成功！');

                // console.log(response);
                response.json().then((data) => {
                    // console.log(data);
                    onResponse(`http://localhost:3000/api/upload/${data.fileInfo.outputName}`, data);
                    onChangePage();
                });

                setFile(null);
            } else {
                const errorData = await response.json();
                setUploadStatus(`上傳失敗: ${errorData.message || '請稍後再試'}`);
            }
        } catch (error) {
            console.error('上傳錯誤:', error);
            setUploadStatus('上傳過程中發生錯誤。');
        } finally {
            setIsUploading(false);
        }
    };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">MP3 文件上傳</h1>
      
      <div className="mb-4">
        <input
          type="file"
          accept="audio/mpeg,audio/mp3"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <p className="text-sm text-gray-600 mb-4">
          已選擇文件: {file.name}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`w-full py-2 px-4 rounded text-white font-semibold
          ${isUploading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isUploading ? '正在上傳...' : '上傳 MP3'}
      </button>

      {uploadStatus && (
        <p className={`mt-4 text-sm ${uploadStatus.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
}

export default MusicUpload;

