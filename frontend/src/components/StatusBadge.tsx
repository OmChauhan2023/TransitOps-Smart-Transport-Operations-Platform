import React from 'react';

const STATUS_COLOR: Record<string, string> = {
  Available: 'green',
  'On Trip': 'blue',
  'In Shop': 'amber',
  Retired: 'red',
  Draft: 'amber',
  Dispatched: 'blue',
  Completed: 'green',
  Cancelled: 'red',
  'On Duty': 'blue',
  'Off Duty': 'gray',
  Suspended: 'red',
  Logged: 'blue',
  Verified: 'green',
};

const SIGNAL_HEX: Record<string, string> = {
  green: '#22B573',
  blue: '#3373DC',
  amber: '#E8952E',
  red: '#DB4444',
  gray: '#9C9AA6',
};

interface StatusBadgeProps {
  status: string;
  testId?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, testId }) => {
  const colorKey = STATUS_COLOR[status] || 'gray';
  const hex = SIGNAL_HEX[colorKey] || SIGNAL_HEX.gray;

  return (
    <span
      data-testid={testId || `status-badge-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono"
      style={{
        backgroundColor: `${hex}1F`,
        color: hex,
        border: `1px solid ${hex}33`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      {status}
    </span>
  );
};

export default StatusBadge;
