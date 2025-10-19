class WSClient {
	private url: string;
	private ws?: WebSocket;
	private queue: string[] = [];
	private reconnectDelay = 1000;

	constructor(url: string) {
		this.url = url;
		this.connect();
	}

	private connect() {
		this.ws = new WebSocket(this.url);

		this.ws.onopen = () => {
			while (this.queue.length) this.ws!.send(this.queue.shift()!);
		};

		this.ws.onclose = () => {
			setTimeout(() => this.connect(), this.reconnectDelay);
			this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
		};

		this.ws.onerror = () => {
			try {
				this.ws?.close();
			} catch {}
		};
	}

	sendJson(obj: unknown) {
		const payload = JSON.stringify(obj);
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(payload);
		} else {
			this.queue.push(payload);
		}
	}
}

export const trackWs = new WSClient('ws://localhost:5189/ws');
