import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisResult } from '../types';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { MetricsComparison } from './MetricsComparison';

interface AnalysisResultsProps {
  originalResult: AnalysisResult;
  comparedResult: AnalysisResult;
  className?: string;
}

export const AnalysisResults = ({
  originalResult,
  comparedResult,
  className = ''
}: AnalysisResultsProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const metrics = [
    {
      metric: 'Toplam Node Sayısı',
      originalValue: originalResult.totalNodes,
      comparedValue: comparedResult.totalNodes,
      difference: comparedResult.totalNodes - originalResult.totalNodes,
      percentageChange: ((comparedResult.totalNodes - originalResult.totalNodes) / originalResult.totalNodes) * 100
    },
    {
      metric: 'Toplam Bağlantı Sayısı',
      originalValue: originalResult.totalLinks,
      comparedValue: comparedResult.totalLinks,
      difference: comparedResult.totalLinks - originalResult.totalLinks,
      percentageChange: ((comparedResult.totalLinks - originalResult.totalLinks) / originalResult.totalLinks) * 100
    },
    {
      metric: 'Ortalama Karmaşıklık',
      originalValue: originalResult.averageComplexity,
      comparedValue: comparedResult.averageComplexity,
      difference: comparedResult.averageComplexity - originalResult.averageComplexity,
      percentageChange: ((comparedResult.averageComplexity - originalResult.averageComplexity) / originalResult.averageComplexity) * 100
    }
  ];

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      
      // Başlık
      doc.setFontSize(20);
      doc.text('Kod Analiz Raporu', 20, 20);
      
      // Tarih
      doc.setFontSize(12);
      doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
      
      // Genel Metrikler
      doc.setFontSize(16);
      doc.text('Genel Metrikler', 20, 50);
      
      doc.setFontSize(12);
      let y = 60;
      metrics.forEach(metric => {
        doc.text(`${metric.metric}:`, 20, y);
        doc.text(`Orijinal: ${metric.originalValue.toFixed(2)}`, 40, y);
        doc.text(`Yeni: ${metric.comparedValue.toFixed(2)}`, 100, y);
        doc.text(`Değişim: ${metric.percentageChange.toFixed(2)}%`, 160, y);
        y += 10;
      });

      // Detaylı Metrikler
      doc.setFontSize(16);
      doc.text('Detaylı Metrikler', 20, y + 10);
      
      doc.setFontSize(12);
      y += 20;
      Object.entries(originalResult.metrics).forEach(([key, value]) => {
        const comparedValue = comparedResult.metrics[key as keyof typeof comparedResult.metrics];
        const change = ((comparedValue - value) / value) * 100;
        
        doc.text(`${key}:`, 20, y);
        doc.text(`Orijinal: ${value.toFixed(2)}`, 40, y);
        doc.text(`Yeni: ${comparedValue.toFixed(2)}`, 100, y);
        doc.text(`Değişim: ${change.toFixed(2)}%`, 160, y);
        y += 10;
      });

      // PDF'i indir
      doc.save('kod-analiz-raporu.pdf');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Analiz Sonuçları</CardTitle>
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            variant="outline"
            size="sm"
          >
            {isGeneratingPDF ? (
              <FileText className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF Raporu İndir
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Toplam Node</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{originalResult.totalNodes}</div>
                  <p className="text-xs text-muted-foreground">
                    → {comparedResult.totalNodes}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Toplam Bağlantı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{originalResult.totalLinks}</div>
                  <p className="text-xs text-muted-foreground">
                    → {comparedResult.totalLinks}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Ortalama Karmaşıklık</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {originalResult.averageComplexity.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    → {comparedResult.averageComplexity.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <MetricsComparison metrics={metrics} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 