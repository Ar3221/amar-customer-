import { useState } from 'react';
import { MessageCircle, X, ChevronRight } from 'lucide-react';
import { generateWhatsAppLink, getGeneralSupportMessage } from '../utils/whatsapp';

const DEPARTMENTS = [
  { id: 'sales', name: 'Sales & Bulk Orders', phone: '919876543210', desc: 'Get quotes and MOQ details' },
  { id: 'support', name: 'Technical Support', phone: '919876543211', desc: 'Portal assistance & issues' },
  { id: 'export', name: 'Global Export Desk', phone: '919876543212', desc: 'International shipments' }
];

export function WhatsAppFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDepartmentClick = (phone: string) => {
    const link = generateWhatsAppLink(phone, getGeneralSupportMessage());
    window.open(link, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-fade-in">
      {isOpen && (
        <div className="mb-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform origin-bottom-right transition-all">
          <div className="bg-brand-green p-4 text-white">
            <h3 className="font-bold text-sm">Amar Industries Support</h3>
            <p className="text-[10px] text-emerald-100 mt-1">Typically replies in under 5 minutes</p>
          </div>
          <div className="p-2 space-y-1">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept.id}
                onClick={() => handleDepartmentClick(dept.phone)}
                className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{dept.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{dept.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-green transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-green hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-green/30 transition-transform hover:scale-105"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
