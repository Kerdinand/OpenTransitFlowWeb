import { CubicBezierCurve } from 'three';

export class BaseTrackJson {
	bezierCurve: CubicBezierCurve;
	inboundDiverging: string;
	inboundTrack: string;
	lerpSteps: number = 100;
	outboundDiverging: string;
	outboundTrack: string;
	type: string;
	uuid: string;

	constructor(
		bezierCurve: CubicBezierCurve,
		inboundDiverging: string,
		inboundTrack: string,
		outboundDiverging: string,
		outboundTrack: string,
		type: string,
		uuid: string
	) {
		this.bezierCurve = bezierCurve;
		this.inboundDiverging = inboundDiverging;
		this.inboundTrack = inboundTrack;
		this.outboundDiverging = outboundDiverging;
		this.outboundTrack = outboundTrack;
		this.type = type;
		this.uuid = uuid;
	}
}
