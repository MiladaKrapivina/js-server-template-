import os
from pathlib import Path
from typing import Union, Dict
from detect import run
from metrics import analyze_labels

def process_input(input_path: str, output_project: str = "results") -> Union[bool, Dict[str, float]]:
    """
    Анализирует изображения и видео через YOLO, возвращает метрики или False если объектов нет.
    
    Параметры:
        input_path (str): Путь к папке с изображениями/видео
        output_project (str): Папка для сохранения результатов
    
    Возвращает:
        dict или False: Словарь с метриками или False если объектов нет
    """
    # Запуск детекции
    run(
        weights= "D:/repos/content/project/api/yolov5/weights/warn150322_last.pt", # type: ignore
        source=input_path,
        conf_thres=0.3,
        project=output_project,
        name="detection",
        save_txt=True,
        save_conf=True,
        line_thickness=5,
        exist_ok=True
    )

    # Путь к лейблам
    labels_dir = Path(output_project) / "detection" / "labels"
    
    # Проверка наличия объектов
    if not labels_dir.exists():
        return False
    
    stats = analyze_labels(str(labels_dir))
    
    if stats["global_stats"]["total_objects"] == 0:
        return False

    classes = stats["classes"]
    if not classes:
        return False

    # Расчет метрик
    total_objects = stats["global_stats"]["total_objects"]
    
    return {
        "Smax": max(c.max_s for c in classes),
        "Scom": stats["global_stats"]["total_coverage"],
        "Savg": stats["global_stats"]["total_coverage"] / total_objects,
        "Dx": sum(c.var_x for c in classes) / len(classes),
        "Dy": sum(c.var_y for c in classes) / len(classes),
        "Cmax": max(c.max_c for c in classes),
        "Cavg": sum(c.avg_c * c.count for c in classes) / total_objects,
        "n": total_objects
    }

# Пример использования
if __name__ == "__main__":
    result = process_input("data/images")
    print(result if result else "Объекты не обнаружены")