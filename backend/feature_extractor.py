import time
import librosa
import numpy as np
import math
import os
from flask import jsonify
from chord_extractor.extractors import Chordino


n_fft=2048
sr = 22050
frame_time = n_fft/sr

def change_file_to_wav(file_path):
	os.system(f"ffmpeg -i {file_path} {file_path}.wav")
	return f"{file_path}.wav"

def get_amplitudes(file_path):
	global sr, n_fft
	y,_ = librosa.load(file_path, sr = sr)	# 預設會轉成 mono + 22050 Hz
	D = np.array(librosa.stft(y, n_fft=n_fft, hop_length = n_fft))
	ret = [float(np.sqrt((np.dot(np.abs(D[:, i]), np.abs(D[:, i]))))) for i in range(len(D))]
	return ret

def get_highest_frequencies(file_path):
	global sr, n_fft
	frequencies = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
	y,_ = librosa.load(file_path, sr = sr)	# 預設會轉成 mono + 22050 Hz
	D = np.array(librosa.stft(y, n_fft=n_fft, hop_length = n_fft))
	ret = [float(frequencies[np.argmax(D[:, i])]) for i in range(len(D))]
	return ret


def get_chords(file_path, fps, sz):
	chord_table = {
		'C':  1,
		'C#': 2,
		"Db": 2,
		"D" : 3,
		"D#": 4,
		"Eb": 4,
		"E" : 5,
		"F" : 6,
		"F#": 7,
		"Gb": 7,
		'G':  8,
		"G#": 9,
		"Ab": 9,
		"A" : 10,
		"A#": 11,
		"Bb": 11,
		"B" : 12
	}
	chordino = Chordino(roll_on=1)	
	chords = chordino.extract(file_path)
	if(len(chords) == 0):
		return [-1]*sz
	ptr = 0
	ret = []
	for i in range(sz):
		now_time = i * fps
		while ptr+1<len(chords) and chords[ptr+1].timestamp <= now_time:
			ptr += 1
		now_chord = chords[ptr].chord.split('/')[0]
		if now_chord == 'N':
			ret.append(1)
		else:
			number = 0
			now_chord = now_chord.split('/')[0]
			for key, val in chord_table.items():
				flag = True
				for j in range(len(key)):
					if key[j] not in now_chord:
						flag = False
						break
				if flag:
					number = val
					break
			if "m" in now_chord and "maj" not in now_chord:
				number -= 0.5
			ret.append(number)
		# ret.append(now_chord)
	return ret

def extract_from_file(file_path): #returns a json file with features
	global sr, n_fft
	file_path = change_file_to_wav(file_path)
	print(f"wav file: {file_path}")
	fps = n_fft/sr

	amplitudes = get_amplitudes(file_path)
	highest_frequencies = get_highest_frequencies(file_path)
	chords = get_chords(file_path, fps, len(amplitudes))

	return {
		'sample_rate': fps,
		'highest_frequency': highest_frequencies,
		'amplitude': amplitudes,
		'chord': chords
	}
