from pydub import AudioSegment

for length in [0, 0.001, 0.9, 5, 30, 150, 299, 300, 301, 600, 1800, 7200, 86400]: 
    silence = AudioSegment.silent(duration=1000 * length)
    silence.export("silence_" + str(length) + "s.mp3", format="mp3")