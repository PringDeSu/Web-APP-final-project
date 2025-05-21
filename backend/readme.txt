how to run: first install docker
run: 
	docker build -t <any name for this image> .
	docker run -p 3000:3000 <the name for image>

usages: 
	基本上跑起來之後就可以用了，可以在 <server_ip>:<server_port>/api/post 送出 POST request, 並且上傳一個檔案。之後，該程式碼會將檔案剪成 300 second 以下，並且進行取樣分析（取樣頻率為 sample_rate）分析，回傳以下資料：
		- 'features': 一個 json 格式，其中包含以下資訊
			- 'sample_rate'      :浮點數，表示多久取樣一次
			- 'highest_frequency': 浮點數陣列，表示每個取樣時間點的最高頻率位置
			- 'amplitude'        : 浮點數陣列，表示當時的音量大小
			- 'chord'            : 浮點數陣列，表示當時的和弦(值域為 1 ~ 12 ，為 C ~ B 和弦，包含半音），注意到歌曲剛開始會自動以 C 大調開始，即使歌曲剛開始時無法識別和弦。
		- 'fileInfo'：一個 json 格式，其中包含以下資訊
			- 'originalName': 字串，api 在 POST 時接收到的檔案名稱
			- 'originalPath': 字串，api 在 POST 時儲存檔案的路徑
			- 'outputPath':   字串，剪成 300 秒以下的檔案後儲存路徑
			- 'outputName':   字串，剪成 300 秒以下的檔案後儲存名稱
		
	其中，處理完成的聲音檔案可以用 <server_ip>:<server_port>/api/upload/<outputName> 取得

運作細節：
	- trim_sound.sh: 負責剪檔案，並且將檔名轉為其 sha256sum (為了方便日後進行快取)
	- feature_extractor.py: 負責音樂的資料擷取，取得音高和弦等等。
	- api.py: 負責 flask 的運行以及對外的功能
