'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { SkillCertification } from '@/types/providers';

interface SkillMatrixProps {
  matrix: Record<string, Record<string, SkillCertification | null>>;
  providerNames: Record<string, string>;
  services: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  expert: 'bg-purple-100 text-purple-700',
  advanced: 'bg-green-100 text-green-700',
  proficient: 'bg-blue-100 text-blue-700',
  basic: 'bg-yellow-100 text-yellow-700',
  trainee: 'bg-gray-100 text-gray-600',
};

export default function SkillMatrix({ matrix, providerNames, services }: SkillMatrixProps) {
  const providerIds = Object.keys(matrix);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-body font-semibold text-rani-navy p-2 sticky left-0 bg-white">Service</th>
            {providerIds.map(pid => (
              <th key={pid} className="text-center font-body font-semibold text-rani-navy p-2 min-w-[100px]">
                {providerNames[pid] || pid}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((service, i) => (
            <motion.tr
              key={service}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-t border-gray-50"
            >
              <td className="font-body text-rani-navy p-2 sticky left-0 bg-white">{service}</td>
              {providerIds.map(pid => {
                const cert = matrix[pid][service];
                return (
                  <td key={pid} className="text-center p-2">
                    {cert?.certified ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[cert.level] || 'bg-gray-100'}`}>
                          {cert.level}
                        </span>
                      </div>
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-200 mx-auto" />
                    )}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
