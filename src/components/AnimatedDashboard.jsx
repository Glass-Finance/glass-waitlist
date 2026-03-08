// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// export default function AnimatedDashboard({ transparent = false }) {
//   const [activeCard, setActiveCard] = useState(0);
//   const [count, setCount] = useState(0);
//   const [transactions, setTransactions] = useState([]);

//   // Cycle through different states
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActiveCard((prev) => (prev + 1) % 4);
//     }, 3500);
//     return () => clearInterval(interval);
//   }, []);

//   // Animated counter
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCount((prev) => (prev < 1247 ? prev + 37 : 1247));
//     }, 50);
//     return () => clearInterval(timer);
//   }, []);

//   // Simulate live transactions
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const newTransaction = {
//         id: Date.now(),
//         name: ['Ada O.', 'Chidi M.', 'Ngozi P.', 'Emeka K.', 'Amaka S.'][Math.floor(Math.random() * 5)],
//         amount: ['₦50,000', '₦75,000', '₦100,000', '₦25,000'][Math.floor(Math.random() * 4)],
//         time: 'Just now'
//       };
//       setTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
//     }, 4000);
//     return () => clearInterval(interval);
//   }, []);

//   const cards = [
//     {
//       title: 'Total Balance',
//       amount: '₦3,528,198.72',
//       change: '+12.5%',
//       subtitle: 'vs last month',
//       positive: true,
//       icon: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//         />
//       ),
//     },
//     {
//       title: 'Members Paid',
//       amount: '847/920',
//       change: '92% Complete',
//       subtitle: '73 pending',
//       positive: true,
//       icon: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
//         />
//       ),
//     },
//     {
//       title: 'This Month',
//       amount: '₦985,400',
//       change: '+18.2%',
//       subtitle: 'Target: ₦1.2M',
//       positive: true,
//       icon: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
//         />
//       ),
//     },
//     {
//       title: 'Pending',
//       amount: '₦145,200',
//       change: '73 members',
//       subtitle: 'Due in 5 days',
//       positive: false,
//       icon: (
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//         />
//       ),
//     },
//   ];

//   return (
//     <div className="relative w-full h-full flex items-center justify-center p-4">
//       {/* Main Dashboard Card - Much Larger */}
//       <motion.div
//         className="relative w-full max-w-[900px] xl:max-w-[1000px]"
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         {/* Glassmorphism Card */}
//         <div className={`relative rounded-[32px] px-8 py-6 shadow-2xl border ${
//           transparent 
//             ? 'bg-white/20 backdrop-blur-md border-white/10' 
//             : 'bg-white/90 backdrop-blur-xl border-white/20'
//         }`}>
//           {/* Header */}
//           <div className="flex items-center justify-between mb-8">
//             <div className="flex items-center gap-4">
//               <motion.div
//                 className="w-14 h-14 bg-gradient-to-br from-[#17A1E5] to-[#0E628C] rounded-2xl flex items-center justify-center shadow-lg"
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//               >
//                 <svg
//                   className="w-8 h-8 text-white"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//               </motion.div>
//               <div>
//                 <h3 className={`text-lg font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>
//                   Community Fund Dashboard
//                 </h3>
//                 <p className={`text-sm ${transparent ? 'text-white/70' : 'text-gray-500'}`}>
//                   Real-time Financial Overview
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <motion.div
//                 className="px-4 py-2 bg-green-100 rounded-full flex items-center gap-2"
//                 animate={{ scale: [1, 1.05, 1] }}
//                 transition={{ duration: 2, repeat: Infinity }}
//               >
//                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                 <span className="text-sm font-semibold text-green-700">Live</span>
//               </motion.div>
//             </div>
//           </div>

//           {/* Main Stats Grid - 2x2 */}
//           <div className="grid grid-cols-2 gap-4 mb-8">
//             {cards.map((card, index) => (
//               <motion.div
//                 key={index}
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ delay: index * 0.1, duration: 0.5 }}
//                 whileHover={{ scale: 1.02 }}
//                 className={`rounded-2xl p-5 border cursor-pointer transition-all ${
//                   activeCard === index
//                     ? transparent
//                       ? 'bg-white/20 border-white/40 shadow-xl'
//                       : 'bg-gradient-to-br from-[#17A1E5]/15 to-[#0E628C]/10 border-[#17A1E5]/30 shadow-xl'
//                     : transparent
//                       ? 'bg-white/10 border-white/20'
//                       : 'bg-white/50 border-gray-200/50'
//                 }`}
//               >
//                 {/* Card Header */}
//                 <div className="flex items-center justify-between mb-4">
//                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
//                     card.positive 
//                       ? 'bg-green-100' 
//                       : 'bg-orange-100'
//                   }`}>
//                     <svg
//                       className={`w-6 h-6 ${card.positive ? 'text-green-600' : 'text-orange-600'}`}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       {card.icon}
//                     </svg>
//                   </div>
//                   <span className={`text-xs font-medium px-3 py-1 rounded-full ${
//                     card.positive 
//                       ? 'bg-green-100 text-green-700' 
//                       : 'bg-orange-100 text-orange-700'
//                   }`}>
//                     {card.change}
//                   </span>
//                 </div>

//                 {/* Card Content */}
//                 <div>
//                   <span className={`text-sm font-medium block mb-2 ${
//                     transparent ? 'text-white/80' : 'text-gray-600'
//                   }`}>
//                     {card.title}
//                   </span>
//                   <motion.p
//                     className={`text-3xl font-bold mb-1 ${
//                       transparent ? 'text-white' : 'text-gray-900'
//                     }`}
//                     animate={activeCard === index ? { scale: [1, 1.05, 1] } : {}}
//                     transition={{ duration: 0.5 }}
//                   >
//                     {card.amount}
//                   </motion.p>
//                   <span className={`text-xs ${
//                     transparent ? 'text-white/60' : 'text-gray-500'
//                   }`}>
//                     {card.subtitle}
//                   </span>
//                 </div>
//               </motion.div>
//             ))}
//           </div>

//           {/* Activity Graph */}
//           <div className="mb-8">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h4 className={`text-base font-bold ${transparent ? 'text-white/90' : 'text-gray-800'}`}>
//                   Payment Activity
//                 </h4>
//                 <p className={`text-xs ${transparent ? 'text-white/60' : 'text-gray-500'}`}>
//                   Weekly collection trends
//                 </p>
//               </div>
//               <div className="flex gap-2">
//                 {['7D', '30D', '90D'].map((period, i) => (
//                   <button
//                     key={period}
//                     className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
//                       i === 0
//                         ? 'bg-[#17A1E5] text-white'
//                         : transparent
//                           ? 'bg-white/10 text-white/70 hover:bg-white/20'
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}
//                   >
//                     {period}
//                   </button>
//                 ))}
//               </div>
//             </div>
            
//             <div className={`rounded-2xl p-4 ${
//               transparent ? 'bg-white/10' : 'bg-gray-50'
//             }`}>
//               <svg className="w-full h-32" viewBox="0 0 600 120" preserveAspectRatio="none">
//                 <defs>
//                   <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
//                     <stop offset="0%" stopColor="#17A1E5" stopOpacity="0.4" />
//                     <stop offset="100%" stopColor="#17A1E5" stopOpacity="0.05" />
//                   </linearGradient>
//                 </defs>
                
//                 {/* Grid lines */}
//                 {[0, 30, 60, 90, 120].map((y) => (
//                   <line
//                     key={y}
//                     x1="0"
//                     y1={y}
//                     x2="600"
//                     y2={y}
//                     stroke={transparent ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
//                     strokeWidth="1"
//                   />
//                 ))}
                
//                 {/* Animated Path */}
//                 <motion.path
//                   d="M 0 90 Q 75 70, 100 75 T 200 60 T 300 40 T 400 50 T 500 30 T 600 35"
//                   fill="none"
//                   stroke={transparent ? "#FFFFFF" : "#17A1E5"}
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   initial={{ pathLength: 0 }}
//                   animate={{ pathLength: 1 }}
//                   transition={{ duration: 2, ease: "easeInOut" }}
//                 />
                
//                 {/* Area fill */}
//                 <motion.path
//                   d="M 0 90 Q 75 70, 100 75 T 200 60 T 300 40 T 400 50 T 500 30 T 600 35 L 600 120 L 0 120 Z"
//                   fill="url(#gradient)"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 1, delay: 0.5 }}
//                 />
                
//                 {/* Animated dots */}
//                 {[0, 100, 200, 300, 400, 500, 600].map((x, i) => {
//                   const y = [90, 75, 60, 40, 50, 30, 35][i];
//                   return (
//                     <motion.circle
//                       key={i}
//                       cx={x}
//                       cy={y}
//                       r="5"
//                       fill={transparent ? "#FFFFFF" : "#17A1E5"}
//                       initial={{ scale: 0 }}
//                       animate={{ scale: [0, 1.3, 1] }}
//                       transition={{ 
//                         duration: 0.5, 
//                         delay: 0.5 + i * 0.15 
//                       }}
//                     />
//                   );
//                 })}
//               </svg>
//             </div>
//           </div>

//           {/* Bottom Section: Recent Transactions + Quick Stats */}
//           <div className="grid grid-cols-3 gap-4">
//             {/* Recent Transactions - Takes 2 columns */}
//             <div className="col-span-2">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className={`text-sm font-bold ${transparent ? 'text-white/90' : 'text-gray-800'}`}>
//                   Recent Payments
//                 </h4>
//                 <span className={`text-xs ${transparent ? 'text-white/60' : 'text-gray-500'}`}>
//                   Live updates
//                 </span>
//               </div>
//               <div className="space-y-2">
//                 <AnimatePresence mode="popLayout">
//                   {transactions.slice(0, 3).map((transaction) => (
//                     <motion.div
//                       key={transaction.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       exit={{ opacity: 0, x: 20 }}
//                       className={`flex items-center justify-between p-3 rounded-xl ${
//                         transparent ? 'bg-white/10' : 'bg-white/70 border border-gray-200/50'
//                       }`}
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
//                           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                           </svg>
//                         </div>
//                         <div>
//                           <p className={`text-sm font-medium ${transparent ? 'text-white' : 'text-gray-900'}`}>
//                             {transaction.name}
//                           </p>
//                           <p className={`text-xs ${transparent ? 'text-white/60' : 'text-gray-500'}`}>
//                             {transaction.time}
//                           </p>
//                         </div>
//                       </div>
//                       <span className={`text-sm font-bold ${transparent ? 'text-white' : 'text-green-600'}`}>
//                         {transaction.amount}
//                       </span>
//                     </motion.div>
//                   ))}
//                 </AnimatePresence>
//               </div>
//             </div>

//             {/* Quick Stats - 1 column */}
//             <div>
//               <h4 className={`text-sm font-bold mb-3 ${transparent ? 'text-white/90' : 'text-gray-800'}`}>
//                 Quick Stats
//               </h4>
//               <div className="space-y-2">
//                 {[
//                   { label: 'Total Members', value: count.toString(), icon: '👥' },
//                   { label: 'Collections', value: '847', icon: '✅' },
//                   { label: 'Success Rate', value: '92%', icon: '📊' }
//                 ].map((stat, i) => (
//                   <motion.div
//                     key={i}
//                     className={`rounded-xl p-3 ${
//                       transparent ? 'bg-white/10' : 'bg-gradient-to-br from-[#17A1E5]/10 to-[#0E628C]/5'
//                     }`}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 1.5 + i * 0.1 }}
//                     whileHover={{ scale: 1.05 }}
//                   >
//                     <div className="flex items-center justify-between mb-1">
//                       <span className="text-lg">{stat.icon}</span>
//                       <span className={`text-lg font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}>
//                         {stat.value}
//                       </span>
//                     </div>
//                     <p className={`text-xs ${transparent ? 'text-white/70' : 'text-gray-600'}`}>
//                       {stat.label}
//                     </p>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Enhanced Floating Elements */}
//         <motion.div
//           className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#17A1E5]/30 to-[#0E628C]/20 rounded-full blur-3xl"
//           animate={{
//             scale: [1, 1.3, 1],
//             opacity: [0.4, 0.7, 0.4],
//           }}
//           transition={{
//             duration: 4,
//             repeat: Infinity,
//             ease: "easeInOut",
//           }}
//         />
        
//         <motion.div
//           className="absolute -bottom-8 -left-8 w-36 h-36 bg-gradient-to-br from-[#0E628C]/30 to-[#17A1E5]/20 rounded-full blur-3xl"
//           animate={{
//             scale: [1.3, 1, 1.3],
//             opacity: [0.3, 0.6, 0.3],
//           }}
//           transition={{
//             duration: 5,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 1,
//           }}
//         />

//         <motion.div
//           className="absolute top-1/2 -right-4 w-24 h-24 bg-gradient-to-br from-green-400/20 to-green-600/10 rounded-full blur-2xl"
//           animate={{
//             scale: [1, 1.2, 1],
//             opacity: [0.3, 0.5, 0.3],
//           }}
//           transition={{
//             duration: 3,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 0.5,
//           }}
//         />
//       </motion.div>
//     </div>
//   );
// }

import { useCountUp } from '../hooks/useScrollReveal';
import { Reveal } from './Reveal';

function Stat({ target, suffix = '', prefix = '', label, decimals = 0 }) {
  const { ref, count } = useCountUp(target);
  const display = decimals > 0
    ? (count / Math.pow(10, decimals)).toFixed(decimals)
    : count.toLocaleString();

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl lg:text-6xl font-bold text-white mb-2 tabular-nums">
        {prefix}{display}{suffix}
      </div>
    </div>
  );
}

export function AnimatedDashboard() {
  return (
    <section className="py-24 bg-[#080012] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal variant="fade-up">
          <p className="text-center text-purple-300/40 text-sm tracking-widest uppercase mb-14">
            By the numbers
          </p>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {[
            { target: 500, suffix: '+', label: 'Organizations', sublabel: 'already on Glass' },
            { target: 284, prefix: '$', suffix: 'M+', label: 'Managed', sublabel: 'total funds processed' },
            { target: 99, suffix: '.9%', label: 'Uptime', sublabel: 'guaranteed SLA' },
            { target: 48, suffix: 'h', label: 'Setup', sublabel: 'average onboarding time' },
          ].map((stat, i) => (
            <Reveal key={stat.label} variant="fade-up" delay={i * 100}>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums">
                  <StatNumber {...stat} />
                </div>
                <div className="text-white text-sm font-semibold mb-0.5">{stat.label}</div>
                <div className="text-purple-300/40 text-xs">{stat.sublabel}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatNumber({ target, suffix = '', prefix = '' }) {
  const { ref, count } = useCountUp(target);
  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}