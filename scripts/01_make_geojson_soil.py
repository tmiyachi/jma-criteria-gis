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

# （別紙２－x）レベル５土砂災害特別警報の基準値
NAMES_TABLE_2 = {
    "二次細分区域コ−ド": "code",
    "格子番号": "ms3",
}
NAMES_TABLE_2.update(
    {f"60分雨量{v}ミリの時の土壌雨量指数": f"rain{v}" for v in range(151)}
)

# 未定義値
MISSING_VALUE = -1


# ディレクトリ
BASE_DIR = Path(__file__).parent.parent
TABLE_DIR = BASE_DIR / "table"
GEOJSON_DIR = BASE_DIR / "geojson"
JSON_DIR = BASE_DIR / "data"


def read_one_table(pref_name, lev):
    num = {5: "2_1", 4: "2_2", 2: "2_3"}[lev]
    table_path = TABLE_DIR / f"table_{num}" / f"{num}_{pref_name}.csv"
    if not table_path.exists():
        raise FileNotFoundError(f"File not found: {table_path.name}")

    df = (
        pd.read_csv(
            table_path, encoding="shift-jis", na_values=["-1", "−", "－"], comment="#"
        )
        .rename(columns=NAMES_TABLE_2)  # カラム名変更
        .loc[:, NAMES_TABLE_2.values()]  # 必要なカラムのみ選択
        .fillna(MISSING_VALUE)
    )

    # コード番号は文字列型に変換
    df["ms3"] = df["ms3"].map("{:08d}".format)
    df["code"] = df["code"].map(lambda code: "{:07d}".format(int(code)))
    # ms3とcode以外は整数に変換
    for col in filter(lambda c: c not in ["ms3", "code"], df.columns):
        df[col] = df[col].astype(int)

    return df


def read_table(pref_name):
    table_2_1_path = TABLE_DIR / "table_2_1" / f"2_1_{pref_name}.csv"
    table_2_2_path = TABLE_DIR / "table_2_2" / f"2_2_{pref_name}.csv"
    table_2_3_path = TABLE_DIR / "table_2_3" / f"2_3_{pref_name}.csv"
    for p in [table_2_1_path, table_2_2_path, table_2_3_path]:
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p.name}")

    # テーブルを読み込む
    df_list = []
    for lv, p in zip([5, 4, 2], [table_2_1_path, table_2_2_path, table_2_3_path]):
        df = (
            pd.read_csv(
                p, encoding="shift-jis", na_values=["-1", "−", "－"], comment="#"
            )
            .rename(columns=NAMES_TABLE_2)  # カラム名変更
            .loc[:, NAMES_TABLE_2.values()]  # 必要なカラムのみ選択
        )
        # CL基準線の内側を積分する
        cols = [f"rain{i}" for i in range(151)]
        s_lv = df[cols].astype(float).sum(axis=1, min_count=1).rename(f"lv{lv}")
        s_lv = s_lv.fillna(MISSING_VALUE)  # 未定義値を埋める
        df = pd.concat([df, s_lv], axis=1).drop(cols, axis=1)
        df_list.append(df)

    df_out = df_list[0]
    for df in df_list[1:]:
        df_out = df_out.merge(df, on=["code", "ms3"], how="outer")

    # コード番号は文字列型に変換
    df_out["ms3"] = df_out["ms3"].map("{:08d}".format)
    df_out["code"] = df_out["code"].map(lambda code: "{:07d}".format(int(code)))
    # ms3とcode以外は整数に変換
    for col in filter(lambda c: c not in ["ms3", "code"], df_out.columns):
        df_out[col] = df_out[col].astype(int)

    return df_out


def make_geojson(mesh, pref_name, geojson_path):
    """府県予報区の基準値テーブルから、メッシュ単位の基準値を集約してGeoJSONL形式で出力する"""
    if pref_name == "japan":
        pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/2_1_*.csv")]
        df = pd.concat([read_table(p) for p in pref_names], ignore_index=True)
    else:
        df = read_table(pref_name)

    lv_cols = [col for col in df.columns if "lv" in col]
    if mesh == "ms1":
        df["ms1"] = df["ms3"].str[:4]
        df = (
            df.loc[:, ["ms1"] + lv_cols]
            .replace({MISSING_VALUE: pd.NA})
            .groupby("ms1")
            .min()
            .reset_index()
            .fillna(MISSING_VALUE)
        )
        df.loc[:, lv_cols] = df.loc[:, lv_cols].astype(int)
        ms_to_polygon = ms1_to_polygon
    elif mesh == "ms2":
        df["ms2"] = df["ms3"].str[:6]
        df = (
            df.loc[:, ["ms2"] + lv_cols]
            .replace({MISSING_VALUE: pd.NA})
            .groupby("ms2")
            .min()
            .reset_index()
            .fillna(MISSING_VALUE)
        )
        df.loc[:, lv_cols] = df.loc[:, lv_cols].astype(int)
        ms_to_polygon = ms2_to_polygon
    elif mesh == "msjma5k":
        df["msjma5k"] = df["ms3"].apply(ms3_to_msjma5k)
        df = (
            df.loc[:, ["msjma5k"] + lv_cols]
            .replace({MISSING_VALUE: pd.NA})
            .groupby("msjma5k")
            .min()
            .reset_index()
            .fillna(MISSING_VALUE)
        )
        df.loc[:, lv_cols] = df.loc[:, lv_cols].astype(int)
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


def encode_rle(lst):
    if not lst:
        return ""
    res = []
    current_val = lst[0]
    count = 0
    for v in lst:
        if v == current_val:
            count += 1
        else:
            res.append(f"{current_val}:{count}")
            current_val = v
            count = 1
    res.append(f"{current_val}:{count}")
    return ",".join(res)


def make_json():
    """府県予報区の基準値テーブルから、メッシュ単位で階層化したJSON形式で出力する"""
    pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/2_1_*.csv")]

    df_list = []
    for lv in [2, 4, 5]:
        # 全国分読む
        df = pd.concat([read_one_table(p, lv) for p in pref_names], ignore_index=True)

        rain_cols = [col for col in df.columns if col.startswith("rain")]
        # 基準値がMISSING_VALUEの格子は除外
        df = df[(df[rain_cols] != MISSING_VALUE).all(axis=1)].copy()
        # リストにまとめる
        df[f"lv{lv}"] = df[rain_cols].values.tolist()
        df = df.drop(columns=rain_cols)

        df_list.append(df)

    # 1つにまとめる
    df_all = df_list[0]
    for df in df_list[1:]:
        df_all = df_all.merge(df, on=["code", "ms3"], how="outer")

    # ファイルサイズを小さくするため1次メッシュ単位で集約する
    df_all["ms1"] = df_all["ms3"].str[:4]
    for ms1, df_ms1 in df_all.groupby("ms1"):
        records = (
            df_ms1[["ms3", "code", "lv5", "lv4", "lv2"]]
            .replace({pd.NA: None})
            .to_dict("records")
        )
        # mergeで欠損になったレベル（Lv2は基準がないがLv5は基準があるような場合）を除く
        result = {
            r.pop("ms3"): {
                # ランレングス圧縮表現の文字列にする
                k: encode_rle(v)
                for k, v in r.items()
                if isinstance(v, list)
            }
            for r in records
        }

        json_path = JSON_DIR / "soil" / f"{ms1}.json"
        if not json_path.parent.exists():
            json_path.parent.mkdir(parents=True)
        with open(json_path, "w", encoding="utf-8") as file:
            json.dump(result, file, ensure_ascii=False)


def get_reference_date():
    reference_dates = []
    pattern = r"更新日:令和\s*(\d+)年\s*(\d{1,2})月\s*(\d{1,2})日"
    for p in TABLE_DIR.glob("**/2_1_*.csv"):
        with open(p, "r", encoding="shift-jis") as f:
            line = f.readline()
            m = re.search(pattern, line)
            if not m:
                raise ValueError(f"テーブルの更新日が取得できませんでした: {p.name}")
            reiwa_year, month, day = m.groups()
            year = 2018 + int(reiwa_year)

            reference_dates.append(datetime(int(year), int(month), int(day)))

    return max(reference_dates)


if __name__ == "__main__":
    # 3次メッシュは府県予報区単位で作成
    pref_names = [p.stem.split("_")[-1] for p in TABLE_DIR.glob("**/2_1_*.csv")]
    for pref_name in pref_names:
        print(f"Processing soil ms3 for {pref_name}...")
        geojson_path = GEOJSON_DIR / "soil" / f"{pref_name}.ms3.jsonl"
        make_geojson("ms3", pref_name, geojson_path)

    # 2次メッシュと気象庁5kmメッシュは境界で格子が重複してしまうので全国まとめて格子単位の最大値として作成
    print("Processing soil ms2...")
    make_geojson("ms2", "japan", GEOJSON_DIR / "soil" / "japan.ms2.jsonl")
    print("Processing soil msjma5k...")
    make_geojson("msjma5k", "japan", GEOJSON_DIR / "soil" / "japan.msjma5k.jsonl")

    # 各格子の全基準値をまとめたJSONも作成
    print("Processing soil json...")
    make_json()

    # 更新日情報をテキストファイルで配置
    ref_date = get_reference_date()
    with open(GEOJSON_DIR / "soil" / "updated.txt", "w") as f:
        f.write(ref_date.strftime("%Y-%m-%d"))
