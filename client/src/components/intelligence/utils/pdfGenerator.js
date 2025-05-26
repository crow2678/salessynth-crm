// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

export const generateIntelligenceReport = async (intelligenceData, clientName, options = {}) => {
  try {
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add page break if needed
    const checkPageBreak = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add styled text
    const addStyledText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0], maxWidth } = options;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(...color);
      
      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Return height used
      } else {
        pdf.text(text, x, y);
        return fontSize * 0.35;
      }
    };

    // 1. COVER PAGE
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, pageWidth, 80, 'F');
    
    // Company logo area (placeholder)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, margin, 40, 20, 'F');
    addStyledText('LOGO', margin + 15, margin + 12, { fontSize: 10, color: [100, 100, 100] });
    
    // Title
    addStyledText('DEAL INTELLIGENCE REPORT', margin, 50, { 
      fontSize: 24, fontStyle: 'bold', color: [255, 255, 255] 
    });
    addStyledText(clientName || 'Client Report', margin, 65, { 
      fontSize: 16, color: [255, 255, 255] 
    });
    
    // Date and time
    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    addStyledText(`Generated on ${reportDate}`, margin, pageHeight - 30, { 
      fontSize: 10, color: [100, 100, 100] 
    });

    // 2. EXECUTIVE SUMMARY PAGE
    pdf.addPage();
    yPosition = margin;
    
    // Page header
    addStyledText('EXECUTIVE SUMMARY', margin, yPosition, { 
      fontSize: 18, fontStyle: 'bold', color: [59, 130, 246] 
    });
    yPosition += 15;
    
    // Deal Score Section
    const dealScore = intelligenceData?.dealScore || 0;
    const scoreColor = dealScore >= 70 ? [34, 197, 94] : dealScore >= 50 ? [59, 130, 246] : [239, 68, 68];
    
    pdf.setFillColor(...scoreColor);
    pdf.circle(50, yPosition + 15, 15, 'F');
    addStyledText(`${dealScore}%`, 42, yPosition + 18, { 
      fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] 
    });
    addStyledText('Deal Success Probability', 75, yPosition + 10, { 
      fontSize: 12, fontStyle: 'bold' 
    });
    addStyledText(intelligenceData?.reasoning || 'No reasoning available', 75, yPosition + 20, { 
      fontSize: 10, maxWidth: pageWidth - 95 
    });
    yPosition += 40;

    // Key Metrics Table
    checkPageBreak(50);
    const metricsData = [
      ['Current Stage', intelligenceData?.currentStage || 'Unknown'],
      ['Momentum', intelligenceData?.momentum || 'Steady'],
      ['Engagement Level', intelligenceData?.engagementLevel || 'Medium'],
      ['Confidence Level', `${intelligenceData?.confidence || 0}%`]
    ];

    pdf.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: margin, right: margin }
    });
    yPosition = pdf.lastAutoTable.finalY + 15;

    // 3. RISK FACTORS SECTION
    if (intelligenceData?.riskFactors?.length > 0) {
      checkPageBreak(30);
      addStyledText('RISK FACTORS', margin, yPosition, { 
        fontSize: 16, fontStyle: 'bold', color: [239, 68, 68] 
      });
      yPosition += 12;

      intelligenceData.riskFactors.forEach((risk, index) => {
        checkPageBreak(25);
        
        // Risk severity indicator
        const severityColor = risk.severity === 'high' ? [239, 68, 68] : 
                             risk.severity === 'medium' ? [245, 158, 11] : [59, 130, 246];
        pdf.setFillColor(...severityColor);
        pdf.circle(margin + 3, yPosition + 3, 2, 'F');
        
        addStyledText(`${risk.type} Risk (${risk.severity})`, margin + 10, yPosition + 5, { 
          fontSize: 11, fontStyle: 'bold' 
        });
        yPosition += 8;
        
        const descHeight = addStyledText(risk.description, margin + 10, yPosition, { 
          fontSize: 9, maxWidth: pageWidth - 50 
        });
        yPosition += descHeight + 3;
        
        if (risk.recommendation) {
          addStyledText('Recommendation:', margin + 10, yPosition, { 
            fontSize: 9, fontStyle: 'bold', color: [100, 100, 100] 
          });
          yPosition += 5;
          const recHeight = addStyledText(risk.recommendation, margin + 10, yPosition, { 
            fontSize: 9, maxWidth: pageWidth - 50, color: [100, 100, 100] 
          });
          yPosition += recHeight + 8;
        } else {
          yPosition += 8;
        }
      });
    }

    // 4. OPPORTUNITIES SECTION
    if (intelligenceData?.opportunities?.length > 0) {
      checkPageBreak(30);
      addStyledText('OPPORTUNITIES', margin, yPosition, { 
        fontSize: 16, fontStyle: 'bold', color: [34, 197, 94] 
      });
      yPosition += 12;

      intelligenceData.opportunities.forEach((opportunity, index) => {
        checkPageBreak(25);
        
        pdf.setFillColor(34, 197, 94);
        pdf.circle(margin + 3, yPosition + 3, 2, 'F');
        
        addStyledText(`Opportunity ${index + 1}`, margin + 10, yPosition + 5, { 
          fontSize: 11, fontStyle: 'bold' 
        });
        yPosition += 8;
        
        const oppHeight = addStyledText(opportunity.opportunity, margin + 10, yPosition, { 
          fontSize: 9, maxWidth: pageWidth - 50 
        });
        yPosition += oppHeight + 3;
        
        // Potential and Timeline
        addStyledText(`Potential: ${opportunity.potential} | Timeline: ${opportunity.timeline}`, 
          margin + 10, yPosition, { fontSize: 9, color: [100, 100, 100] });
        yPosition += 8;
        
        if (opportunity.action) {
          addStyledText('Recommended Action:', margin + 10, yPosition, { 
            fontSize: 9, fontStyle: 'bold', color: [100, 100, 100] 
          });
          yPosition += 5;
          const actionHeight = addStyledText(opportunity.action, margin + 10, yPosition, { 
            fontSize: 9, maxWidth: pageWidth - 50, color: [100, 100, 100] 
          });
          yPosition += actionHeight + 10;
        } else {
          yPosition += 10;
        }
      });
    }

    // 5. NEXT ACTIONS SECTION
    if (intelligenceData?.nextActions?.length > 0) {
      checkPageBreak(30);
      addStyledText('NEXT ACTIONS', margin, yPosition, { 
        fontSize: 16, fontStyle: 'bold', color: [147, 51, 234] 
      });
      yPosition += 12;

      const actionsTableData = intelligenceData.nextActions.map((action, index) => [
        action.priority?.toUpperCase() || 'MEDIUM',
        action.action || 'No action specified',
        action.deadline || 'No deadline',
        action.expectedOutcome || 'No outcome specified'
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Priority', 'Action', 'Deadline', 'Expected Outcome']],
        body: actionsTableData,
        theme: 'grid',
        headStyles: { fillColor: [147, 51, 234] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 55 }
        },
        margin: { left: margin, right: margin }
      });
      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // 6. CONVERSATION STARTERS
    if (intelligenceData?.conversationStarters?.length > 0) {
      pdf.addPage();
      yPosition = margin;
      
      addStyledText('STRATEGIC CONVERSATION STARTERS', margin, yPosition, { 
        fontSize: 16, fontStyle: 'bold', color: [147, 51, 234] 
      });
      yPosition += 15;

      intelligenceData.conversationStarters.forEach((conversation, index) => {
        checkPageBreak(35);
        
        addStyledText(`${index + 1}. ${conversation.topic}`, margin, yPosition, { 
          fontSize: 12, fontStyle: 'bold' 
        });
        yPosition += 10;
        
        addStyledText('Question:', margin + 5, yPosition, { 
          fontSize: 10, fontStyle: 'bold', color: [100, 100, 100] 
        });
        yPosition += 6;
        const questionHeight = addStyledText(`"${conversation.question}"`, margin + 5, yPosition, { 
          fontSize: 10, maxWidth: pageWidth - 50, color: [50, 50, 50] 
        });
        yPosition += questionHeight + 5;
        
        addStyledText('Purpose:', margin + 5, yPosition, { 
          fontSize: 10, fontStyle: 'bold', color: [100, 100, 100] 
        });
        yPosition += 6;
        const purposeHeight = addStyledText(conversation.purpose, margin + 5, yPosition, { 
          fontSize: 10, maxWidth: pageWidth - 50, color: [100, 100, 100] 
        });
        yPosition += purposeHeight + 15;
      });
    }

    // 7. FOOTER WITH METADATA
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Page number
      addStyledText(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10, { 
        fontSize: 8, color: [150, 150, 150] 
      });
      
      // Generation info
      if (i === totalPages) {
        addStyledText(`Generated by SalesSynth Intelligence Engine`, margin, pageHeight - 10, { 
          fontSize: 8, color: [150, 150, 150] 
        });
        if (intelligenceData?.generatedAt) {
          const genDate = new Date(intelligenceData.generatedAt).toLocaleString();
          addStyledText(`Data as of: ${genDate}`, margin, pageHeight - 5, { 
            fontSize: 7, color: [150, 150, 150] 
          });
        }
      }
    }

    // Save the PDF
    const fileName = `${clientName?.replace(/[^a-z0-9]/gi, '_') || 'client'}_intelligence_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return {
      success: true,
      fileName,
      message: 'Report generated successfully'
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate report'
    };
  }
};

// Alternative function for capturing modal screenshots
export const generateModalScreenshotPDF = async (modalElement, clientName) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Capture the modal content
    const canvas = await html2canvas(modalElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: modalElement.scrollWidth,
      height: modalElement.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If image is taller than page, split across multiple pages
    if (imgHeight <= pageHeight - 20) {
      // Single page
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    } else {
      // Multiple pages
      const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 20));
      
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();
        
        const sourceY = i * (pageHeight - 20) * (canvas.height / imgHeight);
        const sourceHeight = Math.min((pageHeight - 20) * (canvas.height / imgHeight), canvas.height - sourceY);
        
        // Create a temporary canvas for this section
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
        
        const tempImgData = tempCanvas.toDataURL('image/png');
        const tempImgHeight = (sourceHeight * imgWidth) / canvas.width;
        
        pdf.addImage(tempImgData, 'PNG', 10, 10, imgWidth, tempImgHeight);
      }
    }
    
    const fileName = `${clientName?.replace(/[^a-z0-9]/gi, '_') || 'client'}_modal_capture_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return {
      success: true,
      fileName,
      message: 'Screenshot report generated successfully'
    };
    
  } catch (error) {
    console.error('Error generating screenshot PDF:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate screenshot report'
    };
  }
};