import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft } from 'lucide-react';

export default function SirajTip({ tip }) {
  const displayTip = tip || 'لاحظت إن مصروفات الترفيه زادت 15% هذا الشهر. لو تبي، أقدر أقترح لك خطة ادخار بسيطة توازن ميزانيتك.';
  
  return (
    <div className="tip-card">
      <div className="tip-header">
        <Sparkles size={18} color="var(--accent)" />
        <span>نصيحة سراج</span>
      </div>
      <p className="tip-text">
        {displayTip}
      </p>
      <Link
        to="/siraj-ai"
        state={{ initialPrompt: 'اقترح لي خطة ادخار بسيطة توازن ميزانيتي' }}
        className="tip-link"
      >
        اسأل سراج <ChevronLeft size={14} />
      </Link>
    </div>
  );
}