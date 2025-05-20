#!/bin/python3
# pip install flask flask_cors
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import datetime
import argparse
import logging
from logging.handlers import RotatingFileHandler
import feature_extractor

# parse arguments
parser = argparse.ArgumentParser()
parser.add_argument('--tmp-folder', type=str, default='./files')
parser.add_argument('--log-folder', type=str, default='./log')
parser.add_argument('--output-folder', type=str, default='./output')
parser.add_argument('--port',		type=int, default='3000')

args = parser.parse_args()

# main part
app = Flask(__name__)
CORS(app)  # This enables CORS for all routes and origins

# setting up log files
os.makedirs(args.log_folder, exist_ok=True)
log_file = os.path.join(args.log_folder, 'api.log')
handler = RotatingFileHandler(log_file, maxBytes=1048576, backupCount=5)
handler.setLevel(logging.INFO)
formatter = logging.Formatter(
	'[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
handler.setFormatter(formatter)

app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

UPLOAD_FOLDER = args.tmp_folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

DOWNLOAD_FOLDER = args.output_folder
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
app.config['DOWNLOAD_FOLDER'] = DOWNLOAD_FOLDER

@app.route('/api/post', methods=['POST'])
def upload_file():
	if 'file' not in request.files:
		print('No file part in the request.')
		return jsonify({'error': 'No file part'}), 400

	file = request.files['file']

	if file.filename == '':
		print('No file selected.')
		return jsonify({'error': 'No file selected'}), 400

	filename = secure_filename(file.filename)
	timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
	unique_filename = f"{timestamp}_{filename}"
	file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
	file.save(file_path)

	app.logger.info(f"Received file: {file.filename}")
	app.logger.info(f"Stored as: {unique_filename}")
	app.logger.info(f"Saved in: {file_path}")

	# parsing the file
	features, stored_path = feature_extractor.extract_from_file(file_path, app.config['DOWNLOAD_FOLDER'])

	# return the attributes you parsed
	# modify this part
	return jsonify({
		'message': 'File uploaded successfully',
		'fileInfo': {
			'originalName': file.filename,
			'convertedPath': stored_path,
			'originalPath': file_path
		},
		'features': features
	})

if __name__ == '__main__':
	app.run(host='0.0.0.0', debug=True, port=args.port)
