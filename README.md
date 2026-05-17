# JMA-CRITERIA-GIS

気象庁公開の特別警報の指標及び危険警報・警報・注意報発表基準データを加工したベクトルタイル（データ基準日 2026/5/28）

## Demo

<https://tmiyachi.github.io/jma-criteria-gis/>

## Data

### tiles

| ファイル名             | レイヤー名     | 要素                                                      | ズームレベル |
| ---------------------- | -------------- | --------------------------------------------------------- | ------------ |
| rainri.ms2.pmtiles     | rainri-ms2     | 大雨警報（表面雨量指数基準）の基準値（二次メッシュ）      | 4~5          |
| rainri.msjma5k.pmtiles | rainri-msjma5k | 大雨警報（表面雨量指数基準）の基準値（気象庁5kmメッシュ） | 5~6          |
| rainri.ms3.pmtiles     | rainri-ms3     | 大雨警報（表面雨量指数基準）の基準値（三次メッシュ）      | 7~12         |
| rairi.ms2.pmtiles      | rairi-ms2      | 大雨警報（流域雨量指数基準）の基準値（二次メッシュ）      | 4~5          |
| rairi.msjma5k.pmtiles  | rairi-msjma5k  | 大雨警報（流域雨量指数基準）の基準値（気象庁5kmメッシュ） | 5~6          |
| rairi.ms3.pmtiles      | rairi-ms3      | 大雨警報（流域雨量指数基準）の基準値（三次メッシュ）      | 7~12         |
| soil.ms2.pmtiles       | soil-ms2       | 土砂災害警報の基準値（二次メッシュ）                      | 4~5          |
| soil.msjma5k.pmtiles   | soil-msjma5k   | 土砂災害警報の基準値（気象庁5kmメッシュ）                 | 5~6          |
| soil.ms3.pmtiles       | soil-ms3       | 土砂災害警報の基準値（三次メッシュ）                      | 7~12         |

- 土砂災害特別警報、危険警報、注意報は60分雨量と土壌雨量指数の組み合わせで基準が設定されているため、基準線の面積を基準値として格納している。
- 土砂災害警報は土砂災害危険警報の基準に到達する時刻からのリードタイムを3時間として発表されるため、土砂災害警報の基準値は設定されていない。

## Dependencies

- [tippecanoe](https://github.com/felt/tippecanoe)

## Make

FELT版のtippecanoeをパスに通しておく。

必要なパッケージをダウンロードする．

```
npm install
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

気象庁データをダウンロードする．`scripts/00_download_csv.sh` を実行して最新のファイル名を取得する．

```
# ./scripts
./00_download_csv.sh
```

csvテーブル表から geojson（jsonl） ファイルを作成する．

```
# ./scripts
./01_make_geojson.sh
```

ベクトルタイルを作成する．

```
# ./scripts
./02_make_tiles.sh
```

## Demo

```
# ./
npm run start

```

## Reference

このデータの作成には気象庁公開のデータを利用しています．

- [気象庁「特別警報の指標及び危険警報・警報・注意報発表基準一覧表」](https://www.jma.go.jp/jma/kishou/know/kijun/index.html)のデータを加工して作成．
