import * as cheerio from "cheerio";
import axios from "axios";
import { AnimeData, EpisodeType } from "./types/index";

let animeData: AnimeData | undefined;
let isEpisodePage = false;
let startDate: Date, endDate: Date;
let isSeason = false;
let allEpisodes: EpisodeType[] = [];

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const animeUrlEpisode =
        /https:\/\/v3\.voiranime\.ws\/anime\/[^\/]+\/[^\/]+/;
    const animeUrl = /https:\/\/v3\.voiranime\.ws\/anime\/[^\/]+\/$/;

    console.log(changeInfo.status);
    console.log(animeUrl.test(tab.url || ""));
    console.log(animeUrlEpisode.test(tab.url || ""));
    console.log(tab);
    if (
        changeInfo.status === "complete" &&
        (animeUrl.test(tab.url || "") || animeUrlEpisode.test(tab.url || ""))
    ) {
        if (animeUrlEpisode.test(tab.url || "")) {
            isEpisodePage = true;
        } else {
            isEpisodePage = false;
        }

        console.log(isEpisodePage);

        animeData = await getAnimeName(tab.url!, tabId);

        if (
            animeData &&
            animeData.animeName !== "" &&
            animeData.animeName !== undefined
        ) {
            const { animeName, episode } = animeData;

            const scrapURL = `https://www.animefillerlist.com/shows/${animeName
                .split(" ")
                .join("-")}`;

            if (animeUrlEpisode.test(tab.url || "") && episode) {
                await getUniqueEpisode(tabId, scrapURL, episode);
            }

            if (animeUrl.test(tab.url || "")) {
                await getEpisodesList(tabId, scrapURL);
            }
        }
    }
});

function formatDate(dateString: string): Date {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    return new Date(`${year}-${month}-${day}`);
}

async function checkSeasons(
    name: string,
    tabId: number
): Promise<{ startDate: Date; endDate: Date } | null> {
    if (name.includes("Season")) {
        const currentTab = (await chrome.tabs.get(tabId)).url;
        if (currentTab === undefined) return null;

        const response = await axios.get(currentTab);
        const $ = cheerio.load(response.data);

        const startDate = formatDate(
            $(".post-content_item")[8].children[3].children[0].data
        );
        const endDate = formatDate(
            $(".post-content_item")[9].children[3].children[0].data
        );

        return { startDate, endDate };
    }

    return null;
}

async function getAnimeName(
    url: string,
    tabId: number
): Promise<AnimeData | undefined> {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            startDate = "";
            endDate = "";
            isSeason = false;

            const html = response.data;
            const $ = cheerio.load(html);

            if (isEpisodePage) {
                const animeName = $(".breadcrumb")
                    .children()
                    .last()
                    .text()
                    .split("-")[0]
                    .trim();
                const episode = $(".breadcrumb")
                    .children()
                    .last()
                    .text()
                    .split("-")[2]
                    .trim();

                if (animeName) {
                    return { animeName, episode };
                }
            }

            // On anime episodes listing page
            let englishName = $(".post-content_item")[2]
                .children[3].children[0].data.split("\n")[1]
                .trim();
            englishName = englishName.replace(/[:]/g, "").trim();

            const dates = await checkSeasons(englishName, tabId);

            if (dates) {
                isSeason = true;
                startDate = dates?.startDate;
                endDate = dates?.endDate;

                englishName = englishName.split("Season")[0].trim();
            }

            if (englishName) {
                return { animeName: englishName };
            }
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function requestAnimeFiller(url: string) {
    console.log(url);
    try {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        const response = await axios.get(proxyUrl);
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            return $;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function getUniqueEpisode(tabId: number, url: string, episode: string) {
    const $ = await requestAnimeFiller(url);
    if (!$) return;

    const table = $(".EpisodeList").find(
        `tr#eps-${episode.replace(/^0+/, "").split("x")[0]}`
    )[0];
    const episodeType: EpisodeType = table.attribs.class.split(" ")[0];

    if (episodeType) {
        chrome.tabs
            .sendMessage(tabId, { message: "Episode Type", episodeType })
            .catch((onerror) => console.error(onerror));
    }
}

async function getEpisodesList(tabId: number, url: string) {
    const $ = await requestAnimeFiller(url);
    if (!$) return;
    allEpisodes = [];

    const tables = $(".EpisodeList").find("tr");

    Array.from(tables).forEach((table) => {
        if (Object.keys(table.attribs).length > 0) {
            handleEpisodeAddition(table);
        }
    });

    chrome.tabs
        .sendMessage(tabId, { message: "Episodes List", types: allEpisodes })
        .catch((onerror) => console.error(onerror));
}

function handleEpisodeAddition(table: cheerio.Element) {
    if (isSeason) {
        const episodeDate = table.children[3].children[0].data;
        addDateToTable(episodeDate, table);
    } else {
        allEpisodes.push(table.attribs.class.split(" ")[0]);
    }
}

function addDateToTable(episodeDate: string, table: cheerio.Element) {
    if (episodeDate) {
        const formattedEpisodeDate = formatDate(episodeDate);

        if (
            startDate &&
            endDate &&
            formattedEpisodeDate >= startDate &&
            formattedEpisodeDate <= endDate
        ) {
            allEpisodes.push(table.attribs.class.split(" ")[0]);
        }
    }
}
