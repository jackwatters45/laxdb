export const POSITIONS = [
  'Attack',
  'Midfield',
  'Face-off',
  'Long Stick Midfield',
  'Defense',
  'Goalie',
] as const;

export const POSITION_SELECT_FIELDS = POSITIONS.map((position) => ({
  label: position,
  value: position,
}));
