#!/bin/bash
if [[ $# -ne 0 ]]; then
    rm sample.wav
    YTLINK="$1"
    yt-dlp -x --audio-format wav "$YTLINK" -o "sample.wav"
fi
python3 test_rgb.py && mv testing.mp4 grid_rgb.mp4\
&& python3 test_hsv.py && mv testing.mp4 grid_hsv.mp4\
&& python3 test1.py && mv testing.mp4 wave.mp4\
&& python3 test_chord.py && mv testing.mp4 chords.mp4\
&& yes | ffmpeg -i grid_rgb.mp4 -i grid_hsv.mp4 -i wave.mp4 -i chords.mp4 -i sample.wav \
-filter_complex "\
[0:v]scale=-1:480[v0]; \
[1:v]scale=-1:480[v1]; \
[2:v]scale=-1:480[v2]; \
[3:v]scale=-1:480[v3]; \
[v0][v1]vstack=inputs=2[top]; \
[v2][v3]vstack=inputs=2[bot]; \
[top][bot]hstack=inputs=2[vout]" \
-map "[vout]" -map 4:a -shortest stacked.mp4\
&& echo "DONE!"
