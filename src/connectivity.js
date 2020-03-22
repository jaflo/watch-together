export let roomId, magnetLink;

function setupRoom(payload) {
	[roomId, magnetLink] = payload.split("+");
	magnetLink = "magnet:?" + atob(magnetLink);
	readiness--;
	if (readiness == 0) messageQueue.forEach(sendMessage);
}

function hashCode(s) {
	for (var i = 0, h = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
	return h;
}

const socket = new WebSocket("wss://hkyr582gyb.execute-api.us-east-1.amazonaws.com/dev");
let readiness = 2;
let messageQueue = [];

socket.onopen = function(event) {
	readiness--;
	if (readiness == 0) messageQueue.forEach(sendMessage);
};

socket.onerror = function(event) {
	console.error("WebSocket error:", event);
};

let eventListeners = {};

socket.onmessage = function(event) {
	const payload = JSON.parse(atob(event.data));
	const signature = hashCode(roomId + ":" + magnetLink + ":" + payload.content);
	if (payload.target == roomId && payload.signature == signature) {
		const message = JSON.parse(payload.content);
		if (message.type in eventListeners) {
			eventListeners[message.type](message);
		}
	}
};

function subscribe(type, callback) {
	eventListeners[type] = callback;
}

function sendMessage(type, message) {
	message = message || {};
	message.type = type;

	if (readiness > 0) {
		messageQueue.push(message);
		return;
	}

	message = JSON.stringify(message);
	message = JSON.stringify({
		target: roomId,
		content: message,
		signature: hashCode(roomId + ":" + magnetLink + ":" + message)
	});
	socket.send(
		JSON.stringify({
			action: "fanout",
			message: btoa(message)
		})
	);
}

export { setupRoom, sendMessage, subscribe };
