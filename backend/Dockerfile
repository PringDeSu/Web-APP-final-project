ARG ver=3.8

FROM python:$ver-slim


WORKDIR /app
COPY requirements.txt .
COPY api.py .
COPY feature_extractor.py .
COPY trim_sound.sh .

RUN apt-get update && apt-get install -y \
    "g++" libsndfile1 timidity ffmpeg file\
&& rm -rf /var/lib/apt/lists/* \
&& python -m pip install --upgrade pip \
&& python -m pip install flake8 pytest wheel numpy==1.19.2\
&& python -m pip install -r requirements.txt \
# stop the build if there are Python syntax errors or undefined names
&& flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics \
# exit-zero treats all errors as warnings. The GitHub editor is 127 chars wide
&& flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics \
&& python -m pip install librosa flask flask_cors chord_extractor gunicorn

CMD ["bash", "-c", "gunicorn -w 1 -b 0.0.0.0:$BACKEND_SERVER_PORT api:app"]
