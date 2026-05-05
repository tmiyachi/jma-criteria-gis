#!/bin/bash
#
# 気象庁の基準値CSVをダウンロード
#
set -eu

# directories settings
SCRIPT_DIR=$(cd $(dirname $0) && pwd)
TABLE_DIR=$SCRIPT_DIR/../table

prefs=("wakkanai" "asahikawa" "sapporo" "abashiri" "kushiro" "muroran" "hakodate" "aomori" "akita" "iwate" "miyagi" "yamagata" "fukushima" "ibaraki" "tochigi" "gumma" "saitama" "tokyo" "chiba" "kanagawa" "nagano" "yamanashi" "shizuoka" "aichi" "gifu" "mie" "niigata" "toyama" "ishikawa" "fukui" "shiga" "kyoto" "osaka" "hyogo" "nara" "wakayama" "okayama" "hiroshima" "shimane" "tottori" "tokushima" "kagawa" "ehime" "kochi" "yamaguchi" "fukuoka" "oita" "nagasaki" "saga" "kumamoto" "miyazaki" "kagoshima" "okinawahonto" "daitojima" "miyakojima" "yaeyama")

function download_csv() {
  local prefix=$1
  dir="${TABLE_DIR}/table_${prefix}"
  if [ ! -d $dir ]; then
    mkdir -p $dir
  fi
  for pref in "${prefs[@]}"; do
    url="https://www.jma.go.jp/jma/kishou/know/kijun_new/${pref}/${prefix}_${pref}.csv"
    csvname=$dir/"${prefix}_${pref}.csv"

    if wget --spider -q "$url"; then
      echo "Downloading $url"
      wget $url -N -q -O $csvname
    else
      echo "URL not found: $url"
      continue
    fi
  done
}

download_csv "1_1"
download_csv "1_2"
download_csv "1_3"
download_csv "1_4"
download_csv "2_1"
download_csv "2_2"
download_csv "2_3"
