/**
 * RP Volume Landmarks
 * Science-based weekly set volume per muscle group from Renaissance Periodization
 *
 * MV  = Maintenance Volume (keep gains)
 * MEV = Minimum Effective Volume (start growing)
 * MAV = Maximum Adaptive Volume (optimal growth zone)
 * MRV = Maximum Recoverable Volume (overreaching above this)
 */

export interface VolumeLandmarks {
  mv: number;
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrv: number;
}

export type VolumeLandmarkZone = 'below_mv' | 'mv_mev' | 'mev_mav' | 'mav_mrv' | 'above_mrv';

export const RP_VOLUME_LANDMARKS: Record<string, VolumeLandmarks> = {
  chest:        { mv: 8,  mev: 10, mavLow: 12, mavHigh: 20, mrv: 22 },
  'upper back': { mv: 4,  mev: 5,  mavLow: 6,  mavHigh: 10, mrv: 12 },
  lats:         { mv: 6,  mev: 8,  mavLow: 10, mavHigh: 16, mrv: 20 },
  'lower back': { mv: 2,  mev: 3,  mavLow: 4,  mavHigh: 8,  mrv: 10 },
  shoulders:    { mv: 6,  mev: 8,  mavLow: 16, mavHigh: 22, mrv: 26 },
  biceps:       { mv: 4,  mev: 6,  mavLow: 10, mavHigh: 14, mrv: 20 },
  triceps:      { mv: 4,  mev: 6,  mavLow: 10, mavHigh: 14, mrv: 18 },
  forearms:     { mv: 2,  mev: 4,  mavLow: 6,  mavHigh: 10, mrv: 14 },
  quads:        { mv: 6,  mev: 8,  mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings:   { mv: 4,  mev: 6,  mavLow: 10, mavHigh: 16, mrv: 20 },
  glutes:       { mv: 0,  mev: 0,  mavLow: 4,  mavHigh: 12, mrv: 16 },
  calves:       { mv: 4,  mev: 6,  mavLow: 8,  mavHigh: 16, mrv: 20 },
  abs:          { mv: 0,  mev: 0,  mavLow: 8,  mavHigh: 16, mrv: 20 },
  obliques:     { mv: 0,  mev: 0,  mavLow: 4,  mavHigh: 10, mrv: 14 },
};

export function getVolumeZone(currentSets: number, landmarks: VolumeLandmarks): VolumeLandmarkZone {
  if (currentSets < landmarks.mv) return 'below_mv';
  if (currentSets < landmarks.mev) return 'mv_mev';
  if (currentSets <= landmarks.mavHigh) return 'mev_mav';
  if (currentSets <= landmarks.mrv) return 'mav_mrv';
  return 'above_mrv';
}

export function getZoneColor(zone: VolumeLandmarkZone): string {
  switch (zone) {
    case 'below_mv':  return '#6B7280';
    case 'mv_mev':    return '#3B82F6';
    case 'mev_mav':   return '#4ADE80';
    case 'mav_mrv':   return '#FBBF24';
    case 'above_mrv': return '#FF4B4B';
  }
}
