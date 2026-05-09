#!/bin/bash
set -eu

# directories settings
PROJECT_DIR=$(cd $(dirname $0)/.. && pwd)

MESHES=(ms2 msjma5k ms3)
ELEMS=(rainsri rainri soil)

function make_tiles() {
  local elem=$1
  reference_date=$(cat geojson/${elem}/reference_date.txt)

  for mesh in "${MESHES[@]}"; do
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
      -n "jmagis" \
      -N "JMA Warning & Advisory Criteria Mesh (Vector Tile" \
      -A "気象庁「特別警報の指標及び危険警報・警報・注意報発表基準一覧表」(基準日: ${reference_date}) を加工" \
      -l "${elem}-${mesh}" \
      -z ${maxzoom} \
      -Z ${minzoom} \
      --detect-shared-borders \
      --generate-ids \
      -o tiles/${elem}.${mesh}.pmtiles \
      geojson/${elem}/*.${mesh}.jsonl
  done
}

cd ${PROJECT_DIR}

rm -f tiles/*.pmtiles
rm -f tiles/*.json

for elem in "${ELEMS[@]}"; do
  make_tiles ${elem}
done

for elem in "${ELEMS[@]}"; do
  created_date="令和$(($(date +%Y) - 2018))年$(date +%-m月%-d日)"
  reference_date=$(cat geojson/${elem}/reference_date.txt)
  cat <<EOF >tiles/${elem}.metadata.json
{
  "element": "${elem}",
  "created": "${created_date}",
  "reference_date": "${reference_date}"
}
EOF
done
