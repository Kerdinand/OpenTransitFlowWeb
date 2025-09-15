import { BaseTrack } from './BaseTrack';

export default class TrackWalker {
	currentLocation: BaseTrack;
	previousLocation?: BaseTrack;
	directionFlip: boolean = false;
	constructor(location: BaseTrack) {
		this.currentLocation = location;
	}

	private checkDirectionFlip() {
		if (this.directionFlip) {
			if (
				this.currentLocation.inboundTrack &&
				this.previousLocation &&
				this.previousLocation.uuid ==
					this.currentLocation.inboundTrack.uuid
			) {
				this.directionFlip = !this.directionFlip;
			}
		} else {
			if (
				this.currentLocation.outboundTrack &&
				this.previousLocation &&
				this.previousLocation.uuid ==
					this.currentLocation.outboundTrack.uuid
			) {
				this.directionFlip = !this.directionFlip;
			}
		}
	}

	moveForward() {
		this.checkDirectionFlip();
		if (!this.directionFlip) {
			if (this.currentLocation.outboundTrack) {
				this.previousLocation = this.currentLocation;
				this.previousLocation.setLowestColor();
				this.currentLocation = this.currentLocation.outboundTrack;
				this.currentLocation.MATERIAL.color.setHex(0xd1d1d1);
			}
		} else {
			if (this.currentLocation.inboundTrack) {
				this.previousLocation = this.currentLocation;
				this.previousLocation.setLowestColor();
				this.currentLocation = this.currentLocation.inboundTrack;
				this.currentLocation.MATERIAL.color.setHex(0xd1d1d1);
			}
		}
		return console.log(this.currentLocation.uuid);
	}

	moveBackward() {
		this.checkDirectionFlip();
		if (this.directionFlip) {
			if (this.currentLocation.outboundTrack) {
				this.previousLocation = this.currentLocation;
				this.previousLocation.setLowestColor();
				this.currentLocation = this.currentLocation.outboundTrack;
				this.currentLocation.MATERIAL.color.setHex(0xd1d1d1);
			}
		} else {
			if (this.currentLocation.inboundTrack) {
				this.previousLocation = this.currentLocation;
				this.previousLocation.setLowestColor();
				this.currentLocation = this.currentLocation.inboundTrack;
				this.currentLocation.MATERIAL.color.setHex(0xd1d1d1);
			}
		}
	}
}
