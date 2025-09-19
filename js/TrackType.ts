export const TrackTypes = {
	CONCRETE: { nam: 'concrete', hex: '#d1d1d1' },
} as const;

export type TrackType = (typeof TrackTypes)[keyof typeof TrackTypes];
