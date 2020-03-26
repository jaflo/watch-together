<script>
	import { onMount, createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";
	import { sendMessage, subscribe } from "./connectivity.js";

	export let file;
	export let progress = 0;

	const dispatch = createEventDispatcher();
	let currentTime, duration, video, paused, wrapper, dummy;
	let isFullscreen = false,
		initSyncHappened = false,
		lastTime = 0,
		lagCount = 0,
		hasSyncIssues = false;

	function unfocus() {
		dummy.focus();
	}

	onMount(() => {
		file.renderTo(video, (err, el) => {
			el.controls = false;
			unfocus();
			setInterval(() => {
				if (!hasSyncIssues) {
					if (currentTime <= lastTime) {
						lagCount++;
						if (lagCount >= 2) {
							hasSyncIssues = true;
						}
						sendMessage("sync request");
					} else {
						lagCount = 0;
					}
				}
				lastTime = currentTime;
			}, 1000);
			sendMessage("sync request");
			setTimeout(forceSync, 5000);

			dispatch("loaded");
		});
		video.play();
		video.controls = false;
	});
	subscribe("sync request", () => {
		sendMessage("sync", {
			paused: video.paused,
			currentTime: currentTime
		});
	});
	subscribe("sync", message => {
		if (video.paused != message.paused) {
			message.paused ? video.pause() : video.play();
		}
		const expectedTime = message.currentTime;
		if (expectedTime - currentTime < -2) {
			// someone else is way behind, resync them and ignore
			sendMessage("sync request");
		} else if (Math.abs(currentTime - expectedTime) > 0.2) {
			currentTime = expectedTime;
		}
		lastTime = expectedTime - 1;
		initSyncHappened = true;
	});
	function forceSync() {
		sendMessage("sync request");
		unfocus();
	}

	function togglePlayback() {
		sendMessage("set paused", { paused: !video.paused });
		unfocus();
	}
	subscribe("set paused", message => {
		message.paused ? video.pause() : video.play();
	});

	function jumpBack() {
		if (!initSyncHappened) return;
		sendMessage("jump back", { destTime: Math.max(0, currentTime - 10) });
		unfocus();
	}
	subscribe("jump back", message => {
		lastTime = message.destTime - 1;
		currentTime = message.destTime;
	});

	function format(seconds) {
		if (isNaN(seconds)) return "...";

		const minutes = Math.floor(seconds / 60);
		seconds = Math.floor(seconds % 60);
		if (seconds < 10) seconds = "0" + seconds;

		return `${minutes}:${seconds}`;
	}

	function toggleFullscreen() {
		isFullscreen = document.fullscreenElement;
		if (!isFullscreen) {
			wrapper.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
		unfocus();
	}

	let showControlsTimeout,
		showControls = true;
	function handleMousemove(e) {
		clearTimeout(showControlsTimeout);
		showControlsTimeout = setTimeout(() => (showControls = false), 2500);
		showControls = true;
	}

	function handleKeydown(e) {
		if (e.keyCode == 70) {
			// F
			toggleFullscreen();
		} else if (e.keyCode == 32) {
			// space
			togglePlayback();
		}
	}
</script>

<style>
	.wrapper {
		color: white;
	}

	.hidecursor {
		cursor: none;
	}

	.dummy {
		opacity: 0;
	}

	video {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}

	.controls,
	.overlay,
	.overlay .progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.controls {
		display: flex;
		align-items: center;
		padding-bottom: 4px;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	.controls:before {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 80px;
		background: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
		background: linear-gradient(
			to bottom,
			hsla(0, 0%, 0%, 0) 0%,
			hsla(0, 0%, 0%, 0.009) 8.1%,
			hsla(0, 0%, 0%, 0.034) 15.5%,
			hsla(0, 0%, 0%, 0.073) 22.5%,
			hsla(0, 0%, 0%, 0.123) 29%,
			hsla(0, 0%, 0%, 0.181) 35.3%,
			hsla(0, 0%, 0%, 0.246) 41.2%,
			hsla(0, 0%, 0%, 0.315) 47.1%,
			hsla(0, 0%, 0%, 0.385) 52.9%,
			hsla(0, 0%, 0%, 0.454) 58.8%,
			hsla(0, 0%, 0%, 0.519) 64.7%,
			hsla(0, 0%, 0%, 0.577) 71%,
			hsla(0, 0%, 0%, 0.627) 77.5%,
			hsla(0, 0%, 0%, 0.666) 84.5%,
			hsla(0, 0%, 0%, 0.691) 91.9%,
			hsla(0, 0%, 0%, 0.7) 100%
		);
		content: "";
		display: block;
	}

	.controls.visible {
		opacity: 1;
	}

	button {
		background: none;
		border: 0;
		margin: 0;
		padding: 0.5em;
		line-height: 1;
		z-index: 2;
	}

	button.main {
		padding: 0.5em 2em;
	}

	.controls div {
		margin-left: 1em;
		font-variant-numeric: tabular-nums lining-nums;
		cursor: default;
		z-index: 2;
	}

	.spacer {
		flex: 1;
	}

	.overlay {
		top: 0;
		opacity: 0;
		background: black;
	}

	.overlay .progress div {
		border-bottom: 4px solid;
	}

	.overlay .pause {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2em;
		cursor: default;
	}

	.paused .overlay {
		opacity: 0.6;
	}

	.syncwarning {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 1em;
		background: #faf0ca;
		color: #0d3b66;
		box-shadow: 0 0 10em black, 0 0 3em black;
	}
</style>

<svelte:window on:keydown={handleKeydown} />
<div bind:this={wrapper} class="wrapper" class:paused on:mousemove={handleMousemove} class:hidecursor={!showControls}>
	<video autoplay="true" bind:currentTime bind:duration bind:paused bind:this={video} />
	<button class="dummy" bind:this={dummy} />

	{#if video}
		<div class="overlay" on:click={togglePlayback}>
			<div class="pause">paused</div>
			<div class="progress">
				<div style="width:{(currentTime / duration) * 100}%" />
			</div>
		</div>
		{#if hasSyncIssues}
			<div
				class="syncwarning"
				on:click={() => {
					hasSyncIssues = false;
				}}>
				Your browser seems to be having issues. Switch to Chrome or Firefox for a better experience.
			</div>
		{/if}
		<div class="controls" class:visible={showControls}>
			<button on:click={togglePlayback} title={paused ? 'Play' : 'Pause'} class="main">
				<i class="material-icons">{paused ? 'play_arrow' : 'pause'}</i>
			</button>
			<button on:click={jumpBack} title="Jump back 10 seconds">
				<i class="material-icons">replay_10</i>
			</button>
			<button on:click={forceSync} title="Force sync">
				<i class="material-icons">sync</i>
			</button>

			<div class="duration">{format(currentTime)}/{format(duration)}</div>
			{#if progress < 1}
				<div class="downloaded" title="Download progress" transition:fade>{(progress * 100).toFixed(2)}%</div>
			{/if}

			<div class="spacer" />

			<button on:click={toggleFullscreen} title="Fullscreen">
				<i class="material-icons">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</i>
			</button>
		</div>
	{/if}
</div>
