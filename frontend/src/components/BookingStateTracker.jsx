import React from 'react';
import { Check, Clock, AlertTriangle, XCircle, RotateCcw, PackageCheck, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { key: 'REQUEST', label: 'REQUEST', shortDesc: 'Initial requirement sent' },
  { key: 'COUNTER_OFFER', label: 'COUNTER-OFFER', shortDesc: 'Terms reviewed / negotiated' },
  { key: 'CONFIRMED', label: 'CONFIRMED', shortDesc: 'Inventory reserved & locked' },
  { key: 'FULFILMENT', label: 'FULFILMENT', shortDesc: 'Logistics & delivery dispatch' },
  { key: 'COMPLETED', label: 'COMPLETED', shortDesc: 'Order fulfilled & returned' },
];

export const BookingStateTracker = ({ currentStatus, hasCounterOffer = false }) => {
  const normStatus = (currentStatus || 'PENDING').toUpperCase();

  // Determine stage index
  // 0: REQUEST (PENDING, ACCEPTED without counter)
  // 1: COUNTER_OFFER
  // 2: CONFIRMED
  // 3: FULFILMENT
  // 4: COMPLETED
  let currentStageIndex = 0;
  let isRejected = normStatus === 'REJECTED';
  let isCancelled = normStatus === 'CANCELLED';

  if (normStatus === 'PENDING') {
    currentStageIndex = hasCounterOffer ? 1 : 0;
  } else if (normStatus === 'COUNTER_OFFER') {
    currentStageIndex = 1;
  } else if (normStatus === 'ACCEPTED') {
    currentStageIndex = hasCounterOffer ? 1 : 0;
  } else if (normStatus === 'CONFIRMED') {
    currentStageIndex = 2;
  } else if (normStatus === 'FULFILMENT') {
    currentStageIndex = 3;
  } else if (normStatus === 'COMPLETED') {
    currentStageIndex = 4;
  }

  return (
    <div className="w-full py-2">
      {/* Visual State Progression Track */}
      <div className="relative">
        <div className="flex items-center justify-between relative z-10">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || (idx === currentStageIndex && normStatus === 'COMPLETED');
            const isCurrent = idx === currentStageIndex && !isRejected && !isCancelled;
            const isFuture = idx > currentStageIndex;

            // Semantic Color Determination with new palette
            let circleBg = 'bg-[#F7F4E9] text-slate-400 border-[#E3DEC3]';
            let labelColor = 'text-slate-400';
            let badgeText = null;
            let badgeStyle = '';

            if (isCompleted) {
              circleBg = 'bg-[#2F7D4A] text-white border-[#246139] shadow-xs';
              labelColor = 'text-[#2F7D4A] font-bold';
            } else if (isCurrent) {
              if (stage.key === 'REQUEST') {
                circleBg = 'bg-[#D99B26] text-white border-[#B88019] ring-4 ring-[#FFF3D4]';
                labelColor = 'text-[#8C6214] font-bold';
                badgeText = 'Awaiting Provider';
                badgeStyle = 'bg-[#FFF3D4] text-[#8C6214] border-[#F0D597]';
              } else if (stage.key === 'COUNTER_OFFER') {
                circleBg = 'bg-[#082D46] text-white border-[#052338] ring-4 ring-[#E8F0F5]';
                labelColor = 'text-[#082D46] font-bold';
                badgeText = 'Negotiating';
                badgeStyle = 'bg-[#EBF2F7] text-[#082D46] border-[#D0E2ED]';
              } else if (stage.key === 'CONFIRMED') {
                circleBg = 'bg-[#2F7D4A] text-white border-[#246139] ring-4 ring-[#E7F4EA]';
                labelColor = 'text-[#2F7D4A] font-bold';
                badgeText = 'Inventory Locked';
                badgeStyle = 'bg-[#E7F4EA] text-[#2F7D4A] border-[#C5E5CE]';
              } else if (stage.key === 'FULFILMENT') {
                circleBg = 'bg-[#082D46] text-white border-[#052338] ring-4 ring-[#E8F0F5]';
                labelColor = 'text-[#082D46] font-bold';
                badgeText = 'In Dispatch';
                badgeStyle = 'bg-[#EBF2F7] text-[#082D46] border-[#D0E2ED]';
              }
            } else if (isRejected || isCancelled) {
              circleBg = 'bg-[#F7F4E9] text-slate-400 border-[#E3DEC3]';
              labelColor = 'text-slate-400';
            }

            return (
              <div key={stage.key} className="flex flex-col items-center relative group flex-1">
                {/* Connecting Line (left of node) */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-[3px] -z-10 transition-colors duration-300 ease-out ${
                      idx <= currentStageIndex && !isRejected && !isCancelled
                        ? 'bg-[#2F7D4A]'
                        : 'bg-[#E3DEC3]'
                    }`}
                  />
                )}

                {/* Node icon circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs transition-all duration-200 ease-out font-semibold group-hover:scale-105 ${circleBg}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3] transition-transform duration-200" />
                  ) : isCurrent ? (
                    stage.key === 'CONFIRMED' ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : stage.key === 'COUNTER_OFFER' ? (
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 stroke-[2.5] animate-pulse" />
                    )
                  ) : (
                    <span className="text-[11px]">{idx + 1}</span>
                  )}
                </div>

                {/* Text Label */}
                <div className="text-center mt-2">
                  <div className={`text-[10px] sm:text-[11px] tracking-wider uppercase font-heading transition-colors duration-200 ${labelColor}`}>
                    {stage.label} {isCompleted && '✓'}
                  </div>
                  {badgeText && (
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-[9px] rounded-full font-bold border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Notice for Cancelled / Rejected */}
      {(isRejected || isCancelled) && (
        <div className="mt-3 p-2.5 rounded-xl bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-[#C81E1E] shrink-0" />
          <span className="font-semibold">
            Status: {normStatus} — This booking request was discontinued and does not block inventory.
          </span>
        </div>
      )}
    </div>
  );
};

