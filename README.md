# Together: Watch videos with friends

Use this website to watch videos from slightly sketchy sites in real time. You cannot use this for Netflix or YouTube, use [Netflix Party](https://www.netflixparty.com) or [TogetherTube](https://togethertube.com) for those instead.

This project uses [Svelte](https://svelte.dev), [WebTorrent](https://webtorrent.io), and [Serverless](https://serverless.com) as big building blocks. The project is composed of a browser extension and a website. Copies of [filesize.js](https://filesizejs.com) and [timeago.js](https://timeago.org) are also included.

## Technical Overview

The extension downloads the selected video locally and starts seeding it using WebTorrent. Clients can connect through the website (a unique identifier and information about the torrent are sent as fragment identifier after a pound sign). Communication between clients (to maintain synchronization of playback state) is sent over a websocket hosted on AWS.

## Deployment

```bash
npm install
sls deploy
npm run build
```

## Extension Description

```md
Use this website to watch videos from third-party sites in real time. You cannot use this for Netflix or YouTube, use Netflix Party or TogetherTube for those instead.

INSTRUCTIONS:

1. Open the website with the video you want to share and play it (reload if you opened it before you installed the extension).
2. Click the icon and select the video.
3. Wait for the download to finish.
4. Share the link you get.

PERMISSIONS:
Permission to all websites is needed because any website on any website can be shared and has to be grabbed.
```

## Issues

This project has some known issues. If you have any information about them or discover more, please let me know.

-   Safari does not seem to support seeking through the video supported by WebTorrent. A warning is shown when needed.
-   The extension downloads a lot slower in Firefox than in Chrome for some reason.
-   There is currently no way to cancel a download in the extension.
-   Seeding a file takes a lot of CPU power and spins the fans. I doubt this can be fixed though.
-   Need to determine any sync issues that might still exist.
