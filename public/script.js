// функция для получения содержимого страницы
async function fetchContent() {
    const url = document.getElementById('urlInput').value;
    const format = document.getElementById('formatSelect').value;

    if (!url) {
        alert('Введите URL');
        return;
    }

    try {
        const response = await fetch(`/scrape?url=${encodeURIComponent(url)}&format=${format}`);
        const text = await response.text();
        document.getElementById('resultFrame').srcdoc = text;
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}
// функции для скачивания файлов
function downloadFile() {
    window.location.href = '/download';
}

function downloadPDF() {
    window.location.href = '/pdf';
}