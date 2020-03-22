<script>
	import { fade } from "svelte/transition";
	import { setupRoom, sendMessage, subscribe } from "./connectivity.js";

	import TogetherPlayer from "./TogetherPlayer.svelte";

	let active = false,
		initPayload,
		allowPlaybackControl;

	const hashValue = window.location.hash;
	const ua = navigator.userAgent.toLowerCase();
	const isSafari = ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;

	if (hashValue) {
		initPayload = hashValue.substr(1);
	}

	function start() {
		setupRoom(initPayload);
		active = true;
		allowPlaybackControl.play();
	}
</script>

<style>
	.cover {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: black;
		z-index: 10;
	}
</style>

{#if initPayload}
	<h2>Join Existing</h2>
	<p>The video is not hosted by us and is shared directly by the participants. Make sure you trust this group.</p>
	{#if isSafari}
		<p>
			Sadly the website does not support well in Safari. While playback works, syncing does not. Please use Chrome
			or Firefox for a better experience.
		</p>
	{/if}
	<button on:click={start} class="primary" disabled={active}>Play video</button>
	<video bind:this={allowPlaybackControl} width="0" height="0" />

	{#if active}
		<div class="cover" transition:fade>
			<TogetherPlayer />
		</div>
	{/if}
{/if}
