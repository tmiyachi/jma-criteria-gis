#!/bin/bash
#
# 気象庁の基準値CSVをダウンロード
#
set -eu

# directories settings
PROJECT_DIR=$(cd $(dirname $0)/.. && pwd)

prefs=("wakkanai" "asahikawa" "sapporo" "abashiri" "kushiro" "muroran" "hakodate" "aomori" "akita" "iwate" "miyagi" "yamagata" "fukushima" "ibaraki" "tochigi" "gumma" "saitama" "tokyo" "chiba" "kanagawa" "nagano" "yamanashi" "shizuoka" "aichi" "gifu" "mie" "niigata" "toyama" "ishikawa" "fukui" "shiga" "kyoto" "osaka" "hyogo" "nara" "wakayama" "okayama" "hiroshima" "shimane" "tottori" "tokushima" "kagawa" "ehime" "kochi" "yamaguchi" "fukuoka" "oita" "nagasaki" "saga" "kumamoto" "miyazaki" "kagoshima" "okinawahonto" "daitojima" "miyakojima" "yaeyama")

function download_csv() {
  local prefix=$1
  dir="table/table_${prefix}"
  if [ ! -d $dir ]; then
    mkdir -p $dir
  fi

  echo "Downloading table_${prefix}..."
  wget -N -P $dir -i <(
    for pref in "${prefs[@]}"; do
      if [[ $pref == "daitojima" && $prefix == 2_* ]]; then
        # 大東島には土砂災害基準テーブルがない
        continue
      fi
      url="https://www.jma.go.jp/jma/kishou/know/kijun_new/${pref}/${prefix}_${pref}.csv"
      echo $url
    done
  )
}

cd ${PROJECT_DIR}

download_csv "1_1"
download_csv "1_2"
download_csv "1_3"
download_csv "1_4"
download_csv "2_1"
download_csv "2_2"
download_csv "2_3"
