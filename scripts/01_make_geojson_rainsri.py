"""
大雨警報の表面雨量指数基準値の格子メッシュgeojson(jsonl)データを作成する
"""

from datetime import datetime
import json
from pathlib import Path
import re

import pandas as pd

from mesh import (
    ms1_to_polygon,
    ms2_to_polygon,
    ms3_to_polygon,
    msjma5k_to_polygon,
    ms3_to_msjma5k,
)

# (別紙１－１)レベル５大雨特別警報・レベル４大雨危険警報・レベル３大雨警報・レベル２大雨注意報の表面雨量指数基準値【CSVファイル】
NAMES_TABLE_1_1 = {
    "二次細分区域コード": "code",
    "格子番号": "ms3",
    "レベル５大雨特別警報の表面雨量指数基準値": "lv5",
    "レベル４大雨危険警報の表面雨量指数基準値": "lv4",
    "レベル３大雨警報の表面雨量指数基準値": "lv3",
    "レベル２大雨注意報の表面雨量指数基準値": "lv2",
}
# (別紙１－３)レベル４大雨危険警報の表面雨量指数基準における対象格子【CSVファイル】
NAMES_TABLE_1_3 = {
    "二次細分区域コード": "code",
    "格子番号": "ms3",
}
# 未定義値
MISSING_VALUE = -1


# ディレクトリ
BASE_DIR = Path(__file__).parent.parent
TABLE_DIR = BASE_DIR / "table"
GEOJSON_DIR = BASE_DIR / "geojson"


def read_table(pref_name):
    table_1_1_path = TABLE_DIR / "table_1_1" / f"1_1_{pref_name}.csv"
    table_1_3_path = TABLE_DIR / "table_1_3" / f"1_3_{pref_name}.csv"

    if not table_1_1_path.exists():
        raise FileNotFoundError(f"File not found: {table_1_1_path.name}")
    if not table_1_3_path.exists():
        raise FileNotFoundError(f"File not found: {table_1_3_path.name}")
    # テーブルを読み込む
    df_1_1 = (
        pd.read_csv(
            table_1_1_path, encoding="shift-jis", na_values=["-1", "－"], comment="#"
        )
        .rename(columns=NAMES_TABLE_1_1)  # カラム名変更
        .loc[:, NAMES_TABLE_1_1.values()]  # 必要なカラムのみ選択
        .fillna(MISSING_VALUE)  # 未定義値をNaNから置き換え
    )
    df_1_3 = (
        pd.read_csv(
            table_1_3_path, encoding="shift-jis", na_values=["-1", "－"], comment="#"
        )
        .rename(columns=NAMES_TABLE_1_3)
        .loc[:, NAMES_TABLE_1_3.values()]
        .fillna(MISSING_VALUE)
    )

    # Lv4危険警報基準値（別表1-3に記載のない格子はLv4基準はあるが危険警報の発表対象外なので未定義値にする）
    s = df_1_1["lv4"].where(df_1_1["ms3"].isin(df_1_3["ms3"]), MISSING_VALUE)
    df_1_1.insert(df_1_1.columns.get_loc("lv4") + 1, "lv4u", s)

    # コード番号は文字列型に変換
    df_1_1["ms3"] = df_1_1["ms3"].map("{:08d}".format)
    df_1_1["code"] = df_1_1["code"].map(lambda code: "{:07d}".format(int(code)))
    # ms3とcode以外は整数に変換
    for col in filter(lambda c: c not in ["ms3", "code"], df_1_1.columns):
        df_1_1[col] = df_1_1[col].astype(int)

    return df_1_1


def make_geojson(mesh, pref_name, geojson_path):
    """府県予報区の基準値テーブルから、メッシュ単位の基準値を集約してGeoJSONL形式で出力する"""
    if pref_name == "japan":
        pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/1_1_*.csv")]
        df = pd.concat([read_table(p) for p in pref_names], ignore_index=True)
    else:
        df = read_table(pref_name)

    if mesh == "ms1":
        df["ms1"] = df["ms3"].str[:4]
        df = df.loc[:, [col for col in df.columns if col not in ["code", "ms3"]]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("ms1")
            .min()
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = ms1_to_polygon
    elif mesh == "ms2":
        df["ms2"] = df["ms3"].str[:6]
        df = df.loc[:, [col for col in df.columns if col not in ["code", "ms3"]]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("ms2")
            .min()
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = ms2_to_polygon
    elif mesh == "msjma5k":
        df["msjma5k"] = df["ms3"].apply(ms3_to_msjma5k)
        df = df.loc[:, [col for col in df.columns if col not in ["code", "ms3"]]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("msjma5k")
            .min()
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = msjma5k_to_polygon
    elif mesh == "ms3":
        ms_to_polygon = ms3_to_polygon
    else:
        raise ValueError(f"Unsupported mesh type: {mesh}")

    if not geojson_path.parent.exists():
        geojson_path.parent.mkdir(parents=True)
    with open(geojson_path, "w") as f:
        for _, row in df.iterrows():
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ms_to_polygon(row[mesh], ndigits=6)],
                },
                "properties": {k: v for k, v in row.items()},
            }
            f.write(json.dumps(feature) + "\n")


def get_reference_date():
    reference_dates = []
    pattern = r"更新日:令和\s*(\d+)年\s*(\d{1,2})月\s*(\d{1,2})日現在"
    for p in TABLE_DIR.glob("**/1_2_*.csv"):
        with open(p, "r", encoding="shift-jis") as f:
            line = f.readline()
            m = re.search(pattern, line)
            if not m:
                raise ValueError("テーブルの更新日が取得できませんでした")
            reiwa_year, month, day = m.groups()
            year = 2018 + int(reiwa_year)

            reference_dates.append(datetime(int(year), int(month), int(day)))

    return max(reference_dates)


if __name__ == "__main__":
    # 3次メッシュは府県予報区単位で作成
    pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/1_1_*.csv")]
    for pref_name in pref_names:
        print(f"Processing rainsri ms3 for {pref_name}...")
        geojson_path = GEOJSON_DIR / "rainsri" / f"{pref_name}.ms3.jsonl"
        make_geojson("ms3", pref_name, geojson_path)

    # 2次メッシュと気象庁5kmメッシュは境界で格子が重複してしまうので全国まとめて格子単位の最大値として作成
    print("Processing rainsri ms2...")
    make_geojson("ms2", "japan", GEOJSON_DIR / "rainsri" / "japan.ms2.jsonl")
    print("Processing rainsri msjma5k...")
    make_geojson("msjma5k", "japan", GEOJSON_DIR / "rainsri" / "japan.msjma5k.jsonl")

    # 更新日情報をテキストファイルで配置
    ref_date = get_reference_date()
    with open(GEOJSON_DIR / "rainsri" / "updated.txt", "w") as f:
        f.write(ref_date.strftime("%Y-%m-%d"))
