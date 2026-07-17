// import React from 'react';

// export default function HealthScoreGauge({ score = 72 }) {
//   const radius = 50;
//   const circumference = Math.PI * radius;
//   const progress = (score / 100) * circumference;

//   const getLabel = (s) => {
//     if (s >= 75) return 'ممتاز';
//     if (s >= 50) return 'جيد';
//     return 'يحتاج تحسين';
//   };

//   return (
//     <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//       <p className="chart-title" style={{ alignSelf: 'flex-start' }}>مؤشر الصحة المالية</p>
//       <svg width="140" height="80" viewBox="0 0 140 80">
//         <path
//           d="M 20 70 A 50 50 0 0 1 120 70"
//           fill="none"
//           stroke="var(--bg-secondary)"
//           strokeWidth="12"
//           strokeLinecap="round"
//         />
//         <path
//           d="M 20 70 A 50 50 0 0 1 120 70"
//           fill="none"
//           stroke="var(--accent)"
//           strokeWidth="12"
//           strokeLinecap="round"
//           strokeDasharray={`${progress} ${circumference}`}
//         />
//       </svg>
//       <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '-8px' }}>
//         {score}
//       </p>
//       <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{getLabel(score)}</p>
//     </div>
//   );
// }