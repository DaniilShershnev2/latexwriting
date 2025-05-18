/* canvas.js */

// Функции для работы с холстом и рисованием
class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.paths = [];
        this.currentPath = [];
        
        this.initializeCanvas();
        this.setupEventListeners();
    }
    
    initializeCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.offsetWidth;
            this.canvas.height = container.offsetHeight;
            this.redraw();
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        // Обработчики для мыши
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Обработчики для сенсорных устройств
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e);
        });
        
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    }
    
    getCoordinates(e) {
        let offsetX, offsetY;
        
        if (e.type.includes('touch')) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0] || e.changedTouches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
        } else {
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        }
        
        return { offsetX, offsetY };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const { offsetX, offsetY } = this.getCoordinates(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(offsetX, offsetY);
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000';
        
        this.currentPath = [{ x: offsetX, y: offsetY }];
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const { offsetX, offsetY } = this.getCoordinates(e);
        
        this.ctx.lineTo(offsetX, offsetY);
        this.ctx.stroke();
        
        this.currentPath.push({ x: offsetX, y: offsetY });
    }
    
    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.ctx.closePath();
        
        if (this.currentPath.length > 1) {
            this.paths.push([...this.currentPath]);
        }
        this.currentPath = [];
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paths = [];
        this.currentPath = [];
    }
    
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка всех сохраненных путей
        this.paths.forEach(path => {
            if (path.length < 2) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);
            
            for (let i = 1; i < path.length; i++) {
                this.ctx.lineTo(path[i].x, path[i].y);
            }
            
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = '#000';
            this.ctx.stroke();
        });
    }
    
    addSymbol(symbol) {
        const fontSize = 24;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Определяем позицию для вставки
        let posX, posY;
        
        if (this.paths.length > 0) {
            // Находим последнюю точку последнего пути
            const lastPath = this.paths[this.paths.length - 1];
            if (lastPath && lastPath.length > 0) {
                const lastPoint = lastPath[lastPath.length - 1];
                posX = lastPoint.x + 20;
                posY = lastPoint.y;
            } else {
                posX = centerX;
                posY = centerY;
            }
        } else {
            posX = centerX;
            posY = centerY;
        }
        
        // Рисуем символ
        this.ctx.font = `${fontSize}px serif`;
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, posX, posY);
        
        // Создаем путь для символа для отслеживания
        const symbolPath = [
            { x: posX - fontSize/2, y: posY - fontSize/2 },
            { x: posX + fontSize/2, y: posY - fontSize/2 },
            { x: posX + fontSize/2, y: posY + fontSize/2 },
            { x: posX - fontSize/2, y: posY + fontSize/2 },
            { x: posX - fontSize/2, y: posY - fontSize/2 }
        ];
        
        this.paths.push(symbolPath);
    }
    
    // Получение данных о рисунке для анализа
    getDrawingData() {
        return {
            paths: this.paths,
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            imageData: this.canvas.toDataURL('image/png')
        };
    }
}
