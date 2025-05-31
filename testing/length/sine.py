from pydub.generators import Sine

frequency = 10
volume_db = 20

for length in [0, 0.001, 0.9, 5, 30, 150, 299, 300, 301, 600, 1800]: 
    tone = Sine(frequency).to_audio_segment(duration=1000*length).apply_gain(volume_db)
    tone.export("sine_" + str(length) + "s.mp3", format="mp3")