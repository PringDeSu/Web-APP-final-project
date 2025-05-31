from pydub.generators import Sine
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB

sine_wave = Sine(150).to_audio_segment(duration=5000)
sine_wave.export("special_tags.mp3", format="mp3")

audio = ID3()

audio.add(TIT2(encoding=3, text="🎵 テスト曲名 – اختبار"))
audio.add(TPE1(encoding=3, text="歌手名 – مغني"))
audio.add(TALB(encoding=3, text="專輯名 – ألبوم"))

audio.save("special_tags.mp3")