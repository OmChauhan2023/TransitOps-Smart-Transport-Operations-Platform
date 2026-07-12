import React from 'react';

const ACCENT_HEX: Record<string, string> = {
  purple: '#5B2EBF',
  green: '#22B573',
  amber: '#E8952E',
  blue: '#3373DC',
  yellow: '#F4B740',
  gray: '#9C9AA6',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: 'purple' | 'green' | 'amber' | 'blue' | 'yellow' | 'gray';
  suffix?: string;
  testId?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  accent = 'purple',
  suffix = '',
  testId,
}) => {
  return (
    <div
      data-testid={testId}
      className="relative rounded-xl p-5 flex flex-col gap-2.5 bg-white overflow-hidden shadow-xs"
      style={{ border: '1px solid #EDEDF2' }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, backgroundColor: ACCENT_HEX[accent] }}
      />
      <div
        className="text-[11px] uppercase tracking-wider font-medium"
        style={{ color: '#6B6976' }}
      >
        {label}
      </div>
      <div
        className="font-bold text-3xl tabular-nums leading-none"
        style={{ color: '#1B1A22', letterSpacing: '-0.02em', fontFamily: 'Archivo, system-ui, sans-serif' }}
      >
        {value}
        {suffix && (
          <span className="text-lg ml-0.5 font-normal" style={{ color: '#6B6976' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
