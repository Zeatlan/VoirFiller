import * as cheerio from 'cheerio';
import axios from 'axios';
import { AnimeData, EpisodeType } from './types/index';

let animeData: AnimeData | undefined;

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if(changeInfo.status === 'complete' && tab.url?.includes("https://v5.voiranime.com/anime/")) {
    
        animeData = await getAnimeName(tab.url);

        if (animeData && animeData.animeName !== '' && animeData.animeName !== undefined) {
            const { animeName, episode } = animeData;
            const scrapURL = `https://www.animefillerlist.com/shows/${animeName.split(' ').join('-')}`;

            await getFillerList(tabId, scrapURL, episode);
        }

        // chrome.tabs.sendMessage(tabId, { message: 'URL mise à jour' })
        // .then(response => { 
        //         console.log(response.received);
        // }).catch(onerror => {
        //     console.log(onerror)
        // }); 
    }
});

async function getAnimeName(url: string): Promise<AnimeData | undefined> {
    try {
        const response = await axios.get(url);
        if(response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const animeName = $('.breadcrumb').children().last().text().split('-')[0].trim();
            const episode = $('.breadcrumb').children().last().text().split('-')[2].trim();

            if(animeName) {
                return { animeName , episode };
            }
        }
    }catch(error) {
        console.error(error);
        throw error;
    }
}

async function getFillerList(tabId: number, url: string, episode: string) {
    try {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;  
        const response = await axios.get(proxyUrl);
        if(response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const table = $('.EpisodeList').find(`tr#eps-${episode}`)[0];
            const episodeType: EpisodeType = table.children[2].children[0].children[0].data;

            if(episodeType) {
                chrome.tabs.sendMessage(tabId, { message: 'Episode Type', episodeType })
                    .then(response => { 
                        console.log(response.received);
                    }).catch(onerror => {
                        console.log(onerror);
                    });
            }
        }
    }catch(e) {
        console.error(e);
    }
}