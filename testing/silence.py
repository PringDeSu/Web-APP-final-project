from pydub import AudioSegment

# 30 seconds silence
silence = AudioSegment.silent(duration=30000)
silence.export("silence.mp3", format="mp3")