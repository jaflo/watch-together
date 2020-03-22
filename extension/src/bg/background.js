var browser = browser || chrome;

let port,
	magnetLink,
	completed = [];

window.shareStatus = "ready";
window.roomLink = "";
window.candidates = [];
window.downloadPercentage = 0;

window.client = new WebTorrent();

browser.browserAction.setBadgeText({
	text: ""
});

browser.runtime.onConnect.addListener(function(newPort) {
	port = newPort;
});

browser.webRequest.onResponseStarted.addListener(
	request => {
		const size = getHeader(request, "Content-Length") | 0;
		const type = getHeader(request, "content-type") || "";

		if (request.statusCode == 206 || type.startsWith("video/")) {
			if (completed.includes(request.url)) return;
			completed.push(request.url);

			window.candidates.push({
				size: size,
				url: request.url,
				logged: new Date()
			});

			// only keep younger than three minutes
			window.candidates = window.candidates.filter(
				entry => new Date().getTime() - entry.logged.getTime() < 3 * 60 * 1000
			);
			sendMessage({
				type: "new candidates"
			});
		}
	},
	{ urls: ["<all_urls>"] },
	["responseHeaders"]
);

function getHeader(request, name) {
	const matches = request.responseHeaders.filter(header => header.name.toLowerCase() === name.toLowerCase());
	if (matches.length > 0) return matches[0].value;
	else return null;
}

window.seedRequest = function(url) {
	window.shareStatus = "downloading";

	const xhr = new XMLHttpRequest();
	xhr.open("get", url);
	xhr.responseType = "blob";
	xhr.onload = () => {
		browser.browserAction.setBadgeText({
			text: "wait"
		});
		window.shareStatus = "submitting";
		sendMessage();

		const blob = xhr.response;
		blob.name = "video.mp4";
		client.seed(blob, torrent => {
			magnetLink = torrent.magnetURI;
			createSharableLink();
		});
	};
	xhr.onprogress = function(e) {
		const percentage = (e.loaded / e.total) * 100;
		window.downloadPercentage = percentage;
		browser.browserAction.setBadgeText({
			text: parseInt(percentage) + "%"
		});
		browser.browserAction.setBadgeBackgroundColor({
			color: "black"
		});
		sendMessage({
			type: "progress update"
		});
	};
	xhr.send();
};

function sendMessage(message) {
	message = message || {};
	try {
		port.postMessage({
			status: window.shareStatus,
			type: "status change",
			...message
		});
	} catch (error) {}
}

function createSharableLink() {
	browser.browserAction.setBadgeText({
		text: "yay"
	});
	browser.browserAction.setBadgeBackgroundColor({
		color: "green"
	});
	const roomId = Math.floor(1e8 + Math.random() * 9e8);
	const b64magnet = btoa(magnetLink.replace("magnet:?", ""));
	roomLink = "https://projects.loud.red/together#" + roomId + "+" + b64magnet;
	window.shareStatus = "serving";
	sendMessage({
		type: "room link ready"
	});
	browser.tabs.create({ url: roomLink });
}

window.stopSharing = function() {
	browser.browserAction.setBadgeText({
		text: ""
	});
	window.client.destroy();
	window.client = new WebTorrent();
	window.shareStatus = "ready";
	sendMessage();
};
