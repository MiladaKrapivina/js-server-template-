const { exec } = require('child_process');

const pythonPath = 'D:/repos/content/project/api/yolov5_environment/Scripts/python.exe';
const scriptPath = 'D:/repos/content/project/api/yolov5/imagedetect.py';

let metricsPromiseResolve;
const metricsPromise = new Promise((resolve) => {
    metricsPromiseResolve = resolve;
});

function getMetrics() {
    return metricsPromise;
}


const command = `"${pythonPath}" "${scriptPath}"`;

let stdoutBuffer = '';

const process = exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Ошибка выполнения: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }
    console.log(`Результат: ${stdout}`);
});

process.stdout.on('data', (data) => {
    const dataStr = data.toString();
    console.log(dataStr); // Логирование вывода
    stdoutBuffer += dataStr;

    // Поиск объекта в буфере
    const startIdx = stdoutBuffer.indexOf('{');
    const endIdx = stdoutBuffer.lastIndexOf('}');

    if (startIdx !== -1 && endIdx > startIdx) {
        const potentialObj = stdoutBuffer.slice(startIdx, endIdx + 1);
        try {
            // Замена кавычек и парсинг
            const jsonStr = potentialObj.replace(/'/g, '"');
            const metrics = JSON.parse(jsonStr);
            metricsPromiseResolve(metrics); // Разрешаем промис
            stdoutBuffer = '';
        } catch (e) {
            // Ошибка парсинга (неполные данные)
        }
    }
});

process.stderr.on('data', (data) => {
    console.error(data.toString());
});

module.exports = { getMetrics };