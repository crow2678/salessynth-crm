// Complete Enhanced PDF Generator - Full Version
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Enhanced color palette
const COLORS = {
  primary: [59, 130, 246],
  success: [34, 197, 94],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  purple: [147, 51, 234],
  gray: [107, 114, 128],
  lightGray: [248, 250, 252],
  white: [255, 255, 255]
};

// Enhanced utility functions
const addSection = (pdf, title, yPos, color = COLORS.primary) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Add subtle background bar
  pdf.setFillColor(...color, 0.1);
  pdf.rect(20, yPos - 5, pageWidth - 40, 20, 'F');
  
  // Add colored left border
  pdf.setFillColor(...color);
  pdf.rect(20, yPos - 5, 3, 20, 'F');
  
  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(title, 30, yPos + 5);
  
  return yPos + 25;
};

const addMetricCard = (pdf, metric, value, x, y, width = 40, height = 25) => {
  // Card background
  pdf.setFillColor(...COLORS.lightGray);
  pdf.roundedRect(x, y, width, height, 3, 3, 'F');
  
  // Border
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 3, 3, 'S');
  
  // Value (large)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(value, x + width/2, y + 12, { align: 'center' });
  
  // Metric label (small)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.gray);
  pdf.text(metric, x + width/2, y + 20, { align: 'center' });
};

const addProgressBar = (pdf, percentage, x, y, width = 60, height = 6) => {
  // Background
  pdf.setFillColor(229, 231, 235);
  pdf.roundedRect(x, y, width, height, 3, 3, 'F');
  
  // Progress fill
  const fillWidth = (percentage / 100) * width;
  const color = percentage >= 70 ? COLORS.success : 
                percentage >= 50 ? COLORS.primary : COLORS.danger;
  
  pdf.setFillColor(...color);
  pdf.roundedRect(x, y, fillWidth, height, 3, 3, 'F');
  
  // Percentage text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(`${percentage}%`, x + width + 5, y + 4);
};

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

    // Enhanced helper function to add styled text
    const addStyledText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0], maxWidth } = options;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(...color);
      
      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35);
      } else {
        pdf.text(text, x, y);
        return fontSize * 0.35;
      }
    };

    // 1. ENHANCED COVER PAGE
    pdf.setFillColor(...COLORS.primary);
    pdf.rect(0, 0, pageWidth, 80, 'F');
    
    // Company logo area (enhanced)
    pdf.setFillColor(...COLORS.white);
    pdf.roundedRect(margin, margin, 40, 20, 3, 3, 'F');
    addStyledText('SALESSYNTH', margin + 8, margin + 12, { 
      fontSize: 10, 
      color: COLORS.gray,
      fontStyle: 'bold'
    });
    
    // Enhanced title styling
    addStyledText('DEAL INTELLIGENCE REPORT', margin, 50, { 
      fontSize: 24, 
      fontStyle: 'bold', 
      color: COLORS.white 
    });
    addStyledText(clientName || 'Client Report', margin, 65, { 
      fontSize: 16, 
      color: COLORS.white 
    });
    
    // Enhanced date and time
    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    addStyledText(`Generated on ${reportDate}`, margin, pageHeight - 30, { 
      fontSize: 10, 
      color: COLORS.gray 
    });

    // 2. ENHANCED EXECUTIVE SUMMARY PAGE
    pdf.addPage();
    yPosition = margin;
    
    yPosition = addSection(pdf, 'EXECUTIVE SUMMARY', yPosition, COLORS.primary);
    
    // Enhanced Deal Score Section with progress bar
    const dealScore = intelligenceData?.dealScore || 0;
    const scoreColor = dealScore >= 70 ? COLORS.success : 
                       dealScore >= 50 ? COLORS.primary : COLORS.danger;
    
    // Enhanced score visualization
    pdf.setFillColor(...scoreColor);
    pdf.circle(50, yPosition + 15, 15, 'F');
    addStyledText(`${dealScore}%`, 42, yPosition + 18, { 
      fontSize: 14, 
      fontStyle: 'bold', 
      color: COLORS.white 
    });
    
    addStyledText('Deal Success Probability', 75, yPosition + 10, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    
    // Add progress bar
    addProgressBar(pdf, dealScore, 75, yPosition + 15, 100, 8);
    
    const reasoningHeight = addStyledText(
      intelligenceData?.reasoning || 'No reasoning available', 
      75, yPosition + 30, { 
        fontSize: 10, 
        maxWidth: pageWidth - 95,
        color: COLORS.gray
      }
    );
    yPosition += Math.max(40, reasoningHeight + 35);

    // Enhanced Key Metrics with cards
    checkPageBreak(35);
    addStyledText('KEY METRICS', margin, yPosition, { 
      fontSize: 12, 
      fontStyle: 'bold',
      color: COLORS.gray
    });
    yPosition += 15;

    const metrics = [
      ['Current Stage', intelligenceData?.currentStage || 'Unknown'],
      ['Momentum', intelligenceData?.momentum || 'Steady'],
      ['Engagement Level', intelligenceData?.engagementLevel || 'Medium'],
      ['Confidence Level', `${intelligenceData?.confidence || 0}%`]
    ];

    // Create metric cards instead of table
    metrics.forEach((metric, index) => {
      const x = margin + (index % 2) * 85;
      const y = yPosition + Math.floor(index / 2) * 30;
      addMetricCard(pdf, metric[0], metric[1], x, y, 80, 25);
    });
    yPosition += 70;

    // 3. ENHANCED RISK FACTORS SECTION
    if (intelligenceData?.riskFactors?.length > 0) {
      checkPageBreak(30);
      yPosition = addSection(pdf, 'RISK FACTORS', yPosition, COLORS.danger);

      intelligenceData.riskFactors.forEach((risk, index) => {
        checkPageBreak(35);
        
        const severityColor = risk.severity === 'high' ? COLORS.danger : 
                             risk.severity === 'medium' ? COLORS.warning : COLORS.primary;
        
        // Enhanced risk item with icon
        pdf.setFillColor(...severityColor);
        pdf.circle(margin + 4, yPosition + 4, 3, 'F');
        
        // Add severity badge
        pdf.setFillColor(...severityColor, 0.2);
        pdf.roundedRect(margin + 15, yPosition - 2, 25, 8, 2, 2, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...severityColor);
        pdf.text(risk.severity.toUpperCase(), margin + 27, yPosition + 3, { align: 'center' });
        
        addStyledText(`${risk.type} Risk`, margin + 45, yPosition + 3, { 
          fontSize: 11, 
          fontStyle: 'bold' 
        });
        yPosition += 12;
        
        const descHeight = addStyledText(risk.description, margin + 10, yPosition, { 
          fontSize: 9, 
          maxWidth: pageWidth - 50,
          color: COLORS.gray
        });
        yPosition += descHeight + 5;
        
        if (risk.recommendation) {
          addStyledText('Recommendation:', margin + 10, yPosition, { 
            fontSize: 9, 
            fontStyle: 'bold', 
            color: COLORS.gray
          });
          yPosition += 5;
          const recHeight = addStyledText(risk.recommendation, margin + 10, yPosition, { 
            fontSize: 9, 
            maxWidth: pageWidth - 50, 
            color: COLORS.gray
          });
          yPosition += recHeight + 15;
        } else {
          yPosition += 10;
        }
      });
    }

    // 4. ENHANCED OPPORTUNITIES SECTION
    if (intelligenceData?.opportunities?.length > 0) {
      checkPageBreak(30);
      yPosition = addSection(pdf, 'OPPORTUNITIES', yPosition, COLORS.success);

      intelligenceData.opportunities.forEach((opportunity, index) => {
        checkPageBreak(35);
        
        // Enhanced opportunity item
        pdf.setFillColor(...COLORS.success);
        pdf.circle(margin + 4, yPosition + 4, 3, 'F');
        
        addStyledText(`Opportunity ${index + 1}`, margin + 15, yPosition + 5, { 
          fontSize: 11, 
          fontStyle: 'bold' 
        });
        yPosition += 12;
        
        const oppHeight = addStyledText(opportunity.opportunity, margin + 10, yPosition, { 
          fontSize: 9, 
          maxWidth: pageWidth - 50 
        });
        yPosition += oppHeight + 5;
        
        // Enhanced potential and timeline badges
        if (opportunity.potential) {
          const potentialColor = opportunity.potential === 'high' ? COLORS.success : 
                                opportunity.potential === 'medium' ? COLORS.warning : COLORS.gray;
          pdf.setFillColor(...potentialColor, 0.2);
          pdf.roundedRect(margin + 10, yPosition, 30, 8, 2, 2, 'F');
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...potentialColor);
          pdf.text(`${opportunity.potential.toUpperCase()} POTENTIAL`, margin + 25, yPosition + 5, { align: 'center' });
        }
        
        if (opportunity.timeline) {
          pdf.setFillColor(...COLORS.primary, 0.2);
          pdf.roundedRect(margin + 45, yPosition, 35, 8, 2, 2, 'F');
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...COLORS.primary);
          pdf.text(opportunity.timeline.toUpperCase(), margin + 62, yPosition + 5, { align: 'center' });
        }
        yPosition += 15;
        
        if (opportunity.action) {
          addStyledText('Recommended Action:', margin + 10, yPosition, { 
            fontSize: 9, 
            fontStyle: 'bold', 
            color: COLORS.gray
          });
          yPosition += 5;
          const actionHeight = addStyledText(opportunity.action, margin + 10, yPosition, { 
            fontSize: 9, 
            maxWidth: pageWidth - 50, 
            color: COLORS.gray
          });
          yPosition += actionHeight + 15;
        } else {
          yPosition += 10;
        }
      });
    }

    // 5. ENHANCED NEXT ACTIONS SECTION
    if (intelligenceData?.nextActions?.length > 0) {
      checkPageBreak(30);
      yPosition = addSection(pdf, 'NEXT ACTIONS', yPosition, COLORS.purple);

      const actionsTableData = intelligenceData.nextActions.map((action, index) => [
        action.priority?.toUpperCase() || 'MEDIUM',
        action.action || 'No action specified',
        action.deadline || 'No deadline',
        action.expectedOutcome || 'No outcome specified'
      ]);

      // Enhanced table styling
      autoTable(pdf, {
        startY: yPosition,
        head: [['Priority', 'Action', 'Deadline', 'Expected Outcome']],
        body: actionsTableData,
        theme: 'grid',
        headStyles: { 
          fillColor: COLORS.purple,
          textColor: COLORS.white,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        alternateRowStyles: {
          fillColor: COLORS.lightGray
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 55 }
        },
        margin: { left: margin, right: margin }
      });
      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // 6. ENHANCED CONVERSATION STARTERS
    if (intelligenceData?.conversationStarters?.length > 0) {
      pdf.addPage();
      yPosition = margin;
      
      yPosition = addSection(pdf, 'STRATEGIC CONVERSATION STARTERS', yPosition, COLORS.purple);

      intelligenceData.conversationStarters.forEach((conversation, index) => {
        checkPageBreak(45);
        
        // Enhanced conversation starter card
        pdf.setFillColor(...COLORS.lightGray);
        pdf.roundedRect(margin, yPosition, pageWidth - 40, 35, 3, 3, 'F');
        
        addStyledText(`${index + 1}. ${conversation.topic}`, margin + 10, yPosition + 10, { 
          fontSize: 12, 
          fontStyle: 'bold' 
        });
        yPosition += 15;
        
        addStyledText('Question:', margin + 10, yPosition, { 
          fontSize: 9, 
          fontStyle: 'bold', 
          color: COLORS.gray
        });
        yPosition += 5;
        const questionHeight = addStyledText(`"${conversation.question}"`, margin + 10, yPosition, { 
          fontSize: 10, 
          maxWidth: pageWidth - 60, 
          color: [50, 50, 50] 
        });
        yPosition += questionHeight + 5;
        
        addStyledText('Purpose:', margin + 10, yPosition, { 
          fontSize: 9, 
          fontStyle: 'bold', 
          color: COLORS.gray
        });
        yPosition += 5;
        const purposeHeight = addStyledText(conversation.purpose, margin + 10, yPosition, { 
          fontSize: 9, 
          maxWidth: pageWidth - 60, 
          color: COLORS.gray
        });
        yPosition += purposeHeight + 20;
      });
    }

    // 7. ENHANCED FOOTER WITH METADATA
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Page numbers
      addStyledText(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10, { 
        fontSize: 8, 
        color: [150, 150, 150] 
      });
      
      // Footer info on last page
      if (i === totalPages) {
        addStyledText(`Generated by SalesSynth Intelligence Engine`, margin, pageHeight - 10, { 
          fontSize: 8, 
          color: [150, 150, 150] 
        });
        if (intelligenceData?.generatedAt) {
          const genDate = new Date(intelligenceData.generatedAt).toLocaleString();
          addStyledText(`Data as of: ${genDate}`, margin, pageHeight - 5, { 
            fontSize: 7, 
            color: [150, 150, 150] 
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
      message: 'Enhanced report generated successfully'
    };

  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate enhanced report'
    };
  }
};

// Alternative function for capturing modal screenshots (unchanged)
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
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If image is taller than page, split across multiple pages
    if (imgHeight <= pageHeight - 20) {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    } else {
      const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 20));
      
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) pdf.addPage();
        
        const sourceY = i * (pageHeight - 20) * (canvas.height / imgHeight);
        const sourceHeight = Math.min((pageHeight - 20) * (canvas.height / imgHeight), canvas.height - sourceY);
        
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