from pydub.generators import Sine
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

sine_wave = Sine(150).to_audio_segment(duration=5000)
sine_wave.export("no_tags.mp3", format="mp3")