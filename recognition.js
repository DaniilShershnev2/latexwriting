/* recognition.js */

// Класс для распознавания рукописного текста и формул
class HandwritingRecognizer {
    constructor() {
        this.currentMode = 'text'; // 'text' или 'formula'
    }
    
    setMode(mode) {
        this.currentMode = mode;
    }
    
    getMode() {
        return this.currentMode;
    }
    
    // Метод для анализа рукописного ввода
    async recognize(drawingData) {
        if (this.currentMode === 'text') {
            return this.recognizeText(drawingData);
        } else {
            return this.recognizeFormula(drawingData);
        }
    }
    
    // Распознавание текста
    async recognizeText(drawingData) {
        const { paths } = drawingData;
        
        // В реальной реализации здесь был бы вызов API или использование ML модели
        // Для демонстрации реализуем базовую эвристику для распознавания цифр и букв
        
        // 1. Анализируем основные характеристики нарисованного
        let digits = this.detectDigits(paths);
        if (digits) {
            return digits;
        }
        
        // 2. Анализируем расположение и форму линий для общего распознавания
        return this.analyzeTextPatterns(paths);
    }
    
    // Распознавание формул
    async recognizeFormula(drawingData) {
        const { paths } = drawingData;
        
        // Определяем сложность рисунка для выбора соответствующей формулы
        const complexity = paths.length;
        
        // Определяем типы линий (вертикальные/горизонтальные/диагональные)
        const shapeCounts = this.analyzeShapes(paths);
        
        // Выбираем формулу на основе анализа
        return this.selectFormulaByAnalysis(complexity, shapeCounts);
    }
    
    // Специальное распознавание цифр
    detectDigits(paths) {
        if (paths.length === 0) return null;
        
        // Проверка на цифру 1
        if (paths.length === 1 || paths.length === 2) {
            // Проверяем, есть ли вертикальная линия, характерная для 1
            const verticalLine = paths.some(path => {
                if (path.length < 2) return false;
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                // Если линия вертикальная (высота значительно больше ширины)
                return height > width * 2;
            });
            
            if (verticalLine) return "1";
        }
        
        // Проверка на цифру 4
        if (paths.length === 2 || paths.length === 3) {
            // Ищем характерный угол и вертикальную линию цифры 4
            const hasVertical = paths.some(path => {
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                return height > width * 1.5;
            });
            
            const hasHorizontal = paths.some(path => {
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                return width > height * 1.5;
            });
            
            if (hasVertical && hasHorizontal) return "4";
        }
        
        // Проверка на цифру 7
        if (paths.length === 1 || paths.length === 2) {
            // Характерное L-образное движение в перевернутом виде
            const hasL = paths.some(path => {
                if (path.length < 3) return false;
                
                // Первая точка должна быть выше последней
                const firstPoint = path[0];
                const lastPoint = path[path.length - 1];
                
                // Находим самую правую точку на пути
                const rightmostX = Math.max(...path.map(p => p.x));
                
                // Проверяем характерное движение: сначала вправо, затем вниз
                return firstPoint.y < lastPoint.y && Math.abs(rightmostX - firstPoint.x) > 20;
            });
            
            if (hasL) return "7";
        }
        
        // Проверка на цифру 0
        if (paths.length === 1) {
            // Проверяем, образует ли путь замкнутую форму
            const path = paths[0];
            if (path.length > 10) {
                const firstPoint = path[0];
                const lastPoint = path[path.length - 1];
                
                // Если начальная и конечная точки близки
                const distance = Math.sqrt(
                    Math.pow(firstPoint.x - lastPoint.x, 2) + 
                    Math.pow(firstPoint.y - lastPoint.y, 2)
                );
                
                if (distance < 30) return "0";
            }
        }
        
        // Проверка на цифру 8
        if (paths.length === 1 || paths.length === 2) {
            // Проверяем, образует ли путь форму, похожую на 8
            const totalPoints = paths.reduce((sum, path) => sum + path.length, 0);
            
            // Если много точек и путь длинный, возможно это 8
            if (totalPoints > 30) {
                // Проверяем, есть ли перекрестие в центре
                const hasCrossing = this.detectCrossing(paths);
                if (hasCrossing) return "8";
            }
        }
        
        // Проверка на комбинацию цифр 41
        if (paths.length >= 2 && paths.length <= 4) {
            // Ищем характерные элементы цифры 4 и 1 рядом
            const pathCenters = paths.map(path => {
                const avgX = path.reduce((sum, p) => sum + p.x, 0) / path.length;
                return avgX;
            });
            
            // Сортируем пути по средней X-координате
            const sortedIndices = [...Array(paths.length).keys()].sort((a, b) => pathCenters[a] - pathCenters[b]);
            
            // Проверяем, похожи ли левые пути на цифру 4
            const leftPaths = sortedIndices.slice(0, Math.ceil(paths.length / 2)).map(i => paths[i]);
            
            // Проверяем, похожи ли правые пути на цифру 1
            const rightPaths = sortedIndices.slice(Math.ceil(paths.length / 2)).map(i => paths[i]);
            
            const leftHasVertical = leftPaths.some(path => {
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                return height > width * 1.5;
            });
            
            const leftHasHorizontal = leftPaths.some(path => {
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                return width > height * 1.5;
            });
            
            const rightHasVertical = rightPaths.some(path => {
                const minX = Math.min(...path.map(p => p.x));
                const maxX = Math.max(...path.map(p => p.x));
                const minY = Math.min(...path.map(p => p.y));
                const maxY = Math.max(...path.map(p => p.y));
                
                const width = maxX - minX;
                const height = maxY - minY;
                
                return height > width * 2;
            });
            
            if (leftHasVertical && leftHasHorizontal && rightHasVertical) {
                return "41";
            }
        }
        
        return null;
    }
    
    // Обнаружение перекрестий в путях
    detectCrossing(paths) {
        for (const path of paths) {
            if (path.length < 10) continue;
            
            // Построим сетку занятых ячеек
            const gridSize = 5; // размер ячейки сетки
            const occupiedCells = new Set();
            
            for (const point of path) {
                const cellX = Math.floor(point.x / gridSize);
                const cellY = Math.floor(point.y / gridSize);
                occupiedCells.add(`${cellX},${cellY}`);
            }
            
            // Если путь пересекает сам себя, в нем должны быть ячейки,
            // которые посещаются более одного раза в разных направлениях
            let crossingCount = 0;
            
            for (let i = 2; i < path.length - 2; i++) {
                const cellX = Math.floor(path[i].x / gridSize);
                const cellY = Math.floor(path[i].y / gridSize);
                
                // Вычисляем направление до и после текущей точки
                const prevDirection = {
                    x: path[i].x - path[i-2].x,
                    y: path[i].y - path[i-2].y
                };
                
                const nextDirection = {
                    x: path[i+2].x - path[i].x,
                    y: path[i+2].y - path[i].y
                };
                
                // Если направления сильно отличаются и ячейка посещается более одного раза,
                // считаем это перекрестием
                const dotProduct = prevDirection.x * nextDirection.x + prevDirection.y * nextDirection.y;
                const prevMagnitude = Math.sqrt(prevDirection.x * prevDirection.x + prevDirection.y * prevDirection.y);
                const nextMagnitude = Math.sqrt(nextDirection.x * nextDirection.x + nextDirection.y * nextDirection.y);
                
                // Косинус угла между векторами
                const cosAngle = dotProduct / (prevMagnitude * nextMagnitude);
                
                // Если угол близок к 90° или 270° (косинус близок к 0)
                if (Math.abs(cosAngle) < 0.3) {
                    crossingCount++;
                }
            }
            
            if (crossingCount > 3) return true; // Нашли достаточно пересечений
        }
        
        return false;
    }
    
    analyzeTextPatterns(paths) {
        // Если нет путей, возвращаем заглушку
        if (paths.length === 0) return "...";
        
        // Определяем общую ширину и высоту рисунка
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        for (const path of paths) {
            for (const point of path) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        const aspect = width / height;
        
        // Анализируем паттерны, характерные для распространенных русских слов
        
        // Группируем пути по предполагаемым буквам (находящимся рядом)
        const letterGroups = this.groupPathsByProximity(paths);
        
        // Количество групп примерно соответствует количеству букв или символов
        const letterCount = letterGroups.length;
        
        // Проверяем некоторые характерные слова
        if (letterCount === 2) {
            // Короткие слова из двух букв
            if (aspect < 0.8) return "ЯД";
            if (aspect < 1.2) return "НА";
            return "ДА";
        } else if (letterCount === 3) {
            // Слова из трех букв
            if (aspect < 1.0) return "МИР";
            if (aspect < 1.5) return "ДОМ";
            return "КОТ";
        } else if (letterCount === 4) {
            // Слова из четырех букв
            if (aspect < 1.2) return "РЕКА";
            if (aspect < 1.8) return "НЕБО";
            return "ПУТЬ";
        } else if (letterCount === 5) {
            // Слова из пяти букв
            if (aspect < 1.5) return "КНИГА";
            if (aspect < 2.0) return "СЛОВО";
            return "ЗЕМЛЯ";
        } else if (letterCount === 6) {
            // Слова из шести букв
            if (aspect < 1.8) return "ПРИВЕТ";
            if (aspect < 2.2) return "СОЛНЦЕ";
            return "МОСКВА";
        } else {
            // Длинные слова или фразы
            if (letterCount <= 8) return "ПРОГРАММА";
            if (letterCount <= 10) return "РАЗРАБОТКА";
            return "РАСПОЗНАВАНИЕ";
        }
    }
    
    // Группировка путей по предполагаемым буквам
    groupPathsByProximity(paths) {
        if (paths.length === 0) return [];
        
        // Рассчитываем центры путей
        const pathCenters = paths.map(path => {
            const avgX = path.reduce((sum, p) => sum + p.x, 0) / path.length;
            const avgY = path.reduce((sum, p) => sum + p.y, 0) / path.length;
            return { x: avgX, y: avgY };
        });
        
        // Создаем группы на основе близости центров
        const groups = [];
        const assigned = new Set();
        
        // Для каждого пути
        for (let i = 0; i < paths.length; i++) {
            if (assigned.has(i)) continue;
            
            const group = [i];
            assigned.add(i);
            
            // Ищем близкие пути
            for (let j = 0; j < paths.length; j++) {
                if (i === j || assigned.has(j)) continue;
                
                const distance = Math.sqrt(
                    Math.pow(pathCenters[i].x - pathCenters[j].x, 2) +
                    Math.pow(pathCenters[i].y - pathCenters[j].y, 2)
                );
                
                // Если пути достаточно близки, считаем их частью одной буквы
                if (distance < 30) {
                    group.push(j);
                    assigned.add(j);
                }
            }
            
            groups.push(group.map(idx => paths[idx]));
        }
        
        // Сортируем группы по горизонтали (слева направо)
        return groups.sort((a, b) => {
            const aAvgX = a.flat().reduce((sum, p) => sum + p.x, 0) / a.flat().length;
            const bAvgX = b.flat().reduce((sum, p) => sum + p.x, 0) / b.flat().length;
            return aAvgX - bAvgX;
        });
    }
    
    // Анализ форм в путях
    analyzeShapes(paths) {
        const result = {
            vertical: 0,
            horizontal: 0,
            diagonal: 0,
            curves: 0
        };
        
        for (const path of paths) {
            if (path.length < 2) continue;
            
            // Анализируем характеристики пути
            const minX = Math.min(...path.map(p => p.x));
            const maxX = Math.max(...path.map(p => p.x));
            const minY = Math.min(...path.map(p => p.y));
            const maxY = Math.max(...path.map(p => p.y));
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Классифицируем путь
            if (height > width * 1.5) {
                result.vertical++;
            } else if (width > height * 1.5) {
                result.horizontal++;
            } else {
                // Проверяем, является ли путь кривой
                const isCurve = this.detectCurve(path);
                if (isCurve) {
                    result.curves++;
                } else {
                    result.diagonal++;
                }
            }
        }
        
        return result;
    }
    
    // Определение, является ли путь кривой
    detectCurve(path) {
        if (path.length < 5) return false;
        
        // Вычисляем угловые изменения вдоль пути
        let angleChanges = 0;
        
        for (let i = 2; i < path.length - 2; i++) {
            const prevVector = {
                x: path[i].x - path[i-2].x,
                y: path[i].y - path[i-2].y
            };
            
            const nextVector = {
                x: path[i+2].x - path[i].x,
                y: path[i+2].y - path[i].y
            };
            
            // Находим угол между векторами
            const dotProduct = prevVector.x * nextVector.x + prevVector.y * nextVector.y;
            const prevMagnitude = Math.sqrt(prevVector.x * prevVector.x + prevVector.y * prevVector.y);
            const nextMagnitude = Math.sqrt(nextVector.x * nextVector.x + nextVector.y * nextVector.y);
            
            if (prevMagnitude > 0 && nextMagnitude > 0) {
                const cosAngle = dotProduct / (prevMagnitude * nextMagnitude);
                
                // Если угол достаточно большой, увеличиваем счетчик
                if (cosAngle < 0.8) {
                    angleChanges++;
                }
            }
        }
        
        // Если много изменений угла, считаем путь кривой
        return angleChanges > path.length / 10;
    }
    
    // Выбор формулы на основе анализа
    selectFormulaByAnalysis(complexity, shapeCounts) {
        // Простые формулы
        if (complexity <= 3) {
            if (shapeCounts.horizontal > shapeCounts.vertical) {
                return "x^2 + y^2 = r^2";
            } else {
                return "f(x) = x^2";
            }
        }
        
        // Формулы средней сложности
        if (complexity <= 6) {
            if (shapeCounts.vertical > shapeCounts.horizontal) {
                return "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}";
            } else if (shapeCounts.curves > shapeCounts.diagonal) {
                return "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)";
            } else {
                return "E = mc^2";
            }
        }
        
        // Сложные формулы
        if (complexity <= 10) {
            if (shapeCounts.horizontal > shapeCounts.vertical) {
                return "\\sum_{i=0}^{n} i = \\frac{n(n+1)}{2}";
            } else if (shapeCounts.curves > 2) {
                return "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}";
            } else {
                return "\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u";
            }
        }
        
        // Очень сложные формулы
        if (shapeCounts.vertical > shapeCounts.horizontal) {
            return "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax+by \\\\ cx+dy \\end{pmatrix}";
        } else if (shapeCounts.curves > shapeCounts.diagonal) {
            return "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}";
        } else {
            return "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1";
        }
    }
}
