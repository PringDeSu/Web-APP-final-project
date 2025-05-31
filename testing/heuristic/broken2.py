import random

with open("good.mp3", "rb") as f:
    data = bytearray(f.read())

for i in range(100, 120):
    data[i] = random.randint(0, 255)

with open("corrupt_garbage.mp3", "wb") as f:
    f.write(data)