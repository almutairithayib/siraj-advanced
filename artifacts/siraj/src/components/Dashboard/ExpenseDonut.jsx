// import React from 'react';
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

// const data = [
//   { name: 'سكن', value: 4200 },
//   { name: 'طعام', value: 2400 },
//   { name: 'مواصلات', value: 1300 },
//   { name: 'فواتير', value: 1800 },
//   { name: 'ترفيه', value: 900 },
//   { name: 'أخرى', value: 680 },
// ];

// const COLORS = ['#e8734f', '#f0997b', '#fbbf24', '#6b7280', '#94a3b8', '#c2410c'];

// export default function ExpenseDonut() {
//   return (
//     <div className="chart-card">
//       <p className="chart-title">توزيع المصروفات</p>
//       <div style={{ width: '100%', height: 220 }}>
//         <ResponsiveContainer>
//           <PieChart>
//             <Pie
//               data={data}
//               dataKey="value"
//               nameKey="name"
//               innerRadius={55}
//               outerRadius={80}
//               paddingAngle={2}
//             >
//               {data.map((_, i) => (
//                 <Cell key={i} fill={COLORS[i % COLORS.length]} />
//               ))}
//             </Pie>
//             <Legend
//               layout="horizontal"
//               verticalAlign="bottom"
//               wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-family)' }}
//             />
//           </PieChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }