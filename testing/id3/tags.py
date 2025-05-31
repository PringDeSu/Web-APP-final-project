from pydub.generators import Sine
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

sine_wave = Sine(150).to_audio_segment(duration=5000)
sine_wave.export("with_tags.mp3", format="mp3")

audio = MP3("with_tags.mp3", ID3=EasyID3)
audio["title"] = "my_title"
audio["artist"] = "my_artist"
audio["album"] = "my_album"
audio.save()