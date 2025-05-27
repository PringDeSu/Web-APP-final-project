#!/bin/python3
# pip install flask flask_cors
import os
from flask import Flask, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import datetime
import argparse
import logging
from logging.handlers import RotatingFileHandler
import feature_extractor
# main part
app = Flask(__name__)
CORS(app)  # This enables CORS for all routes and origins

def init_folders(input_folder, output_folder, cache_folder, log_folder):
    # setting up log files
    os.makedirs(log_folder, exist_ok=True)
    log_file = os.path.join(log_folder, 'api.log')
    handler = RotatingFileHandler(log_file, maxBytes=1048576, backupCount=5)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    handler.setFormatter(formatter)

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    os.makedirs(input_folder, exist_ok=True)
    app.config['INPUT_FOLDER'] = input_folder

    os.makedirs(output_folder, exist_ok=True)
    app.config['OUTPUT_FOLDER'] = output_folder

    os.makedirs(cache_folder, exist_ok=True)
    app.config['CACHE_FOLDER'] = cache_folder


@app.route('/api/upload/<path:filename>')
def serve_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.isfile(file_path):
        return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=False)
    else:
        abort(404, description="File not found")


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
    file_path = os.path.join(app.config['INPUT_FOLDER'], unique_filename)
    file.save(file_path)

    app.logger.info(f"Received file: {file.filename}")
    app.logger.info(f"Stored as: {unique_filename}")
    app.logger.info(f"Saved in: {file_path}")

    # parsing the file
    features, stored_name = feature_extractor.extract_from_file(file_path, app.config['OUTPUT_FOLDER'], app.config['CACHE_FOLDER'])

    # return the attributes you parsed
    # modify this part
    output_path = app.config['OUTPUT_FOLDER']+f'/{stored_name}'
    api_path = f'/api/upload/{stored_name}'
    return jsonify({
        'message': 'File uploaded successfully',
        'fileInfo': {
            'originalName': file.filename,
            'originalPath': file_path,
            'outputPath': output_path,
            'outputName': stored_name,
            'apiPath'   : api_path,
        },
        'features': features
    })

if __name__ == '__main__':

    # parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-folder', type=str, default='./input')
    parser.add_argument('--log-folder', type=str, default='./log')
    parser.add_argument('--output-folder', type=str, default='./output')
    parser.add_argument('--cache-folder', type=str, default='./cache')
    parser.add_argument('--port',       type=int, default='3000')

    args = parser.parse_args()

    init_folders(args.input_folder, args.output_folder, args.cache_folder, args.log_folder)
    app.run(host='0.0.0.0', debug=False, port=args.port)
else:
    init_folders(os.getenv("INPUT_FOLDER", "./input"), os.getenv("OUTPUT_FOLDER", "./output"), os.getenv("CACHE_FOLDER", "./cache"), os.getenv("LOG_FOLDER", "./log"))
