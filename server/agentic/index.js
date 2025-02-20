const { fetchClientsForFollowUp } = require("./database"); // Use the correct function name
const { fetchCompanyNews } = require("./research");
const { generateSalesInsights } = require("./analysis");
const { saveSalesInsights } = require("./database");
const { sendEmail } = require("./notify");

async function runAgenticResearch() {
    console.log("🚀 Fetching clients due for follow-up...");

    const clients = await fetchClientsForFollowUp(); // Ensure function name matches database.js

    for (const client of clients) {
        console.log(`🔍 Researching company: ${client.company} for User: ${client.userId}`);

        const news = await fetchCompanyNews(client.company);
        const insights = await generateSalesInsights(client, news);

        console.log("💾 Storing insights...");
        await saveSalesInsights(client.userId, client.clientId, insights, news);

       // console.log("📩 Sending email notification...");
        //await sendEmail("salesperson@example.com", `🔍 Sales Insights for ${client.company}`, insights);
    }

    console.log("✅ Agentic Sales Research Completed!");
}

runAgenticResearch();
