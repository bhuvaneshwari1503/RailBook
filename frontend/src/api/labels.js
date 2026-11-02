
export const CLASS_LABEL = {
  SL: 'Sleeper (SL)',
  AC3: 'AC 3 Tier (3A)',
  AC2: 'AC 2 Tier (2A)',
  AC1: 'AC First (1A)',
}

export const BERTH_LABEL = {
  LB: 'Lower',
  MB: 'Middle',
  UB: 'Upper',
  SL: 'Side Lower',
  SU: 'Side Upper',
}

// Example: S1-12 · Lower
export const seatText = (p) =>
  `${p.coach}-${p.seatNo}${p.berth ? ` · ${BERTH_LABEL[p.berth] || p.berth}` : ''}`
