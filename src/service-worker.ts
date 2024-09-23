import * as cheerio from 'cheerio';
import axios from 'axios';
import { AnimeData, EpisodeType } from './types/index';

let animeData: AnimeData | undefined;
let isEpisodePage = false;

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const animeUrlEpisode = /https:\/\/v5\.voiranime\.com\/anime\/[^\/]+\/[^\/]+/;
    const animeUrl = /https:\/\/v5\.voiranime\.com\/anime\/[^\/]+\/$/;

    if (changeInfo.status === 'complete' && (animeUrl.test(tab.url || '') || animeUrlEpisode.test(tab.url || ''))) {

        if(animeUrlEpisode.test(tab.url || '')) {
            isEpisodePage = true;
        }else {
            isEpisodePage = false;
        }

        animeData = await getAnimeName(tab.url!);

        if (animeData && animeData.animeName !== '' && animeData.animeName !== undefined) {
            const { animeName, episode } = animeData;
            const scrapURL = `https://www.animefillerlist.com/shows/${animeName.split(' ').join('-')}`;

            if(animeUrlEpisode.test(tab.url || '') && episode) {
                await getUniqueEpisode(tabId, scrapURL, episode);
            }
            
            if(animeUrl.test(tab.url || '')) {
                await getEpisodesList(tabId, scrapURL);
            }
        } 
    }
});


async function getAnimeName(url: string): Promise<AnimeData | undefined> {
    try {
        const response = await axios.get(url);
        if(response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            
            if(isEpisodePage) {
                const animeName = $('.breadcrumb').children().last().text().split('-')[0].trim();
                const episode = $('.breadcrumb').children().last().text().split('-')[2].trim();

                if(animeName) {
                    return { animeName , episode };
                }
            }

            let englishName = $('.post-content_item')[2].children[3].children[0].data.split('\n')[1].trim();
            englishName = englishName.replace(/[:]/g, '').trim();
            
            if (englishName) {
                return { animeName: englishName };
            }
        }
    }catch(error) {
        console.error(error);
        throw error;
    }
}

async function requestAnimeFiller(url: string) {
    try {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;  
        const response = await axios.get(proxyUrl);
        if(response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            return $;
        }
    }catch(e) {
        console.error(e);
        return null;
    }
}

async function getUniqueEpisode(tabId: number, url: string, episode: string) {
    const $ = await requestAnimeFiller(url);
    if(!$) return;

    const table = $('.EpisodeList').find(`tr#eps-${episode.replace(/^0+/, '').split("x")[0]}`)[0];
    const episodeType: EpisodeType = table.attribs.class.split(' ')[0];

    if(episodeType) {
        chrome.tabs.sendMessage(tabId, { message: 'Episode Type', episodeType }).catch(onerror => console.error(onerror));
    }
}

async function getEpisodesList(tabId: number, url: string) {
    const $ = await requestAnimeFiller(url);
    if(!$) return;
    let allEpisodes: EpisodeType[] = [];

    const tables = $('.EpisodeList').find('tr');

    Array.from(tables).forEach(table => {
        if(Object.keys(table.attribs).length > 0) {
            allEpisodes.push(table.attribs.class.split(' ')[0]);
        }
    });
    console.log(tables);

    chrome.tabs.sendMessage(tabId, { message: 'Episodes List', types: allEpisodes }).catch(onerror => console.error(onerror));
}