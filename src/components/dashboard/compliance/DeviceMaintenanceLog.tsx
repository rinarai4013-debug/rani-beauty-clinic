'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Wrench, Gauge, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { MedicalDevice, MaintenanceRecord, CalibrationLog } from '@/types/compliance';

interface DeviceMaintenanceLogProps {
  devices: MedicalDevice[];
  maintenanceRecords: MaintenanceRecord[];
  calibrationLogs: CalibrationLog[];
  score: number;
}

export default function DeviceMaintenanceLog({
  devices, maintenanceRecords, calibrationLogs, score,
}: DeviceMaintenanceLogProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const now = new Date();

  const statusColors: Record<string, string> = {
    operational: 'bg-emerald-50 text-emerald-600',
    maintenance_due: 'bg-amber-50 text-amber-600',
    under_repair: 'bg-orange-50 text-orange-600',
    decommissioned: 'bg-gray-100 text-gray-500',
    recalled: 'bg-red-100 text-red-700',
  };

  const selectedDeviceRecords = selectedDevice
    ? maintenanceRecords.filter((m) => m.deviceId === selectedDevice)
    : [];

  const selectedDeviceCalibrations = selectedDevice
    ? calibrationLogs.filter((c) => c.deviceId === selectedDevice)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">Device Compliance</h2>
              <p className="text-xs font-body text-rani-muted">{devices.length} medical devices tracked</p>
            </div>
          </div>
          <span className={`text-2xl font-body font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((device) => {
          const maintDue = new Date(device.nextMaintenanceDate) <= now;
          const calDue = new Date(device.nextCalibrationDate) <= now;

          return (
            <motion.div
              key={device.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDevice(selectedDevice === device.id ? null : device.id)}
              className={`bg-white/80 backdrop-blur-sm rounded-xl border p-4 cursor-pointer transition-all ${
                selectedDevice === device.id ? 'border-rani-gold ring-1 ring-rani-gold/30' :
                maintDue || calDue ? 'border-amber-200' : 'border-rani-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-body font-bold text-rani-navy">{device.name}</h3>
                  <p className="text-[10px] font-body text-rani-muted">{device.manufacturer} {device.model}</p>
                </div>
                <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${statusColors[device.status]}`}>
                  {device.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-body text-rani-muted">
                <div className="flex justify-between">
                  <span>S/N</span>
                  <span className="font-mono text-rani-navy">{device.serialNumber}</span>
                </div>
                {device.fda510kNumber && (
                  <div className="flex justify-between">
                    <span>510(k)</span>
                    <span className="font-mono">{device.fda510kNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Next Maintenance
                  </span>
                  <span className={maintDue ? 'text-red-600 font-medium' : ''}>{device.nextMaintenanceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> Next Calibration
                  </span>
                  <span className={calDue ? 'text-red-600 font-medium' : ''}>{device.nextCalibrationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class</span>
                  <span>FDA Class {device.deviceClass}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {devices.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-8 text-center">
          <Cpu className="w-10 h-10 text-rani-muted mx-auto mb-3" />
          <p className="text-sm font-body text-rani-muted">No devices tracked</p>
        </div>
      )}

      {/* Selected Device Details */}
      {selectedDevice && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maintenance History */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
            <div className="px-4 py-3 border-b border-rani-border/30">
              <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Maintenance History
              </h3>
            </div>
            <div className="divide-y divide-rani-border/20">
              {selectedDeviceRecords.length === 0 ? (
                <p className="p-4 text-sm font-body text-rani-muted text-center">No maintenance records</p>
              ) : (
                selectedDeviceRecords.map((record) => (
                  <div key={record.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-body font-medium text-rani-navy capitalize">
                          {record.type} - {record.description}
                        </p>
                        <p className="text-[10px] font-body text-rani-muted mt-0.5">
                          By: {record.performedBy} ({record.company}) - ${record.cost}
                        </p>
                      </div>
                      <span className="text-xs font-body text-rani-muted">{record.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calibration History */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
            <div className="px-4 py-3 border-b border-rani-border/30">
              <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Calibration History
              </h3>
            </div>
            <div className="divide-y divide-rani-border/20">
              {selectedDeviceCalibrations.length === 0 ? (
                <p className="p-4 text-sm font-body text-rani-muted text-center">No calibration records</p>
              ) : (
                selectedDeviceCalibrations.map((cal) => (
                  <div key={cal.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cal.overallPass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-body font-medium text-rani-navy">
                            {cal.overallPass ? 'PASS' : 'FAIL'} - {cal.parametersTested.length} params tested
                          </p>
                          <p className="text-[10px] font-body text-rani-muted">By: {cal.calibratedBy}</p>
                        </div>
                      </div>
                      <span className="text-xs font-body text-rani-muted">{cal.calibrationDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
