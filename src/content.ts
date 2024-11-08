import { BgColorKey, EpisodeType } from "./types/index";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === "Episode Type") {
        injectFillerInfo(message.episodeType);
        sendResponse({ received: true });
    }

    if (message.message === "Episodes List") {
        injectFillerList(message.types);
        sendResponse({ received: true });
    }
});

function injectFillerInfo(episodeType: EpisodeType) {
    const div = document.querySelector(".c-blog-post");

    const infoElement = document.createElement("div");
    let bgColor = "";

    if (episodeType === "filler") {
        infoElement.textContent =
            "Vous êtes en train de regarder un épisode filler.";
        bgColor = "#d85151";
    } else if (episodeType === "manga_canon" || episodeType === "anime_canon") {
        infoElement.textContent =
            "Vous êtes en train de regarder un épisode canon.";
        bgColor = "#51d88a";
    } else if (episodeType === "mixed_canon/filler") {
        infoElement.textContent =
            "Vous êtes en train de regarder un épisode canon/filler.";
        bgColor = "#d8b751";
    }

    infoElement.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Montserrat', sans-serif;
    `;

    div?.appendChild(infoElement);
}

function injectFillerList(types: EpisodeType[]) {
    const episodes: HTMLElement[] = Array.from(
        document.querySelectorAll(".list li")
    ).reverse() as HTMLElement[];

    episodes.forEach((ep) => {
        const info = document.createElement("div");
        let bgColor: BgColorKey = "#51d88a";

        let bgListColor: Record<BgColorKey, string> = {
            "#d85151": "rgba(216, 81, 81, 0.2)",
            "#51d88a": "rgba(81, 216, 138, 0.2)",
            "#d8b751": "rgba(216, 183, 81, 0.2)",
        };

        const textChild = ep.children[0] as HTMLElement;
        const textSplit = textChild.textContent!.split(" ");

        if (textSplit.length < 2) return;

        const episodeNumber = textSplit[textSplit.length - 2]
            .replace(/^0+/, "")
            .split("x")[0];
        const lastChild = ep.children[1] as HTMLElement;
        lastChild.style.position = "relative";

        const index = parseInt(episodeNumber) - 1;
        if (types[index] === "filler") {
            info.textContent = "Filler";
            bgColor = "#d85151";
        } else if (
            types[index] === "manga_canon" ||
            types[index] === "anime_canon"
        ) {
            info.textContent = "Canon";
            bgColor = "#51d88a";
        } else if (types[index] === "mixed_canon/filler") {
            info.textContent = "Canon/Filler";
            bgColor = "#d8b751";
        }

        ep.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            align-items: center;
            padding: 1rem;
            background-color: ${bgListColor[bgColor]};
        `;

        info.style.cssText = `
            background-color: ${bgColor};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            font-family: 'Montserrat', sans-serif;
        `;

        ep?.insertBefore(info, ep.lastChild);
    });
}
