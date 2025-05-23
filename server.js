const express = require('express');
const soap = require('soap');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));

const service = {
  AnalyzerService: {
    AnalyzerPort: {
      analyzeUrl: function(args) {
        console.log(args)
        // Здесь должна быть ваша логика анализа URL
        // Заглушка с тестовыми данными
        return {
          Score_image: { s1: 0.9, s2: 0.8, s3: 0.7, s4: 0.6, s5: 0.5, s6: 0.4, s7: 0.3, level : 'hight' },
          Score_text: { m1: 0.85, m2: 0.75, m3: 0.65, m4: 0.55, level : 'low' },
          Score_post: { p1: 0.4, p2: 0.3, p3: 0.2, level : 'medium' },
          Score_final: { level : 'medium' }
        };
      }
    }
  }
};

const wsdl = fs.readFileSync('service.wsdl', 'utf8');
app.listen(port, () => {
  soap.listen(app, '/wsdl', service, wsdl);
  console.log(`Server running on http://localhost:${port}`);
});