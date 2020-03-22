var browser = browser || chrome;
const bgWindow = browser.extension.getBackgroundPage();
const port = browser.runtime.connect({
	name: "Main"
});

port.onMessage.addListener(function(message) {
	updateView(message);
});

function updateView(message) {
	document.querySelectorAll("main > div").forEach(el => {
		el.style.display = "none";
	});
	const view = document.getElementById(message.status);
	if (view) view.style.display = "block";

	if (bgWindow.shareStatus == "ready") {
		let choiceHTML = "";
		bgWindow.candidates.forEach(candidate => {
			const name = candidate.url.split("/").pop();
			choiceHTML += `<tr data-url="${candidate.url}">
				<td class="name">${name}</td>
				<td class="size">${filesize(candidate.size)}</td>
				<td class="logtime" datetime="${candidate.logged.toISOString()}"></td>
			</tr>`;
		});
		document.querySelector("#candidates tbody").innerHTML = choiceHTML;
		document.querySelectorAll("#candidates tbody tr").forEach(el => {
			el.addEventListener("click", startDownload);
		});
		function startDownload(e) {
			bgWindow.seedRequest(e.target.closest("tr").dataset.url);
		}

		if (choiceHTML) {
			timeago.render(document.querySelectorAll(".logtime"));
			document.getElementById("candidates").style.display = "block";
		} else {
			document.querySelector("#candidates tbody").innerHTML =
				"Start playing the video you want to share and check again.";
			document.getElementById("candidates").style.display = "none";
		}
	} else if (bgWindow.shareStatus == "downloading") {
		document.querySelector("#downloading .progress div").style.width = bgWindow.downloadPercentage + "%";
		document.querySelector("#downloading span").innerText = bgWindow.downloadPercentage.toFixed(2) + "%";
	} else if (bgWindow.shareStatus == "serving") {
		document.querySelector("#serving input").value = bgWindow.roomLink;
	}
}

updateView({
	status: bgWindow.shareStatus
});

function updateUpDown() {
	document.querySelector("#serving .up").innerText = filesize(bgWindow.client.uploadSpeed);
	document.querySelector("#serving .down").innerText = filesize(bgWindow.client.downloadSpeed);
}

setInterval(updateUpDown, 1000);
updateUpDown();

document.querySelector("#serving button").addEventListener("click", bgWindow.stopSharing);
document.querySelector("#serving input").addEventListener("click", () => {
	document.querySelector("#serving input").select();
	document.execCommand("copy");
});
if (bgWindow.shareStatus == "serving") {
	document.querySelector("#serving input").select();
}
