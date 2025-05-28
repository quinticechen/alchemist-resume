
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface CoverLetterPDFDownloadProps {
  coverLetterContent: string;
  jobTitle: string;
  companyName?: string;
  selectedStyle: string;
}

const CoverLetterPDFDownload = ({ 
  coverLetterContent, 
  jobTitle, 
  companyName,
  selectedStyle 
}: CoverLetterPDFDownloadProps) => {
  const { toast } = useToast();

  const downloadPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font based on style
      const fontSettings = getStyleSettings(selectedStyle);
      
      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cover Letter', 20, 30);
      
      if (jobTitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Position: ${jobTitle}`, 20, 40);
      }
      
      if (companyName) {
        pdf.text(`Company: ${companyName}`, 20, 50);
      }

      // Clean and prepare content - remove any special characters that might cause issues
      const cleanContent = coverLetterContent
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .trim();

      // Add content with proper text splitting
      pdf.setFontSize(fontSettings.fontSize);
      pdf.setFont('helvetica', 'normal');
      
      const startY = jobTitle || companyName ? 65 : 45;
      const lines = pdf.splitTextToSize(cleanContent, 170);
      
      // Handle multi-page content
      let currentY = startY;
      const lineHeight = fontSettings.lineHeight * fontSettings.fontSize * 0.352778; // Convert to mm
      
      lines.forEach((line: string) => {
        if (currentY > 270) { // Near bottom of page
          pdf.addPage();
          currentY = 20;
        }
        pdf.text(line, 20, currentY);
        currentY += lineHeight;
      });

      // Generate filename
      const filename = `Cover_Letter_${jobTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'Position'}.pdf`;
      
      pdf.save(filename);
      
      toast({
        title: "Success",
        description: "Cover letter downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStyleSettings = (style: string) => {
    switch (style) {
      case 'professional':
        return { fontSize: 11, lineHeight: 1.4 };
      case 'modern':
        return { fontSize: 10, lineHeight: 1.5 };
      case 'creative':
        return { fontSize: 11, lineHeight: 1.6 };
      case 'minimalist':
        return { fontSize: 10, lineHeight: 1.3 };
      default:
        return { fontSize: 11, lineHeight: 1.4 };
    }
  };

  return (
    <Button
      onClick={downloadPDF}
      disabled={!coverLetterContent}
      className="bg-gradient-primary text-white hover:opacity-90 transition-opacity"
    >
      <Download className="h-4 w-4 mr-2" />
      Download PDF
    </Button>
  );
};

export default CoverLetterPDFDownload;
