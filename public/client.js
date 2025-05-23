document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('analyzeBtn').addEventListener('click', analyze);
});


const analyze = () => {
    const url = document.getElementById('url').value;
    if (!url) {
        alert('Please enter URL');
        return;
    }

    const soapRequest = `
        <?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                          xmlns:tns="http://example.com/analyzer">
            <soapenv:Header/>
            <soapenv:Body>
                <analyzeUrlRequest>
                    <url>${escapeXml(url)}</url>
                </analyzeUrlRequest>
            </soapenv:Body>
        </soapenv:Envelope>
    `;

    fetch('/wsdl', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'SOAPAction': 'analyzeUrl'
        },
        body: soapRequest
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
    })
    .then(xml => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        checkForSoapErrors(doc);
        displayResults(doc);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    });
};

const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch(c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

const checkForSoapErrors = (doc) => {
    const error = doc.getElementsByTagName('soap:Fault');
    if (error.length > 0) throw new Error(error[0].textContent);
};

const parseMetric = (doc, metricName, fields) => {
    const ns = 'http://example.com/analyzer';
    try {
        const xpathResult = doc.evaluate(
            `//*[local-name()='${metricName}']`,
            doc,
            null,
            XPathResult.ANY_TYPE,
            null
        );
        const metric = xpathResult.iterateNext();
        if (!metric) throw new Error('Element not found');

        const result = {};
        
        fields.forEach(field => {
            const elements = metric.getElementsByTagName(field);
            result[field] = elements.length > 0 
                ? parseFloat(elements[0].textContent).toFixed(2) 
                : '0.00';
        });

        // Получаем уровень
        const levelElements = metric.getElementsByTagName('level');
        result.level = levelElements.length > 0 
            ? levelElements[0].textContent.toLowerCase() 
            : 'none';

        return result;
    } catch (error) {
        console.error(`Error parsing ${metricName}:`, error);
        return { level: 'none' };
    }
};

const createMetricBlock = (title, values, level) => {
    const div = document.createElement('div');
    div.className = `metric ${level}`;
    
    // Left section - Values
    const valuesDiv = document.createElement('div');
    valuesDiv.className = 'values';
    valuesDiv.innerHTML = `<h3>${title}</h3>`;
    
    Object.entries(values).forEach(([key, value]) => {
        if(key === 'level') return;
        const row = document.createElement('div');
        row.className = 'metric-row';
        row.innerHTML = `<span>${key}:</span><span>${Number(value).toFixed(2)}</span>`;
        valuesDiv.appendChild(row);
    });

    // Right section - Level
    const levelDiv = document.createElement('div');
    levelDiv.className = 'level';
    levelDiv.innerHTML = `
        <div class="level-inner">
            <h2>${title.split(' ')[1]}</h2>
            <div class="status">${level}</div>
        </div>
    `;

    div.appendChild(valuesDiv);
    div.appendChild(levelDiv);
    return div;
};

const createFinalMetricBlock = (title, level) => {
    const div = document.createElement('div');
    div.className = 'final-metric'; // Используем новый класс для стилей
    
    const content = document.createElement('div');
    content.className = 'final-content';
    content.innerHTML = `
        <h2>${title}</h2>
        <div class="final-level ${level}">
            <h2>${level.toUpperCase()}</h2>
        </div>
    `;

    div.appendChild(content);
    return div;
};

const displayResults = (doc) => {
    const results = document.getElementById('results');
    results.innerHTML = '';

    try {
        const imageData = parseMetric(doc, 'Score_image', ['s1','s2','s3','s4','s5','s6','s7']);
        const textData = parseMetric(doc, 'Score_text', ['m1','m2','m3','m4']);
        const postData = parseMetric(doc, 'Score_post', ['p1','p2','p3']);
        const finalData = parseMetric(doc, 'Score_final', []);

        results.appendChild(createMetricBlock('Score Image', imageData, imageData.level));
        results.appendChild(createMetricBlock('Score Text', textData, textData.level));
        results.appendChild(createMetricBlock('Score Post', postData, postData.level));

        results.appendChild(createFinalMetricBlock('Final Score', finalData.level || 'none'));

    } catch (error) {
        console.error('Display error:', error);
        alert('Error displaying results: ' + error.message);
    }
};