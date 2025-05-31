from pydub.generators import Sine
sine = Sine(150).to_audio_segment(duration=5000)
sine.export("good.mp3", format="mp3")

with open("good.mp3", "rb") as f:
    data = f.read()

corrupt_data = data[:len(data) // 2]

with open("corrupt_truncated.mp3", "wb") as f:
    f.write(corrupt_data)