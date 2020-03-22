<script>
	import { magnetLink } from "./connectivity.js";

	import Video from "./Video.svelte";

	const client = new WebTorrent();
	let file,
		upSpeed = 0,
		downSpeed = 0,
		progress = 0;

	client.add(magnetLink, function(torrent) {
		file = torrent.files[0];

		function update() {
			upSpeed = torrent.uploadSpeed;
			downSpeed = torrent.downloadSpeed;
			progress = torrent.progress;
		}
		torrent.on("download", update);
		torrent.on("upload", update);
	});
</script>

<style>
	.spinner {
		animation: spin 0.5s infinite linear;
		border: 3px solid #faf0ca;
		border-top-color: transparent;
		width: 2em;
		height: 2em;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 9em;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

{#if file}
	<Video {file} {progress} />
{:else}
	<div class="spinner" />
{/if}
