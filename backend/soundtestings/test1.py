import time
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.animation as animation
import math

# 1. 讀音檔
y, sr = librosa.load("./sample.wav")  # 預設會轉成 mono + 22050 Hz

n_fft=2048
frame_time = 2048/sr

print("loading done!")

# 2. 做 STFT（短時傅立葉轉換）
D = librosa.stft(y, n_fft=n_fft, hop_length = n_fft)

print("STFT done")

# 3. 轉成 dB（更容易看懂的頻譜強度）
S_db = librosa.amplitude_to_db(np.abs(D), ref=np.max)

frequencies = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
frequencies = [math.log2(i) if i > 0 else 0 for i in frequencies]
'''
frequencies = [math.log2(i) for i in range(len(frequencies))]
'''

print()
print(frequencies)
print()
	
fig, ax = plt.subplots()
ax.set_ylim(np.min(np.abs(D)), np.max(np.abs(D)))
ax.set_xlim(frequencies[0],frequencies[len(frequencies)-1])
line, = ax.plot(frequencies, np.abs(D[:, 0]))

def update(frame):
    line.set_ydata(np.abs(D[:, frame]))
    return line,
    # line.set_ydata(S_db[:, frame])


print(f"sr = {sr}")
print(len(D[0]), frame_time)
print(f"total time = {len(D[0]) * frame_time}")
ani = animation.FuncAnimation(fig, update, frames=len(D[0]), interval = frame_time*1000)
ani.save("testing.mp4", writer="ffmpeg", fps=1/frame_time)
print(f"fps={1/frame_time}")

'''
print(f"freq_len = {len(frequencies)}")
print(f"D_len = {len(D)}")
print(len(S_db[0]))
print(len(S_db))
i = 0
print("dB done")

for i in range(len(S_db[0])):
    plt.clf()  # 清除當前的圖形
    print(i)
    plt.plot(frequencies, np.abs(D[:, i]))
    plt.plot(frequencies, S_db[:, i])
    plt.pause(frame_time)
plt.show()

# 4. 畫出來
plt.figure(figsize=(10, 4))
librosa.display.specshow(S_db, sr=sr, x_axis='time', y_axis='log')  # y_axis='log' 是對數頻率軸
plt.colorbar(format='%+2.0f dB')
plt.title('Spectrogram (dB)')
plt.tight_layout()
plt.show()
'''
