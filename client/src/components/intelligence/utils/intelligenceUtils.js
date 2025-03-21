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

// Create a deal intelligence prompt for GPT
export const createDealIntelligencePrompt = (researchData, googleResults) => {
 // Extract available client information from research data
 const clientName = researchData?.companyName || "Unknown";
 const clientCompany = researchData?.company || "Unknown";
 const clientNotes = researchData?.notes || "No notes available";
 
 // Extract any deal information if available
 const deals = researchData?.data?.deals || [];
 const currentDeal = deals.length > 0 ? deals[0] : null;
 const dealStatus = currentDeal?.status || "Unknown";
 const dealValue = currentDeal?.value ? `$${currentDeal.value.toLocaleString()}` : "Unknown";
 
 // Format Google results for the prompt
 const formattedGoogleResults = googleResults && googleResults.length > 0 
   ? googleResults.map(item => `- ${item.title || 'Untitled'} (${item.source || 'Unknown source'})`).join('\n')
   : 'No recent news available';

 return `Analyze this sales opportunity and provide deal intelligence:
  
 CLIENT INFORMATION:
 Name: ${clientName}
 Company: ${clientCompany}
 
 DEAL STATUS:
 Current Stage: ${dealStatus}
 Deal Value: ${dealValue}
 
 CLIENT NOTES:
 ${clientNotes}
 
 RECENT NEWS:
 ${formattedGoogleResults}
 
 Based on this information, provide:
 1. A deal success probability score (0-100%)
 2. Key positive factors supporting the deal
 3. Potential risks or concerns
 4. Strategic recommendations for advancing the deal
 5. Next stage analysis
 
 Format your response as a JSON object with these fields:
 {
   "dealScore": 75,
   "reasoning": "Reason for score based on client data",
   "currentStage": "proposal",
   "stageData": {
     "currentStage": "proposal",
     "timeInStage": "2 weeks",
     "completedStages": ["prospecting", "qualified"],
     "upcomingStages": ["negotiation", "closed_won"],
     "nextStageLikelihood": 70
   },
   "factors": {
     "positive": [
       {"description": "Strong engagement with decision makers", "impact": 80},
       {"description": "Technical questions indicate serious evaluation", "impact": 75}
     ],
     "negative": [
       {"description": "Long time in current stage", "impact": 65},
       {"description": "Budget concerns mentioned", "impact": 55}
     ]
   },
   "requirements": [
     {"title": "Integration capability", "description": "Need to integrate with existing CRM"},
     {"title": "Security compliance", "description": "Must meet industry security standards"}
   ],
   "nextStage": {
     "timeframe": "2-3 weeks",
     "value": "$50,000",
     "blockers": ["Budget approval", "Technical validation"]
   },
   "recommendations": [
     "Schedule technical demo with IT department",
     "Provide detailed ROI analysis",
     "Address security concerns with documentation"
   ]
 }
 
 Ensure your analysis is based on the available data. Use general sales knowledge where specific information is missing.`;
};

// Generate deal intelligence using GPT
export const generateDealIntelligence = async (clientId, userId, API_URL) => {
 try {
   // Get research data with Google results - only use this endpoint as it works
   const researchResponse = await fetch(`${API_URL}/summary/${clientId}/${userId}`);
   if (!researchResponse.ok) {
     throw new Error('Failed to fetch research data');
   }
   
   const researchData = await researchResponse.json();
   const googleResults = researchData?.data?.google || [];
   
   // Generate prompt using only the data we have
   const prompt = createDealIntelligencePrompt(researchData, googleResults);
   
   // Call GPT API
	const gptResponse = await fetch(`${API_URL}/ai/generate`, {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${localStorage.getItem('token')}` // Add this line
	  },
	  body: JSON.stringify({
		prompt,
		responseFormat: 'json'
	  })
	});
   
   if (!gptResponse.ok) {
     throw new Error('Failed to generate deal intelligence');
   }
   
   const responseData = await gptResponse.json();
   
   // If GPT returned a string instead of JSON, try to parse it
   if (typeof responseData === 'string') {
     try {
       return JSON.parse(responseData);
     } catch (error) {
       console.error("Error parsing GPT response:", error);
       throw new Error('Invalid response format from GPT');
     }
   }
   
   return responseData;
 } catch (error) {
   console.error("Error generating deal intelligence:", error);
   // Return a minimal structure to avoid UI errors
   return {
     dealScore: 0,
     reasoning: "Unable to generate deal intelligence at this time.",
     currentStage: "unknown",
     stageData: {
       currentStage: "unknown",
       completedStages: [],
       upcomingStages: []
     },
     factors: {
       positive: [],
       negative: []
     },
     requirements: [],
     nextStage: {},
     recommendations: []
   };
 }
};