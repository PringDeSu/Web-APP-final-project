#!/bin/bash
input_file="$1"
S=$(sha256sum "$input_file" | awk '{print $1}')
output_dir="$2"
output_name="$S.wav"
output_file="$output_dir/$output_name"

if [[ ! -f "$output_file" ]]; then

	duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration \
		   -of default=noprint_wrappers=1:nokey=1 "$input_file")

	duration=${duration%.*}  # Remove decimals

	if [ "$duration" -gt 300 ]; then
	    yes | ffmpeg -i "$input_file" -t 300 "$output_file"
	else
	    yes | ffmpeg -i "$input_file" "$output_file"
	fi
fi
echo "$output_name"
