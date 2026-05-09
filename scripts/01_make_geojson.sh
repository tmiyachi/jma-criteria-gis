#!/bin/bash
#
# テーブルからGeoJsonを作成
#
set -eu

# directories settings
PROJECT_DIR=$(cd $(dirname $0)/.. && pwd)

cd ${PROJECT_DIR}

rm -f geojson/**/*.jsonl
rm -f geojson/**/*.txt
rm -f data/**/*.json

python $SCRIPT_DIR/01_make_geojson_rainsri.py
python $SCRIPT_DIR/01_make_geojson_rainri.py
python $SCRIPT_DIR/01_make_geojson_soil.py
