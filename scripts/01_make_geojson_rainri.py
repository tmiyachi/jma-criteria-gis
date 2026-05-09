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

# （別紙１－２）レベル５大雨特別警報・レベル４大雨危険警報・レベル３大雨警報・レベル２大雨注意報の流域雨量指数基準値、複合基準の基準値【CSVファイル】
NAMES_TABLE_1_2 = {
    "二次細分区域コード": "code",
    "格子番号": "ms3",
    "河川番号": "rcode",
    "河川名": "rname",
    "レベル５大雨特別警報の流域雨量指数基準値": "lv5",
    "レベル４大雨危険警報の流域雨量指数基準値": "lv4",
    "レベル３大雨警報の流域雨量指数基準値": "lv3",
    "レベル３大雨警報の複合基準における流域雨量指数基準値": "lv3ri",
    "レベル３大雨警報の複合基準における表面雨量指数基準値": "lv3sri",
    "レベル２大雨注意報の流域雨量指数基準値": "lv2",
    "レベル２大雨注意報の複合基準における流域雨量指数基準値": "lv2ri",
    "レベル２大雨注意報の複合基準における表面雨量指数基準値": "lv2sri",
}
# （別紙１－４）レベル４大雨危険警報の流域雨量指数基準における対象河川の格子【CSVファイル】
NAMES_TABLE_1_4 = {
    "二次細分区域コード": "code",
    "格子番号": "ms3",
    "河川番号": "rcode",
}
# 未定義値
MISSING_VALUE = -1


# ディレクトリ
BASE_DIR = Path(__file__).parent.parent
TABLE_DIR = BASE_DIR / "table"
GEOJSON_DIR = BASE_DIR / "geojson"
JSON_DIR = BASE_DIR / "data"


def read_table(pref_name):
    table_1_2_path = TABLE_DIR / "table_1_2" / f"1_2_{pref_name}.csv"
    table_1_4_path = TABLE_DIR / "table_1_4" / f"1_4_{pref_name}.csv"

    if not table_1_2_path.exists():
        raise FileNotFoundError(f"File not found: {table_1_2_path.name}")
    if not table_1_4_path.exists():
        raise FileNotFoundError(f"File not found: {table_1_4_path.name}")
    # テーブルを読み込む
    df_1_2 = (
        pd.read_csv(
            table_1_2_path, encoding="shift-jis", na_values=["-1", "－"], comment="#"
        )
        .rename(columns=NAMES_TABLE_1_2)  # カラム名変更
        .loc[:, NAMES_TABLE_1_2.values()]  # 必要なカラムのみ選択
    )
    df_1_4 = (
        pd.read_csv(
            table_1_4_path, encoding="shift-jis", na_values=["-1", "－"], comment="#"
        )
        .rename(columns=NAMES_TABLE_1_4)
        .loc[:, NAMES_TABLE_1_4.values()]
        .fillna(MISSING_VALUE)
    )
    # 河川名のない格子で格子番号が000で終わる格子は非流路格子、そうでない場合はN.D.とする
    # 配信資料に関する技術情報第 664 号: 計算対象河川が存在しない格子の指数値は、河川番号の下 3 桁を「000」として対応付けています
    df_1_2.loc[(df_1_2.rcode % 1000 == 0), "rname"] = "非流路格子"
    df_1_2["rname"] = df_1_2["rname"].fillna("N.D.")
    # 未定義値をNaNから置き換え
    df_1_2 = df_1_2.fillna(MISSING_VALUE)

    # Lv4危険警報基準値（別表1-4に記載のない格子はLv4基準はあるが危険警報の発表対象外なので未定義値にする）
    s = df_1_2["lv4"].where(df_1_2["ms3"].isin(df_1_4["ms3"]), MISSING_VALUE)
    df_1_2.insert(df_1_2.columns.get_loc("lv4") + 1, "lv4_urgent", s)

    # コード番号は文字列型に変換
    df_1_2["ms3"] = df_1_2["ms3"].map("{:08d}".format)
    df_1_2["code"] = df_1_2["code"].map(lambda code: "{:07d}".format(int(code)))
    df_1_2["rcode"] = df_1_2["rcode"].map("{:08d}".format)
    # ms3とcode以外は整数に変換
    for col in filter(
        lambda c: c not in ["ms3", "code", "rcode", "rname"], df_1_2.columns
    ):
        df_1_2[col] = df_1_2[col].astype(int)

    return df_1_2


def _make_agg_rules(df, by):
    agg_rules = {col: "min" for col in df.columns if col not in [by]}
    agg_rules["lv3sri"] = lambda x: df.at[df.loc[x.index, "lv3ri"].idxmin(), "lv3sri"]
    agg_rules["lv2sri"] = lambda x: df.at[df.loc[x.index, "lv2ri"].idxmin(), "lv2sri"]
    return agg_rules


def make_json():
    """府県予報区の基準値テーブルから、メッシュ単位で階層化したJSON形式で出力する"""
    # 全国分読む
    pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/1_2_*.csv")]
    df = pd.concat([read_table(p) for p in pref_names], ignore_index=True)

    # ファイルサイズを小さくするため1次メッシュ単位で集約する
    df["ms1"] = df["ms3"].str[:4]
    for ms1, df_ms1 in df.groupby("ms1"):
        # 各格子の基準を辞書にまとめる
        columns = [c for c in df_ms1.columns if c not in ["ms1", "ms3", "code"]]
        df_ms1["criteria"] = df_ms1[columns].to_dict(orient="records")

        # 3次メッシュ単位でグループ化
        # ms3とcodeはメッシュで共通（3次メッシュは府県をまたがない）なのでfirstで取得
        df_ms1 = (
            df_ms1.groupby("ms3").agg({"code": "first", "criteria": list}).reset_index()
        )
        result = df_ms1.to_dict(orient="records")

        json_path = JSON_DIR / "rainri" / f"{ms1}.json"
        if not json_path.parent.exists():
            json_path.parent.mkdir(parents=True)
        with open(json_path, "w", encoding="utf-8") as file:
            json.dump(result, file, ensure_ascii=False)


def make_geojson(mesh, pref_name, geojson_path):
    """指定されたメッシュと府県予報区の基準値テーブルから、メッシュ単位の基準値を集約してGeoJSONL形式で出力する"""
    if pref_name == "japan":
        pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/1_2_*.csv")]
        df = pd.concat([read_table(p) for p in pref_names], ignore_index=True)
    else:
        df = read_table(pref_name)

    # 1つのメッシュに複数河川の基準が定義されているので格子単位で各レベル値の最小値を格納する
    # ただし、複合基準は流域雨量指数基準の最小値とし、表面雨量指数には流域雨量指数が最小となる格子の表面雨量指数基準値を格納する
    columnsExcluded = ["code", "ms3", "rname", "rcode"]
    if mesh == "ms1":
        df["ms1"] = df["ms3"].str[:4]
        df = df.loc[:, [col for col in df.columns if col not in columnsExcluded]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("ms1")
            .agg(_make_agg_rules(df, "ms1"))
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = ms1_to_polygon
    elif mesh == "ms2":
        df["ms2"] = df["ms3"].str[:6]
        df = df.loc[:, [col for col in df.columns if col not in columnsExcluded]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("ms2")
            .agg(_make_agg_rules(df, "ms2"))
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = ms2_to_polygon
    elif mesh == "msjma5k":
        df["msjma5k"] = df["ms3"].apply(ms3_to_msjma5k)
        df = df.loc[:, [col for col in df.columns if col not in columnsExcluded]]
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("msjma5k")
            .agg(_make_agg_rules(df, "msjma5k"))
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
        ms_to_polygon = msjma5k_to_polygon
    elif mesh == "ms3":
        df = (
            df.replace({MISSING_VALUE: 9999})
            .groupby("ms3")
            .agg(_make_agg_rules(df, "ms3"))
            .reset_index()
            .replace({9999: MISSING_VALUE})
        )
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
            f.write(json.dumps(feature, ensure_ascii=False) + "\n")


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
    pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/1_2_*.csv")]
    for pref_name in pref_names:
        print(f"Processing rainri ms3 for {pref_name}...")
        geojson_path = GEOJSON_DIR / "rainri" / f"{pref_name}.ms3.jsonl"
        make_geojson("ms3", pref_name, geojson_path)

    # 2次メッシュと気象庁5kmメッシュは境界で格子が重複してしまうので全国まとめて格子単位の最大値として作成
    print("Processing rainri ms2...")
    make_geojson("ms2", "japan", GEOJSON_DIR / "rainri" / "japan.ms2.jsonl")
    print("Processing rainri msjma5k...")
    make_geojson("msjma5k", "japan", GEOJSON_DIR / "rainri" / "japan.msjma5k.jsonl")

    # 各格子の全基準値をまとめたJSONも作成
    print("Processing rainri json...")
    make_json()

    # 更新日情報をテキストファイルで配置
    ref_date = get_reference_date()
    with open(GEOJSON_DIR / "rainri" / "updated.txt", "w") as f:
        f.write(ref_date.strftime("%Y-%m-%d"))
