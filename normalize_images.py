#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скачивает все фото товаров из products.json, обрезает лишние белые поля
вокруг предмета и пересохраняет каждое фото в единый размер 1200x1800
(портретный формат, белый фон, товар по центру, пропорции не искажаются).

Запуск:
    pip install pillow requests
    python normalize_images.py

Нужно запускать из папки проекта (там, где лежат products.json и style.css).
Результат: папка images/normalized/ с готовыми фото + файл
image_url_map.json (соответствие "старый URL -> новый локальный путь"),
который используется следующим шагом для обновления products.json.
"""

import json
import os
import sys
import time
import hashlib
from io import BytesIO

try:
    import requests
    from PIL import Image, ImageChops
except ImportError:
    print("Нужны библиотеки: pip install pillow requests")
    sys.exit(1)

TARGET_W, TARGET_H = 1200, 1800
OUT_DIR = "images/normalized"
MAP_FILE = "image_url_map.json"
PRODUCTS_FILE = "products.json"
WHITE_THRESHOLD = 248  # порог "почти белого" для обрезки полей
PADDING_RATIO = 0.04   # небольшой отступ вокруг предмета после обрезки

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Referer": "https://chastorg.ru/",
}


MIN_BBOX_AREA_RATIO = 0.35  # если "непустая" область меньше этой доли всего фото —
                             # похоже на ложное срабатывание (например, на фото с не
                             # белым/тонированным фоном обрезка цепляется только за блик
                             # или деталь) — в этом случае обрезку не делаем вовсе


def trim_whitespace(im: Image.Image) -> Image.Image:
    """Обрезает поля, где пиксели почти белые, оставляя сам предмет.
    Если найденная область подозрительно маленькая относительно всего кадра —
    считаем результат ненадёжным и возвращаем фото без обрезки (безопаснее,
    чем рисковать чудовищным зумом на деталь)."""
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg)
    # усиливаем разницу, чтобы отсечь именно "почти белое", а не любые светлые тона предмета
    gray = diff.convert("L")
    bbox = gray.point(lambda p: 255 if p > (255 - WHITE_THRESHOLD) else 0).getbbox()
    if not bbox:
        return im

    bbox_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
    full_area = im.width * im.height
    if full_area and (bbox_area / full_area) < MIN_BBOX_AREA_RATIO:
        return im  # похоже на ложное срабатывание — не обрезаем

    return im.crop(bbox)


def normalize_to_canvas(im: Image.Image, w=TARGET_W, h=TARGET_H) -> Image.Image:
    """Обрезает пустые белые поля, затем растягивает/докадрирует результат
    так, чтобы он ПОЛНОСТЬЮ заполнял холст w x h (как CSS object-fit:cover) —
    без белой подложки. Так на фото с нестандартным (не белым) фоном не
    появляется "рамка в рамке": либо реальное фото, либо ничего лишнего."""
    im = im.convert("RGB")
    trimmed = trim_whitespace(im)

    # небольшой запас вокруг предмета перед докадрированием
    pad_w = int(trimmed.width * PADDING_RATIO)
    pad_h = int(trimmed.height * PADDING_RATIO)
    expanded = Image.new("RGB", (trimmed.width + pad_w * 2, trimmed.height + pad_h * 2), (255, 255, 255))
    expanded.paste(trimmed, (pad_w, pad_h))

    # масштаб "cover": увеличиваем меньшую сторону до целевого соотношения,
    # затем обрезаем излишек по центру — холст заполняется полностью
    scale = max(w / expanded.width, h / expanded.height)
    new_w = max(w, int(round(expanded.width * scale)))
    new_h = max(h, int(round(expanded.height * scale)))
    resized = expanded.resize((new_w, new_h), Image.LANCZOS)

    x = (new_w - w) // 2
    y = (new_h - h) // 2
    return resized.crop((x, y, x + w, y + h))


def url_to_filename(url: str) -> str:
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    base = os.path.basename(url.split("?")[0])
    name, _ = os.path.splitext(base)
    return f"{name}-{h}.jpg"


def main():
    if not os.path.exists(PRODUCTS_FILE):
        print(f"Не найден {PRODUCTS_FILE} — запускайте скрипт из папки проекта.")
        sys.exit(1)

    with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)

    urls = set()
    for p in products:
        if p.get("image"):
            urls.add(p["image"])
        for u in p.get("images") or []:
            urls.add(u)

    urls = sorted(urls)
    print(f"Найдено уникальных фото: {len(urls)}")

    os.makedirs(OUT_DIR, exist_ok=True)

    url_map = {}
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, "r", encoding="utf-8") as f:
            url_map = json.load(f)

    session = requests.Session()
    session.headers.update(HEADERS)

    ok, failed = 0, []
    for i, url in enumerate(urls, 1):
        if url in url_map and os.path.exists(url_map[url]):
            continue  # уже обработано в прошлый запуск — можно перезапускать скрипт при обрыве
        out_name = url_to_filename(url)
        out_path = os.path.join(OUT_DIR, out_name)
        try:
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            im = Image.open(BytesIO(resp.content))
            result = normalize_to_canvas(im)
            result.save(out_path, "JPEG", quality=90)
            url_map[url] = out_path.replace(os.sep, "/")
            ok += 1
            if i % 20 == 0:
                print(f"  ...{i}/{len(urls)}")
                with open(MAP_FILE, "w", encoding="utf-8") as f:
                    json.dump(url_map, f, ensure_ascii=False, indent=2)
        except Exception as e:
            failed.append((url, str(e)))
            print(f"  ОШИБКА: {url} -> {e}")
        time.sleep(0.05)  # не долбим сервер слишком часто

    with open(MAP_FILE, "w", encoding="utf-8") as f:
        json.dump(url_map, f, ensure_ascii=False, indent=2)

    print(f"\nГотово: {ok} новых фото обработано, всего в карте {len(url_map)}.")
    if failed:
        print(f"Не удалось скачать {len(failed)} фото:")
        for url, err in failed[:20]:
            print(f"  - {url}: {err}")
        if len(failed) > 20:
            print(f"  ...и ещё {len(failed) - 20}")
    print(f"\nКарта соответствий сохранена в {MAP_FILE} — пришлите этот файл,")
    print("и я обновлю products.json, чтобы сайт использовал локальные фото.")


if __name__ == "__main__":
    main()
