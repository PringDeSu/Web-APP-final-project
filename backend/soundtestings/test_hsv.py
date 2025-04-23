import time
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.animation as animation
from matplotlib.colors import hsv_to_rgb
import math
import random

# 1. 讀音檔
y, sr = librosa.load("./sample.wav")  # 預設會轉成 mono + 22050 Hz

n_fft=2048
frame_time = n_fft/sr
aph = 0.8

print("loading done!")

D = librosa.stft(y, n_fft=n_fft, hop_length = n_fft)


print(f"len(D) = {len(D)}")
print(f"len(D[0]) = {len(D[0])}")
print("STFT done")

frequencies = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
frequencies = [math.log2(i) * 20 if i > 0 else 0 for i in frequencies]

freq_l = frequencies[0]
freq_r = frequencies[-1]

def freq_normalize(k):
    re = (k-freq_l)/(freq_r-freq_l)
    if k > freq_r or k < freq_l:
        print(f"ERROR! {freq_l}, {k}, {freq_r}")
        exit()
    return re


def get_topk_index(arr, k, dis):# need to give minimal distance
    sorted_arr = np.argsort(arr)[::-1]
    for i in range(1, len(arr)):
        if arr[sorted_arr[i-1]] < arr[sorted_arr[i]]:
            print("ERROR! not sorted!!!")
            exit()
    re = []
    for i in sorted_arr:
        if len(re) == k:
            break
        flag = True
        for j in re:
            if abs(frequencies[j]-frequencies[i]) <= dis:
                flag = False
        if flag == True:
            re.append(i)
    return np.array(re)


fig, ax = plt.subplots()

# ax.set_ylim(np.min(np.abs(D)), np.max(np.abs(D)))
# ax.set_xlim(freq_l, freq_r)
ax.axis('off')


ROW=10
COL=10
color_grid = np.zeros((ROW,COL,3))

im = ax.imshow(color_grid, interpolation='nearest', aspect='auto')

def update(frame):
    global color_grid
    big3 = get_topk_index(np.abs(D[:, frame]).copy(), 3, 10)
    print(f"index = {big3}")
    big3 = np.array([freq_normalize(frequencies[i]) for i in big3])
    for i in range(3):
        row = random.randint(0, ROW-1)
        col = random.randint(0, COL-1)
        print(f"drawing at {row},{col}, rgb={big3}")
        color_grid[row][col] = (color_grid[row][col]* (1-aph) + big3 * aph)
    im.set_data(hsv_to_rgb(np.asarray(color_grid)))

print(f"sr = {sr}")
print(len(D[0]), frame_time)
print(f"total time = {len(D[0]) * frame_time}")
ani = animation.FuncAnimation(fig, update, frames=len(D[0]), interval = frame_time*1000)
ani.save("testing.mp4", writer="ffmpeg", fps=1/frame_time)
print(f"fps={1/frame_time}")
# plt.show()

