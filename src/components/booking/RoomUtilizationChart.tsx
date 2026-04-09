'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { RoomDayView } from '@/lib/booking/calendar';
import { ROOM_COLORS } from '@/lib/booking/types';

interface RoomUtilizationChartProps {
  rooms: RoomDayView[];
}

export default function RoomUtilizationChart({ rooms }: RoomUtilizationChartProps) {
  const data = rooms.map(room => ({
    name: room.roomName,
    value: room.utilizationPercent,
    fill: ROOM_COLORS[room.roomId] ?? '#64748B',
    appointments: room.appointmentCount,
    revenue: room.totalRevenue,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
      <h3 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
        Room Utilization
      </h3>

      <div className="flex items-center gap-8">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const percent = typeof value === 'number' ? value : Number(value ?? 0);
                  return `${percent}%`;
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E8E4DF' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map(room => (
            <div key={room.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: room.fill }} />
                <span className="text-sm font-medium text-[#0F1D2C]">{room.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#0F1D2C]">{room.value}%</span>
                <span className="text-xs text-[#6B7280] ml-2">
                  {room.appointments} apt{room.appointments !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
