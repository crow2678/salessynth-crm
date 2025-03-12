const API_CONFIG = {
    OPENAI_API_URL: "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview",
    GPT_MODEL: "gpt-4o",
    MAX_TOKENS: 800,
    TEMPERATURE: 0.7,
    COOLDOWN_PERIOD: 12 * 60 * 60 * 1000
};

const INDUSTRY_SALES_STRATEGIES = {
    "financial services": {
        topics: ["Regulatory compliance", "Risk management", "Cost reduction", "Fraud detection", "Integration", "Data security"],
        objections: ["Compliance concerns", "Security", "Legacy integration", "ROI timeline", "Operational impact", "Adoption"],
        technicalTerms: ["API", "Integration", "Compliance", "Authentication", "Encryption", "Security", "Regulatory reporting"]
    },
    "mortgage": {
        topics: ["Automated underwriting", "Compliance", "LOS integration", "Data validation", "Document automation", "Appraisal management"],
        objections: ["LOS integration", "HMDA compliance", "Valuation accuracy", "Document recognition", "Implementation timeline", "Training"],
        technicalTerms: ["UAD", "UCDP", "HMDA", "GSE", "FHA", "VA", "SSR", "Collateral valuation", "LADs 2.0", "Risk ratings"]
    },
    "banking": {
        topics: ["Process automation", "Fraud prevention", "Compliance", "Customer onboarding", "Core banking integration", "Data security"],
        objections: ["Legacy system integration", "Regulatory guarantees", "Implementation disruption", "Training", "Data security", "Customization"],
        technicalTerms: ["API integration", "Core banking", "KYC", "AML", "Payment processing", "ACH", "Wire transfer", "ISO 20022"]
    },
    "healthcare": {
        topics: ["Patient data", "HIPAA compliance", "EHR integration", "Patient outcomes", "Clinical workflow", "Regulation"],
        objections: ["Data security", "Regulation compliance", "System integration", "Staff training", "Implementation timeline", "Benefits evidence"],
        technicalTerms: ["HL7", "FHIR", "HIPAA", "EHR", "PHI", "Interoperability", "Clinical workflow"]
    },
    "technology": {
        topics: ["Integration", "Scalability", "Development resources", "API", "Developer experience", "Stack compatibility"],
        objections: ["Technical complexity", "Integration", "Build vs buy", "Scaling", "Developer resources", "Maintenance"],
        technicalTerms: ["API", "SDK", "Microservices", "Scalability", "Cloud", "DevOps", "CI/CD", "SLA"]
    },
    "retail": {
        topics: ["Customer experience", "Inventory management", "Omnichannel", "Analytics", "Supply chain", "POS integration"],
        objections: ["Customer experience impact", "System integration", "Training", "Peak season implementation", "ROI evidence", "Data management"],
        technicalTerms: ["POS", "Inventory management", "Order management", "CRM", "Loyalty", "Omnichannel"]
    },
    "default": {
        topics: ["ROI", "Implementation", "Integration", "Training", "Support", "Customization"],
        objections: ["Budget", "Timeline", "Adoption", "Integration", "ROI validation", "Support"],
        technicalTerms: ["API", "Integration", "Implementation", "Configuration", "Customization", "Training"]
    }
};

const DEAL_STAGES = {
    "prospecting": {
        focusAreas: ["discovery", "pain points", "value", "qualification"],
        nextSteps: ["needs assessment", "demo", "stakeholder mapping"],
        successIndicators: ["multiple stakeholders", "follow-up", "business challenge"],
        riskIndicators: ["single stakeholder", "information barriers", "immediate pricing"]
    },
    "qualified": {
        focusAreas: ["solution mapping", "technical evaluation", "stakeholder buy-in", "budget"],
        nextSteps: ["technical deep dive", "demonstration", "business case"],
        successIndicators: ["technical questions", "multiple demos", "budget discussion"],
        riskIndicators: ["delayed responses", "scope reduction", "competitive mentions"]
    },
    "proposal": {
        focusAreas: ["objections", "technical validation", "decision criteria", "implementation planning"],
        nextSteps: ["proposal review", "negotiation prep", "implementation scope"],
        successIndicators: ["proposal feedback", "implementation questions", "decision maker meetings"],
        riskIndicators: ["extended timeline", "late stakeholders", "reduced communication"]
    },
    "negotiation": {
        focusAreas: ["value reinforcement", "contract terms", "implementation readiness", "relationship"],
        nextSteps: ["contract review", "implementation planning", "success criteria"],
        successIndicators: ["start date discussion", "implementation details", "resource allocation"],
        riskIndicators: ["reopening closed items", "delayed signing", "new approvers"]
    }
};

const NOTE_PATTERNS = {
    questions: [/\?$/, /can (the|they|we|you|it|this)/i, /how (is|can|will|does|do)/i, /is there/i, /will (the|they|we|you|it|this)/i, /what (is|are|if|about|would)/i],
    requirements: [/need(s|ed)?/i, /require(s|d)?/i, /must\s+have/i, /should\s+have/i, /important/i, /ensure/i, /functionality/i],
    concerns: [/concern(s|ed)?/i, /issue(s)?/i, /problem(s)?/i, /challenge(s)?/i, /worried?/i, /risk(s|y)?/i, /afraid/i, /uncertain/i],
    events: [/meeting/i, /call/i, /demo/i, /presentation/i, /workshop/i, /session/i, /follow[\s-]up/i, /scheduled/i, /reschedul/i],
    timeIndicators: [/tomorrow/i, /next\s+week/i, /upcoming/i, /scheduled/i, /planned/i, /future/i, /soon/i, /later/i, /pending/i],
    decisionIndicators: [/decide/i, /decision/i, /confirm/i, /approval/i, /choose/i, /select/i, /determine/i, /evaluate/i, /assess/i, /review/i, /waiting\s+for/i, /pending/i, /need\s+to/i],
    positiveIndicators: [/progress/i, /moving\s+forward/i, /next\s+step/i, /proceed/i, /approve/i, /interest/i, /excited/i, /positive/i],
    negativeIndicators: [/delay/i, /postpone/i, /wait/i, /hold/i, /pause/i, /reconsider/i, /rethink/i, /concern/i]
};

module.exports = { API_CONFIG, INDUSTRY_SALES_STRATEGIES, DEAL_STAGES, NOTE_PATTERNS };