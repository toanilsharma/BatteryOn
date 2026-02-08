
import { AnalysisResult } from '../types';

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
}

export const checkAlerts = (data: AnalysisResult): Alert[] => {
  const alerts: Alert[] = [];

  // Voltage Deviations
  if (data.stats.deltaV > 0.100) {
    alerts.push({
      id: `v-crit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: AlertSeverity.CRITICAL,
      title: 'Critical Voltage Imbalance',
      message: `Cell voltage spread of ${data.stats.deltaV.toFixed(3)}V exceeds critical limit (0.100V). Immediate manual balancing required.`,
      acknowledged: false
    });
  } else if (data.stats.deltaV > 0.050) {
    alerts.push({
      id: `v-warn-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: AlertSeverity.WARNING,
      title: 'Voltage Deviation Warning',
      message: `Cell voltage spread of ${data.stats.deltaV.toFixed(3)}V exceeds warning threshold (0.050V). Schedule equalization charge.`,
      acknowledged: false
    });
  }

  // Thermal Runaway Risk
  if (data.thermal?.riskLevel === 'CRITICAL' || data.thermal?.riskLevel === 'HIGH') {
     alerts.push({
       id: `t-crit-${Date.now()}`,
       timestamp: new Date().toISOString(),
       severity: AlertSeverity.CRITICAL,
       title: 'Thermal Runaway Risk',
       message: `Thermal risk level is ${data.thermal.riskLevel}. Max temp deviation is ${data.thermal.tempSpread.toFixed(1)}°C. ISOLATE BANK IMMEDIATELY.`,
       acknowledged: false
     });
  }

  // Capacity Degradation
  if (data.stats.avgCapacityPct && data.stats.avgCapacityPct < 80) {
    alerts.push({
      id: `c-crit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: AlertSeverity.CRITICAL,
      title: 'End of Life Reached',
      message: `Bank capacity is ${data.stats.avgCapacityPct.toFixed(1)}% (<80%). Battery has reached theoretical end of life per IEEE 450. Replacement recommended.`,
      acknowledged: false
    });
  }

  return alerts;
};
