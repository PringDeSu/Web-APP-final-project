from pydub.generators import Sine
from pydub import AudioSegment

tone = Sine(100).to_audio_segment(duration=10000)

bitrates = ['64k', '128k', '192k', '256k', '320k']
for bitrate in bitrates:
    tone.export(f"tone_{bitrate}_cbr.mp3", format="mp3", bitrate=bitrate)

tone.export("tone_vbr_q2.mp3", format="mp3", parameters=["-q:a", "2"])
tone.export("tone_vbr_q5.mp3", format="mp3", parameters=["-q:a", "5"])