import * as cheerio from "cheerio";
import axios from "axios";
import { AnimeData, EpisodeType } from "./types/index";
import getChildData from "./utils";

let animeData: AnimeData | undefined;
let isEpisodePage = false;
let startDate: Date, endDate: Date;
let isSeason = false;
let allEpisodes: EpisodeType[] = [];

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const animeUrlEpisode =
        /https:\/\/v3\.voiranime\.ws\/anime\/[^\/]+\/[^\/]+/;
    const animeUrl = /https:\/\/v3\.voiranime\.ws\/anime\/[^\/]+\/?$/;

    if (
        changeInfo.status === "complete" &&
        (animeUrl.test(tab.url || "") || animeUrlEpisode.test(tab.url || ""))
    ) {
        if (animeUrlEpisode.test(tab.url || "")) {
            isEpisodePage = true;
        } else {
            isEpisodePage = false;
        }

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
            getChildData(
                $(".post-content_item")[8] as cheerio.TagElement,
                [3, 0]
            )
        );
        const endDate = formatDate(
            getChildData(
                $(".post-content_item")[9] as cheerio.TagElement,
                [3, 0]
            )
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
            startDate = new Date();
            endDate = new Date();
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
            let englishName = $("h1.text-2xl").first().text();

            // Remove ":" from the name. (Example: Naruto: Shippuden)
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
    )[0] as cheerio.TagElement;

    const episodeType: EpisodeType = table.attribs.class.split(
        " "
    )[0] as EpisodeType;

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
        const tagElement = table as cheerio.TagElement;

        if (Object.keys(tagElement.attribs).length > 0) {
            handleEpisodeAddition(tagElement);
        }
    });

    chrome.tabs
        .sendMessage(tabId, { message: "Episodes List", types: allEpisodes })
        .catch((onerror) => console.error(onerror));
}

function handleEpisodeAddition(table: cheerio.TagElement) {
    if (isSeason) {
        const ed = table.children[3] as cheerio.TagElement;
        const episodeDate = ed.children[0].data;
        if (episodeDate) {
            addDateToTable(episodeDate, table);
        }
    } else {
        allEpisodes.push(table.attribs.class.split(" ")[0] as EpisodeType);
    }
}

function addDateToTable(episodeDate: string, table: cheerio.TagElement) {
    if (episodeDate) {
        const formattedEpisodeDate = formatDate(episodeDate);

        if (
            startDate &&
            endDate &&
            formattedEpisodeDate >= startDate &&
            formattedEpisodeDate <= endDate
        ) {
            allEpisodes.push(table.attribs.class.split(" ")[0] as EpisodeType);
        }
    }
}
