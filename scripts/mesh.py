# -*- coding: utf-8 -*-
"""
メッシュコードを扱うための関数モジュール
"""

from __future__ import annotations

import math


def ms3_to_msjma5k(ms3code: str) -> str:
    """
    3次メッシュコードを気象庁5kmメッシュコードに変換する．

    Parameters
    ----------
    ms3code : string or int
        3次メッシュコード文字列．8桁未満の場合は計算時に右寄せでゼロ埋めする．

    Returns
    -------
    msjma5k : string
        気象庁5kmメッシュコード文字列．
    """
    ms3code = str(ms3code).ljust(8, "0")

    iy1 = int(ms3code[0:2])
    ix1 = int(ms3code[2:4])
    iy2 = int(ms3code[4:5])
    ix2 = int(ms3code[5:6])
    iy3 = int(ms3code[6:7])
    ix3 = int(ms3code[7:8])

    # JMA5kmメッシュ南西端の3次メッシュコードを求める
    nyms3 = (iy1 * 80 + iy2 * 10 + iy3) // 6 * 6
    iy1 = nyms3 // 80
    iy2 = nyms3 % 80 // 10
    iy3 = nyms3 % 80 % 10
    ix3 = ix3 // 5 * 5

    return "{:02d}{:02d}{:01d}{:01d}{:01d}{:01d}".format(iy1, ix1, iy2, ix2, iy3, ix3)


def ms1_to_coord(code: str, ndigits: int = 6):
    """
    1次メッシュコードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string or int
        1次メッシュコード文字列．4桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    """

    code = str(code).ljust(8, "0")

    # 格子幅(deg)
    dx = 1.0
    dy = 40.0 / 60

    iy1 = int(code[0:2])
    ix1 = int(code[2:4])
    lon = ix1 * dx + 100
    lat = iy1 * dy

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def ms2_to_coord(code: str, ndigits: int = 6):
    """
    2次メッシュコードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string or int
        2次メッシュコード文字列．6桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    """

    code = str(code).ljust(8, "0")

    # 格子幅(deg)
    dx = 450.0 / 3600
    dy = 300.0 / 3600

    iy1 = int(code[0:2])
    ix1 = int(code[2:4])
    iy2 = int(code[4:5])
    ix2 = int(code[5:6])

    lon = (ix1 * 8 + ix2) * dx + 100
    lat = (iy1 * 8 + iy2) * dy

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def ms3_to_coord(code: str, ndigits: int = 6):
    """
    3次メッシュコードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string or int
        3次メッシュコード文字列．8桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    """

    code = str(code).ljust(8, "0")

    # 格子幅(deg)
    dx = 45.0 / 3600
    dy = 30.0 / 3600

    iy1 = int(code[0:2])
    ix1 = int(code[2:4])
    iy2 = int(code[4:5])
    ix2 = int(code[5:6])
    iy3 = int(code[6:7])
    ix3 = int(code[7:8])

    lon = (ix1 * 80 + ix2 * 10 + ix3) * dx + 100
    lat = (iy1 * 80 + iy2 * 10 + iy3) * dy

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def ms4_to_coord(code: str, ndigits: int = 6):
    """
    4次メッシュ（2分の1地域メッシュ）コードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string
        4次メッシュコード文字列．9桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    """
    code = str(code).ljust(9, "0")

    # 3次メッシュ換算した場合の南西端
    (lon_ms3, lat_ms3), _, _, _ = ms3_to_coord(code[0:8], ndigits=ndigits + 1)

    # 4次メッシュ格子幅(deg)
    dx = 22.5 / 3600
    dy = 15.0 / 3600

    i4 = int(code[8])

    lon = lon_ms3 + (i4 - 1) % 2 * dx
    lat = lat_ms3 + (i4 - 1) // 2 * dy

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def ms5_to_coord(code: str, ndigits: int = 6):
    """
    5次メッシュ（4分の1地域メッシュ）コードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string
        5次メッシュコード文字列．10桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    """
    code = str(code).ljust(10, "0")

    # 3次メッシュ換算した場合の南西端
    (lon_ms3, lat_ms3), _, _, _ = ms3_to_coord(code[0:8], ndigits=ndigits + 1)

    # 5次メッシュ格子幅(deg)
    dx = 11.25 / 3600
    dy = 7.5 / 3600

    i4 = int(code[8])
    i5 = int(code[9])

    lon = lon_ms3 + (i4 - 1) % 2 * 2 * dx + (i5 - 1) % 2 * dx * 2
    lat = lat_ms3 + (i4 - 1) // 2 * 2 * dy + (i5 - 1) // 2 * dy * 2

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def msjma5k_to_coord(code: str, ndigits: int = 6):
    """
    気象庁5kmメッシュコードから対応する格子の座標を求める．

    Parameters
    ----------
    code : string or int
        気象庁5kmメッシュコード文字列．8桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度

    Note
    ----
    気象庁データの5km相当格子は緯度間隔0.05度，0.0625度とされており，
    3次メッシュコード（基準地域メッシュ）を緯度方向に6倍，経度方向に5倍した格子で定義される．
    5km相当格子の南西端の3次メッシュコード値が気象庁5kmメッシュコード値になる．
    """
    code = str(code).ljust(8, "0")

    # 3次メッシュ換算した場合の南西端
    (lon_ms3, lat_ms3), _, _, _ = ms3_to_coord(code[0:8], ndigits=ndigits + 1)

    # JMA5kメッシュ格子幅(deg)
    dx = 0.0625
    dy = 0.05

    lon = lon_ms3
    lat = lat_ms3

    x1 = round(lon, ndigits)
    x2 = round(lon + dx, ndigits)
    y1 = round(lat, ndigits)
    y2 = round(lat + dy, ndigits)

    coord_sw = (x1, y1)
    coord_nw = (x1, y2)
    coord_ne = (x2, y2)
    coord_se = (x2, y1)

    return coord_sw, coord_nw, coord_ne, coord_se


def ms1_to_polygon(code: str, ndigits: int = 6):
    """
    1次メッシュコードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        1次メッシュコード文字列．4桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = ms1_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def ms2_to_polygon(code: str, ndigits: int = 6):
    """
    2次メッシュコードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        2次メッシュコード文字列．6桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = ms2_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def ms3_to_polygon(code: str, ndigits: int = 6):
    """
    3次メッシュコードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        3次メッシュコード文字列．8桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = ms3_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def ms4_to_polygon(code: str, ndigits: int = 6):
    """
    4次メッシュ（2分の1地域メッシュ）コードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        4次メッシュコード文字列．9桁未満の場合は計算時に右寄せでゼロ埋めする．
    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = ms4_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def ms5_to_polygon(code: str, ndigits: int = 6):
    """
    5次メッシュ（4分の1地域メッシュ）コードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        5次メッシュコード文字列．10桁未満の場合は計算時に右寄せでゼロ埋めする．

    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = ms5_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def msjma5k_to_polygon(code: str, ndigits: int = 6):
    """
    気象庁5kmメッシュコードから対応する対応する格子のポリゴンの座標を返す．

    Parameters
    ----------
    code : string or int
        気象庁5kmメッシュコード文字列．8桁未満の場合は計算時に右寄せでゼロ埋めする．

    ndigits : int, optional
        出力する小数の有効桁．デフォルトは6．

    Returns
    -------
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    coord_nw : tuple of float
        格子の北西端の経度, 緯度
    coord_ne : tuple of float
        格子の北東端の経度, 緯度
    coord_se : tuple of float
        格子の南東端の経度, 緯度
    coord_sw : tuple of float
        格子の南西端の経度, 緯度
    """
    coord_sw, coord_nw, coord_ne, coord_se = msjma5k_to_coord(code, ndigits=ndigits)
    return coord_sw, coord_nw, coord_ne, coord_se, coord_sw


def coord_to_ms3(lat: int | float, lon: int | float) -> str:
    """
    緯度・経度から3次メッシュコードを求める．

    Parameters
    ----------
    lat : int, float
        緯度
    lon : int, float
        経度

    Returns
    -------
    str
        3次メッシュコード
    """
    iy1 = math.floor(lat * 60.0 / 40.0)
    iy2 = math.floor(lat * 60.0 % 40.0 / 5)
    iy3 = math.floor(lat * 60.0 % 40.0 % 5 * 60 / 30)
    ix1 = math.floor(lon - 100)
    ix2 = math.floor((lon - 100 - ix1) * 60 / 7.5)
    ix3 = math.floor(((lon - 100 - ix1) * 60 % 7.5) * 60 / 45)

    return "{:02d}{:02d}{:d}{:d}{:d}{:d}".format(iy1, ix1, iy2, ix2, iy3, ix3)


def coord_to_msjma5k(lat: int | float, lon: int | float) -> str:
    """
    緯度・経度から気象庁5kmメッシュコードを求める．

    Parameters
    ----------
    lat : int, float
        緯度
    lon : int, float
        経度

    Returns
    -------
    str
        気象庁5kmメッシュコード
    """
    return ms3_to_msjma5k(coord_to_ms3(lat, lon))
