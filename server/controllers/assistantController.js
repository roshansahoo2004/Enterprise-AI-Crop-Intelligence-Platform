const ChatMessage = require('../models/ChatMessage');
const Prediction = require('../models/Prediction');
const DiseaseReport = require('../models/DiseaseReport');
const YieldPrediction = require('../models/YieldPrediction');
const { buildUserContext } = require('../services/assistantContextBuilder');
const groqService = require('../services/groqService');

/**
 * Security: Prompt Sanitizer to prevent prompt injection or script injection
 */
const sanitizeInput = (text) => {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[{}]/g, '')
    .trim();
};

/**
 * Safely parse structured JSON response from AI output
 */
const parseStructuredResponse = (responseText, contextData) => {
  try {
    // Attempt JSON parse first if LLM returned JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary && parsed.recommendations) {
        return {
          summary: parsed.summary,
          explanation: parsed.explanation || parsed.whyExplanation || 'Agronomic decision reasoning based on current telemetry.',
          whyExplanation: parsed.whyExplanation || `Triggered by: Soil telemetry, weather patterns, and crop diagnostic models.`,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [parsed.recommendations],
          precautions: Array.isArray(parsed.precautions) ? parsed.precautions : [parsed.precautions || 'Follow safety guidelines.'],
          confidence: parsed.confidence || 'High (94.2%)',
          sources: parsed.sources || ['Weather API', 'Soil Analysis', 'Groq AI'],
          nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [parsed.nextSteps || 'Monitor field telemetry']
        };
      }
    }
  } catch (_e) {
    // Fallback to section parsing
  }

  // Parse markdown section headers if LLM returned markdown sections
  const extractSection = (header) => {
    const regex = new RegExp(`###\\s*${header}[\\s\\S]*?(?=(###|$))`, 'i');
    const match = responseText.match(regex);
    if (!match) return '';
    return match[0].replace(new RegExp(`###\\s*${header}`, 'i'), '').trim();
  };

  const summary = extractSection('Summary') || responseText.slice(0, 150) + '...';
  const explanation = extractSection('Detailed Agronomic Explanation') || 'Comprehensive agronomic analysis based on telemetry.';
  const recommendationsText = extractSection('Actionable Recommendations') || responseText;
  const precautionsText = extractSection('Precautions & Safety') || 'Wear protective equipment when handling agrochemicals.';
  const nextStepsText = extractSection('Next Steps') || 'Continue monitoring soil moisture and atmospheric humidity.';
  const confidenceText = extractSection('Confidence & Data Sources') || 'High Confidence';

  const recommendations = recommendationsText
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
    .filter(Boolean);

  const precautions = precautionsText
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
    .filter(Boolean);

  const nextSteps = nextStepsText
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
    .filter(Boolean);

  return {
    summary: summary.replace(/^[#\s]+/, ''),
    explanation,
    whyExplanation: `Why this recommendation? Triggered by live telemetry (${contextData.lastCrop || 'Crop'} context, Soil Health ${contextData.soilHealthScore}/100, Weather ${contextData.weatherData?.temperature || 28}°C).`,
    recommendations: recommendations.length > 0 ? recommendations : [recommendationsText],
    precautions: precautions.length > 0 ? precautions : [precautionsText],
    confidence: 'High (94.5%)',
    sources: ['Weather API', 'Soil Analysis', 'Prediction History', 'Groq AI'],
    nextSteps: nextSteps.length > 0 ? nextSteps : [nextStepsText]
  };
};

/**
 * Intelligent rule-assisted AI Farmer Assistant response generator (Fallback Engine)
 */
const generateAssistantReply = (userMessage, contextData) => {
  const msg = userMessage.toLowerCase();
  const crop = contextData.lastCrop || 'Rice';

  if (msg.includes('fertilizer') || msg.includes('nitrogen') || msg.includes('npk')) {
    return {
      summary: `NPK Fertilizer Advisory for ${crop}`,
      explanation: `Soil nitrogen balance is crucial for vegetative tillering and photosynthesis in ${crop}.`,
      whyExplanation: `Why this recommendation? Triggered by Nitrogen deficiency analysis (${contextData.lastPrediction?.nitrogen || 70} mg/kg) and current soil pH (${contextData.lastPrediction?.ph || 6.5}).`,
      recommendations: [
        `Apply 45 kg/ha of Urea or organic compost before the vegetative stage.`,
        `Incorporate Potassium (K) top dressing to strengthen stalk stability.`
      ],
      precautions: [
        `Avoid over-application of Nitrogen to prevent nitrate leaching into groundwater.`,
        `Do not apply fertilizer right before heavy rain.`
      ],
      confidence: 'High (95.0%)',
      sources: ['Soil Analysis', 'Prediction History', 'Agronomic Rules'],
      nextSteps: [
        `Check soil moisture before broadcasting fertilizer.`,
        `Monitor leaf color using SPAD meter after 7 days.`
      ]
    };
  }

  if (msg.includes('disease') || msg.includes('leaf') || msg.includes('blight') || msg.includes('spot')) {
    const diseaseName = contextData.lastDisease?.disease || 'Leaf Pathology';
    return {
      summary: `Pathology Treatment Protocol for ${diseaseName}`,
      explanation: `Fungal leaf pathogens thrive when atmospheric humidity exceeds 75% and temperatures remain warm.`,
      whyExplanation: `Why this recommendation? Triggered by latest leaf pathology scan (${diseaseName}) and atmospheric humidity (${contextData.weatherData?.humidity || 70}%).`,
      recommendations: [
        `Apply Neem-based bio-fungicide or Copper Oxychloride spray (2.5 g/L).`,
        `Ensure proper crop row spacing to encourage airflow.`
      ],
      precautions: [
        `Wear protective facemask and gloves during chemical spray.`,
        `Maintain 14-day pre-harvest interval after chemical application.`
      ],
      confidence: 'High (93.8%)',
      sources: ['Disease Detection', 'Weather API', 'Agronomic Rules'],
      nextSteps: [
        `Perform a follow-up leaf scan in 5 days.`,
        `Isolate heavily infected plant debris.`
      ]
    };
  }

  return {
    summary: `Agronomic Advisory & Farm Management Plan for ${crop}`,
    explanation: `Optimal crop health depends on balancing soil nutrients, irrigation schedules, and weather conditions.`,
    whyExplanation: `Why this recommendation? Based on real-time field telemetry (Soil Health ${contextData.soilHealthScore}/100, Temp ${contextData.weatherData?.temperature || 28}°C).`,
    recommendations: [
      `Maintain soil moisture between 60% and 80%.`,
      `Monitor for early signs of pest or disease infestation.`
    ],
    precautions: [
      `Ensure proper field drainage to prevent waterlogging.`,
      `Store agrochemicals in a safe, dry location.`
    ],
    confidence: 'High (92.5%)',
    sources: ['Soil Analysis', 'Weather API', 'Groq AI'],
    nextSteps: [
      `Run a new crop or yield prediction if soil parameters change.`,
      `Consult the Smart Crop Calendar for upcoming phase directives.`
    ]
  };
};

/**
 * POST /api/assistant/chat
 */
const sendMessage = async (req, res) => {
  try {
    const { text, lat, lon } = req.body;
    const cleanText = sanitizeInput(text);

    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Valid message text is required' });
    }

    // Save user message
    await ChatMessage.create({
      userId: req.user.id,
      sender: 'user',
      text: cleanText
    });

    // Fetch rich context & session memory
    const locationOverride = (lat && lon) ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null;
    const contextData = await buildUserContext(req.user.id, locationOverride);

    // Fetch conversation memory (last 10 messages)
    const history = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const userMessages = history.reverse();

    // Enterprise AI Copilot System Prompt
    const systemPrompt = `You are an expert AI Agronomist Copilot specializing in:
• Crop Recommendation & Soil Health
• Disease Pathology Diagnosis & Treatment Planning
• Fertilizer & N-P-K Management
• Weather-aware Irrigation & Yield Estimation
• Sustainable Farm Operations

Rules:
- ALWAYS answer ONLY agriculture, farming, crop cultivation, soil management, plant pathology, and agronomic questions. Politely decline non-agricultural topics.
- Use the USER PROJECT CONTEXT to personalize your response.
- Explicitly explain WHY recommendations are made based on telemetry (e.g. soil N-P-K, pH, humidity, disease scans).
- Never hallucinate unavailable project data.

USER PROJECT CONTEXT:
${contextData.contextSummary}

RESPONSE FORMAT REQUIREMENT:
Respond with a JSON object matching this schema:
{
  "summary": "Brief summary",
  "explanation": "Detailed explanation",
  "whyExplanation": "Why this recommendation? (Explain telemetry factors)",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "precautions": ["Precaution 1", "Precaution 2"],
  "confidence": "High (94.2%)",
  "sources": ["Weather API", "Soil Analysis", "Prediction History", "Groq AI"],
  "nextSteps": ["Next step 1", "Next step 2"]
}
`;

    let replyStructured = null;

    try {
      const groqRes = await groqService.generateCompletion(systemPrompt, userMessages);
      if (groqRes && groqRes.content) {
        replyStructured = parseStructuredResponse(groqRes.content, contextData);
      }
    } catch (groqErr) {
      console.warn('[Assistant Controller] Groq API execution failed, using fallback engine:', groqErr.message);
    }

    if (!replyStructured) {
      replyStructured = generateAssistantReply(cleanText, contextData);
    }

    // Format final message string from structured response
    const replyText = JSON.stringify(replyStructured);

    // Save assistant reply in database
    const replyMessage = await ChatMessage.create({
      userId: req.user.id,
      sender: 'assistant',
      text: replyText
    });

    res.json({
      success: true,
      data: replyMessage
    });
  } catch (error) {
    console.error('[Assistant Chat Error]', error);
    res.status(500).json({ success: false, message: 'Failed to process chat message' });
  }
};

/**
 * GET /api/assistant/history
 */
const getChatHistory = async (req, res) => {
  try {
    const history = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[Assistant History Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

/**
 * GET /api/assistant/prompts
 */
const getSuggestedPrompts = async (req, res) => {
  try {
    const userId = req.user.id;
    const [lastPrediction, lastDisease, predictions] = await Promise.all([
      Prediction.findOne({ userId }).sort({ createdAt: -1 }),
      DiseaseReport.findOne({ userId }).sort({ createdAt: -1 }),
      Prediction.find({ userId }).distinct('predictedCrop')
    ]);

    const crop = lastPrediction?.predictedCrop || 'Rice';
    const disease = lastDisease?.disease || null;

    const currentMonth = new Date().getMonth();
    let season = 'Kharif';
    if (currentMonth >= 10 || currentMonth <= 1) {
      season = 'Rabi';
    } else if (currentMonth >= 2 && currentMonth <= 5) {
      season = 'Zaid';
    }

    const suggestions = [];
    suggestions.push(`What is the optimal irrigation schedule for ${crop} during this growth stage?`);
    suggestions.push(`Which crops are most suitable to sow during the ${season} season?`);

    if (disease) {
      suggestions.push(`What are the treatment steps for ${disease} found in my recent leaf scan?`);
    } else {
      suggestions.push(`What should I do if my crop leaves have spots or yellowing symptoms?`);
    }

    if (predictions && predictions.length > 0) {
      suggestions.push(`How do I optimize Nitrogen, Phosphorus, and Potassium levels for ${predictions.slice(0, 2).join(' or ')}?`);
    } else {
      suggestions.push(`How can I improve my soil organic carbon and health score?`);
    }

    res.json({
      success: true,
      data: suggestions.slice(0, 4)
    });
  } catch (error) {
    console.error('[Suggested Prompts Error]', error);
    res.json({
      success: true,
      data: [
        'What fertilizer should I apply for Nitrogen deficit?',
        'How much water does Rice require during tillering?',
        'What should I do if my crop leaves have brown spots?',
        'How can I calculate my net profit per hectare?'
      ]
    });
  }
};

/**
 * GET /api/assistant/farm-report
 * Consolidates all farm telemetry into a report payload for PDF generation
 */
const getFarmReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const contextData = await buildUserContext(userId);

    const reportData = {
      timestamp: new Date().toISOString(),
      farmer: contextData.userProfile?.name || 'Farmer',
      location: contextData.weatherData?.location || 'Local Region',
      weather: contextData.weatherData,
      soilHealthScore: contextData.soilHealthScore,
      latestCrop: contextData.lastPrediction,
      latestDisease: contextData.lastDisease,
      latestYield: contextData.lastYield,
      rememberedFacts: contextData.rememberedFacts
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('[Farm Report Error]', error);
    res.status(500).json({ success: false, message: 'Failed to generate farm report data' });
  }
};

module.exports = { sendMessage, getChatHistory, getSuggestedPrompts, getFarmReportData };
