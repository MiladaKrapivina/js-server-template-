import os
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict
import math

@dataclass
class Obj:
    class_number: int
    x: float
    y: float
    w: float
    h: float
    confidence: float
    file: str
    n_file: int
    
    @property
    def s(self):
        return self.w * self.h

    @property
    def id(self):
        return f"{self.file}_{self.n_file}"

@dataclass
class ClassStats:
    class_num: int
    count: int
    max_c: float
    max_s: float
    avg_c: float
    avg_s: float
    total_s: float
    mean_x: float
    mean_y: float
    var_x: float
    var_y: float
    max_c_obj: Obj
    max_s_obj: Obj

def analyze_labels(labels_path: str) -> Dict:
    """
    Анализирует txt-файлы с метками и возвращает статистику
    Возвращает:
    {
        "total_objects": int,
        "classes": List[ClassStats],
        "global_stats": {
            "total_objects": int,
            "max_confidence": float,
            "total_coverage": float
        }
    }
    """
    # Получаем список txt-файлов
    txt_files = [f for f in os.listdir(labels_path) if f.endswith('.txt')]
    
    # Читаем все объекты
    all_objects = []
    for file in txt_files:
        with open(os.path.join(labels_path, file), 'r') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                parts = line.strip().split()
                obj = Obj(
                    class_number=int(parts[0]),
                    x=float(parts[1]),
                    y=float(parts[2]),
                    w=float(parts[3]),
                    h=float(parts[4]),
                    confidence=float(parts[5]),
                    file=file,
                    n_file=i
                )
                all_objects.append(obj)
    
    # Группируем объекты по классам
    classes = {}
    for obj in all_objects:
        if obj.class_number not in classes:
            classes[obj.class_number] = []
        classes[obj.class_number].append(obj)
    
    # Анализируем каждый класс
    class_stats = []
    for class_num, objs in classes.items():
        if len(objs) == 0:
            continue
        
        # Основные метрики
        count = len(objs)
        confidences = [o.confidence for o in objs]
        areas = [o.s for o in objs]
        x_coords = [o.x for o in objs]
        y_coords = [o.y for o in objs]
        
        # Расчет статистики
        max_c = max(confidences)
        max_s = max(areas)
        avg_c = sum(confidences) / count
        avg_s = sum(areas) / count
        total_s = sum(areas)
        
        # Центр масс
        mean_x = sum(x_coords) / count
        mean_y = sum(y_coords) / count
        
        # Дисперсия
        var_x = sum((x - mean_x)**2 for x in x_coords) / count
        var_y = sum((y - mean_y)**2 for y in y_coords) / count
        
        # Объекты с максимальными значениями
        max_c_obj = max(objs, key=lambda o: o.confidence)
        max_s_obj = max(objs, key=lambda o: o.s)
        
        class_stats.append(ClassStats(
            class_num=class_num,
            count=count,
            max_c=max_c,
            max_s=max_s,
            avg_c=avg_c,
            avg_s=avg_s,
            total_s=total_s,
            mean_x=mean_x,
            mean_y=mean_y,
            var_x=var_x,
            var_y=var_y,
            max_c_obj=max_c_obj,
            max_s_obj=max_s_obj
        ))
    
    # Глобальная статистика
    global_stats = {
        "total_objects": len(all_objects),
        "max_confidence": max(o.confidence for o in all_objects) if all_objects else 0,
        "total_coverage": sum(o.s for o in all_objects) if all_objects else 0
    }
    
    return {
        "total_objects": len(all_objects),
        "classes": class_stats,
        "global_stats": global_stats
    }

# Пример использования
if __name__ == "__main__":
    result = analyze_labels()
    print(result)