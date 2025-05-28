from pydub.generators import Sine

frequency = 20
duration = 30 * 1000
volume_db = -10

tone = Sine(frequency).to_audio_segment(duration=duration).apply_gain(volume_db)
tone.export("tone_20Hz.mp3", format="mp3")