const express = require('express');
const soap = require('soap');
const fs = require('fs');
const app = express();
const port = 3000;
const { exec } = require('child_process');

const { getMetrics } = require('./api/yolov5/immet');



app.use(express.static('public'));

const service = {
  AnalyzerService: {
    AnalyzerPort: {
      analyzeUrl: async function(args) {

        const yoloOutput = await getMetrics();

        return {
          Score_image: { 
            Smax: yoloOutput.Smax, 
            Scom: yoloOutput.Scom, 
            Savg: yoloOutput.Savg, 
            D: yoloOutput.Dx, 
            Cmax: yoloOutput.Cmax, 
            Cavg: yoloOutput.Cavg, 
            n: yoloOutput.n, 
            level : 'hight' },
          Score_text: { n: 0, P: 0, Bg: 0, Nm: 0, level : 'none' },
          Score_post: { ER: 0.98747592, VR: 24.44605010, RL: 3, level : 'low' },
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
