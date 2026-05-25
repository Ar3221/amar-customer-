import { X, Download } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function PDFViewer({ url, title, onClose }: PDFViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <div className="flex items-center gap-3">
            <a 
              href={url} 
              download 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 text-brand-green rounded hover:bg-brand-green/20 transition text-sm font-bold"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded shadow-sm border border-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe 
            src={`${url}#toolbar=0`} 
            title={title} 
            className="w-full h-full border-0"
          />
        </div>
        
      </div>
    </div>
  );
}
