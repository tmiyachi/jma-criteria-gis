#!/bin/bash
set -eu

# directories settings
SCRIPT_DIR=$(cd $(dirname $0) && pwd)
TILE_DIR=${SCRIPT_DIR}/../tiles
GEOJSON_DIR=${SCRIPT_DIR}/../geojson

ATTRIBUTION='<a href="https://www.jma.go.jp/jma/kishou/know/kijun/index.html">気象庁「特別警報の指標及び危険警報・警報・注意報発表基準一覧表」を加工して作成</a>'

function make_tiles() {
  local elem=$1
  for mesh in ms2 msjma5k ms3; do
    case $mesh in
    "ms2")
      minzoom=4
      maxzoom=5
      ;;
    "msjma5k")
      minzoom=6
      maxzoom=7
      ;;
    "ms3")
      minzoom=8
      maxzoom=12
      ;;
    esac
    tippecanoe --force \
      --name="jmagis" \
      --description="JMA Warning & Advisory Criteria Vector Tiles" \
      --attribution="${ATTRIBUTION}" \
      --layer="${elem}-${mesh}" \
      --maximum-zoom=${maxzoom} \
      --minimum-zoom=${minzoom} \
      --detect-shared-borders \
      --generate-ids \
      -o ${TILE_DIR}/${elem}.${mesh}.pmtiles \
      ${GEOJSON_DIR}/${elem}/*.${mesh}.jsonl
  done
}

rm -f ${TILE_DIR}/*.pmtiles
rm -f ${TILE_DIR}/*.json

for elem in rainsri rainri soil; do
  make_tiles ${elem}
  cat <<EOF >${TILE_DIR}/${elem}.metadata.json
{
  "created": "$(date -I)",
  "updated": "$(cat ${GEOJSON_DIR}/${elem}/updated.txt)"
}
EOF
done
