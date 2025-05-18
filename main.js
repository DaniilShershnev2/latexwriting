/* main.js */

// Главный файл приложения, объединяющий все компоненты
document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const recognizeButton = document.getElementById('recognizeButton');
    const clearButton = document.getElementById('clearButton');
    const copyButton = document.getElementById('copyButton');
    const resultContainer = document.getElementById('result-container');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorMessage = document.getElementById('errorMessage');
    const textModeButton = document.getElementById('textMode');
    const formulaModeButton = document.getElementById('formulaMode');
    
    // Инициализация холста для рисования
    const drawingCanvas = new DrawingCanvas('drawingCanvas');
    
    // Инициализация распознавателя
    const recognizer = new HandwritingRecognizer();
    
    // Обработка MathJax
    function safeTypesetMathJax() {
        if (window.MathJax && typeof window.MathJax.typeset === 'function') {
            try {
                window.MathJax.typeset();
            } catch (error) {
                console.error('Ошибка при обработке MathJax:', error);
                showError('Ошибка при отображении формулы');
            }
        } else {
            console.log('MathJax не найден. Пробуем позже...');
            setTimeout(() => {
                if (window.MathJax && typeof window.MathJax.typeset === 'function') {
                    try {
                        window.MathJax.typeset();
                    } catch (error) {
                        showError('Ошибка при отображении формулы');
                    }
                }
            }, 1000);
        }
    }
    
    // Показать сообщение об ошибке
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    }
    
    // Переключение между режимами текст/формула
    function switchMode(mode) {
        recognizer.setMode(mode);
        
        if (mode === 'text') {
            textModeButton.classList.add('active');
            formulaModeButton.classList.remove('active');
            resultContainer.classList.remove('formula');
        } else {
            textModeButton.classList.remove('active');
            formulaModeButton.classList.add('active');
            resultContainer.classList.add('formula');
        }
    }
    
    // Обработка события распознавания
    async function handleRecognition() {
        if (drawingCanvas.paths.length === 0) {
            showError('Пожалуйста, нарисуйте что-нибудь перед распознаванием.');
            return;
        }
        
        // Показываем индикатор загрузки
        loadingOverlay.style.display = 'flex';
        
        try {
            // Получаем данные о рисунке
            const drawingData = drawingCanvas.getDrawingData();
            
            // Распознаем рукописный ввод
            const result = await recognizer.recognize(drawingData);
            
            // Обновляем отображение результата
            updateResult(result);
        } catch (error) {
            console.error('Ошибка при распознавании:', error);
            showError('Произошла ошибка при распознавании: ' + error.message);
        } finally {
            // Скрываем индикатор загрузки
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Обновление отображения результата
    function updateResult(result) {
        if (!result) {
            resultContainer.innerHTML = '<p>Не удалось распознать рукописный ввод.</p>';
            return;
        }
        
        if (recognizer.getMode() === 'text') {
            // Для текстового режима просто отображаем текст
            resultContainer.innerHTML = result;
        } else {
            // Для формульного режима отображаем LaTeX с MathJax
            resultContainer.innerHTML = `<div>$$${result}$$</div>`;
            
            // Запускаем рендеринг MathJax
            safeTypesetMathJax();
        }
    }
    
    // Копирование результата
    function copyResult() {
        const text = resultContainer.innerText;
        
        if (!text || text.trim() === '') {
            showError('Нет результата для копирования.');
            return;
        }
        
        // Создаем временный элемент для копирования
        const tempElement = document.createElement('textarea');
        tempElement.value = text;
        document.body.appendChild(tempElement);
        tempElement.select();
        document.execCommand('copy');
        document.body.removeChild(tempElement);
        
        // Визуальная обратная связь
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Скопировано!</span>
        `;
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }
    
    // Настройка обработчиков событий для символов
    function setupSymbolButtons() {
        document.querySelectorAll('.math-symbol').forEach(element => {
            element.addEventListener('click', () => {
                const symbol = element.getAttribute('data-symbol');
                drawingCanvas.addSymbol(symbol);
            });
        });
    }
    
    // Инициализация приложения
    function init() {
        // Настройка обработчиков событий
        recognizeButton.addEventListener('click', handleRecognition);
        clearButton.addEventListener('click', () => {
            drawingCanvas.clear();
            resultContainer.innerHTML = '<p>Здесь появится результат распознавания.</p>';
        });
        copyButton.addEventListener('click', copyResult);
        
        // Настройка переключения режимов
        textModeButton.addEventListener('click', () => switchMode('text'));
        formulaModeButton.addEventListener('click', () => switchMode('formula'));
        
        // Настройка кнопок символов
        setupSymbolButtons();
        
        // Устанавливаем начальный режим
        switchMode('text');
    }
    
    // Запуск инициализации
    init();
});
