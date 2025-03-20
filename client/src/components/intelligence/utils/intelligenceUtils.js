// utils/intelligenceUtils.js

// Format markdown text with simple HTML tags
export const formatMarkdown = (text) => {
  if (!text) return '';
  
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/(###\s+[0-9️⃣]+\s+.*?)$/gm, '<h3 class="font-bold text-lg mb-3">$1</h3>');
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

// Format timestamp to readable date
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not available';
  
  if (timestamp.$date) {
    return new Date(timestamp.$date).toLocaleDateString();
  }
  
  return new Date(timestamp).toLocaleDateString();
};

// Process research data into PDL format
export const processIntelligenceData = (data) => {
  try {
    // Start with an empty PDL object with the expected structure
    const processedData = {
      dealScore: 0,
      reasoning: "",
      currentStage: "",
      dealValue: "$0",
      stageData: {
        currentStage: "",
        timeInStage: "",
        averageTimeToNext: "",
        nextStage: "",
        completedStages: [],
        upcomingStages: [],
        nextStageLikelihood: 0
      },
      factors: {
        positive: [],
        negative: []
      },
      requirements: [],
      nextStage: {
        timeframe: "",
        value: "",
        blockers: []
      },
      marketData: [],
      recommendations: []
    };

    // Process existing PDL data first if available
    if (data.data?.pdl) {
      const pdlData = data.data.pdl;
      Object.assign(processedData, pdlData);
      
      // Ensure company data is preserved
      processedData.companyData = pdlData.companyData || null;
      processedData.personData = pdlData.personData || null;
      processedData.company = pdlData.company || pdlData.companyData?.name || data.companyName;
    }

    // Extract deal health information if available
    if (data.dealHealth) {
      processedData.dealScore = data.dealHealth.score || processedData.dealScore;
      processedData.reasoning = data.dealHealth.summary || processedData.reasoning;
      
      // Extract positive factors (strengths)
      if (data.dealHealth.strengths && data.dealHealth.strengths.length > 0) {
        processedData.factors.positive = data.dealHealth.strengths.map(strength => ({
          description: strength,
          impact: Math.floor(Math.random() * 30) + 70 // Visualization value
        }));
      }
      
      // Extract negative factors (risk factors)
      if (data.dealHealth.riskFactors && data.dealHealth.riskFactors.length > 0) {
        processedData.factors.negative = data.dealHealth.riskFactors.map(risk => ({
          description: risk,
          impact: Math.floor(Math.random() * 30) + 40 // Visualization value
        }));
      }

      // Deal stage information
      if (data.dealHealth.stage) {
        processedData.currentStage = data.dealHealth.stage;
        processedData.stageData.currentStage = data.dealHealth.stage;
        
        // Map the pipeline stages
        const pipelineStages = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won'];
        const currentStageIndex = pipelineStages.indexOf(data.dealHealth.stage);
        
        if (currentStageIndex >= 0) {
          processedData.stageData.completedStages = pipelineStages.slice(0, currentStageIndex);
          processedData.stageData.upcomingStages = pipelineStages.slice(currentStageIndex + 1);
          processedData.stageData.nextStage = processedData.stageData.upcomingStages[0] || 'closed_won';
          
          // Calculate likelihood based on probability
          processedData.stageData.nextStageLikelihood = 
            data.dealHealth.probability === 'High' ? 80 : 
            data.dealHealth.probability === 'Medium' ? 60 :
            data.dealHealth.probability === 'Moderate' ? 40 : 20;
        }
        
        // Add time estimates
        processedData.stageData.timeInStage = data.dealHealth.timeInStage || "2 weeks";
        processedData.stageData.averageTimeToNext = data.dealHealth.averageTimeToNext || "3 weeks";
      }

      // Deal momentum for next stage info
      if (data.dealHealth.momentum) {
        processedData.nextStage.timeframe = 
          data.dealHealth.momentum === "Accelerating" ? "Soon (1-2 weeks)" : 
          data.dealHealth.momentum === "Steady" ? "Normal (2-4 weeks)" : "Delayed (4+ weeks)";
      }

      // Handle deal value
      if (data.dealValue) {
        processedData.dealValue = `$${data.dealValue.toLocaleString()}`;
        processedData.nextStage.value = `$${data.dealValue.toLocaleString()}`;
      }
      
      // Extract blockers
      if (data.dealHealth.blockers && Array.isArray(data.dealHealth.blockers)) {
        processedData.nextStage.blockers = data.dealHealth.blockers;
      }
    }

    // Extract requirements from client questions
    if (data.clientQuestions && data.clientQuestions.questions) {
      processedData.requirements = data.clientQuestions.questions.map(question => ({
        title: question.substring(0, Math.min(50, question.length)),
        description: question
      })).slice(0, 3);
    }

    // Extract market intelligence
    if (data.marketData && data.marketData.length > 0) {
      processedData.marketData = data.marketData.map(item => ({
        title: item.title || "Market Update",
        source: item.source || "Market Analysis",
        date: item.date || new Date().toLocaleDateString(),
        snippet: item.snippet || item.description || "No details available",
        url: item.url || null
      }));
    } else if (data.data && data.data.google && data.data.google.length > 0) {
      // Alternative: use Google data if available
      processedData.marketData = data.data.google.map(item => ({
        title: item.title || "News Update",
        source: item.source || "News Feed",
        date: item.publishedDate || new Date().toLocaleDateString(),
        snippet: item.snippet || "No details available",
        url: item.url || null
      })).slice(0, 3);
    }

    // Extract recommendations
    if (data.recommendations && Array.isArray(data.recommendations)) {
      processedData.recommendations = data.recommendations;
    } else if (data.salesStrategies) {
      // Alternative: use sales strategies as recommendations
      processedData.recommendations = Array.isArray(data.salesStrategies) 
        ? data.salesStrategies 
        : [data.salesStrategies];
    }

    return processedData;
  } catch (err) {
    console.error("Error processing intelligence data:", err);
    return {}; // Return empty object in case of error
  }
};