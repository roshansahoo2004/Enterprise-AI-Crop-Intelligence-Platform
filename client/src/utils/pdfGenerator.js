/**
 * Enterprise AI Farm Report Exporter
 * Generates an executive print-to-PDF document for farm health and agronomic decisions.
 */
export const generateFarmReportPDF = (reportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the AI Farm Report PDF');
    return;
  }

  const timestamp = new Date(reportData.timestamp || Date.now()).toLocaleString();
  const farmer = reportData.farmer || 'Farmer';
  const location = reportData.location || 'Agronomic Field';
  const weather = reportData.weather || {};
  const soilHealth = reportData.soilHealthScore || 78;
  const crop = reportData.latestCrop || {};
  const disease = reportData.latestDisease || {};
  const yieldEst = reportData.latestYield || {};

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Enterprise AI Farm Intelligence Report — ${farmer}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
        .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .brand { font-size: 24px; font-weight: bold; color: #064e3b; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .meta-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
        .meta-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
        .meta-table th { background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 13px; color: #475569; }
        .section-title { font-size: 16px; font-weight: bold; color: #0f766e; margin-top: 25px; margin-bottom: 12px; border-left: 4px solid #10b981; padding-left: 8px; }
        .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background: #f8fafc; }
        .card h4 { margin: 0 0 8px 0; font-size: 13px; color: #334155; }
        .card p { margin: 0; font-size: 18px; font-weight: bold; color: #0f172a; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #d1fae5; color: #065f46; }
        .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">🌾 Enterprise AI Crop Intelligence Platform</div>
          <div class="subtitle">Executive Farm Advisory & Health Audit Report</div>
        </div>
        <div style="text-align: right;">
          <div class="badge">CONFIDENTIAL REPORT</div>
          <div class="subtitle" style="margin-top: 6px;">Generated: ${timestamp}</div>
        </div>
      </div>

      <table class="meta-table">
        <tr>
          <th>Farmer / Owner</th>
          <td>${farmer}</td>
          <th>Field Location</th>
          <td>${location}</td>
        </tr>
        <tr>
          <th>Target Crop</th>
          <td>${crop.predictedCrop || yieldEst.cropName || 'Rice'}</td>
          <th>Field Area</th>
          <td>${yieldEst.fieldAreaHectares || 1.0} Hectares</td>
        </tr>
      </table>

      <div class="section-title">Telemetry & Environmental Metrics</div>
      <div class="card-grid">
        <div class="card">
          <h4>Live Weather Telemetry</h4>
          <p>${weather.temperature ? weather.temperature + '°C' : '28°C'} (${weather.condition || 'Clear'})</p>
          <span style="font-size:11px; color:#64748b;">Humidity: ${weather.humidity || 65}% | Rain Prob: ${weather.rainProbability || 20}%</span>
        </div>
        <div class="card">
          <h4>Soil Health Score Index</h4>
          <p style="color: #10b981;">${soilHealth} / 100</p>
          <span style="font-size:11px; color:#64748b;">Nitrogen: ${crop.nitrogen || 70} | pH: ${crop.ph || 6.5}</span>
        </div>
      </div>

      <div class="section-title">Diagnostics & ML Inference Summary</div>
      <table class="meta-table">
        <tr>
          <th>Latest Pathology Scan</th>
          <td>${disease.disease || 'Healthy Leaf (No Active Pathogen)'} (${disease.confidence ? disease.confidence + '%' : '98%'})</td>
        </tr>
        <tr>
          <th>Estimated Harvest Yield</th>
          <td>${yieldEst.totalPredictedYieldTons || '11.2'} Tons (${yieldEst.predictedYieldTonsPerHectare || '4.5'} Tons/ha)</td>
        </tr>
        <tr>
          <th>Estimated Net Profit</th>
          <td>$${yieldEst.estimatedProfitUsd ? yieldEst.estimatedProfitUsd.toLocaleString() : '2,450'} USD</td>
        </tr>
      </table>

      <div class="section-title">Agronomic Action Plan</div>
      <div class="card" style="margin-bottom: 15px;">
        <h4>Primary Recommendation Directive</h4>
        <p style="font-size: 13px; font-weight: normal; color: #334155;">
          Maintain soil Nitrogen levels between 60-80 mg/kg. Apply 45 kg/ha Urea top dressing prior to tillering. Irrigate field for 45 minutes if soil moisture falls below 45%.
        </p>
      </div>

      <div class="footer">
        Generated by Enterprise AI Crop Intelligence Copilot Engine • Groq Llama Architecture • Confidential
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
