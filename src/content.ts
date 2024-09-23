import { EpisodeType } from './types/index';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.message === 'Episode Type') {
        injectFillerInfo(message.episodeType);
        sendResponse({ received: true });
    }
});

function injectFillerInfo(episodeType: EpisodeType) {
    const div = document.querySelector('.c-blog-post');

    const infoElement = document.createElement('div');
    let bgColor = '';

    if(episodeType === 'Filler') {
        infoElement.textContent = 'Vous êtes en train de regarder un filler.';
        bgColor = '#d85151';
    }else if(episodeType === 'Manga Canon') {
        infoElement.textContent = 'Vous êtes en train de regarder un épisode canon.';
        bgColor = '#51d88a';
    }else if(episodeType === 'Mixed Canon/Filler') {
        infoElement.textContent = 'Vous êtes en train de regarder un épisode canon/filler.';
        bgColor = '#d8b751';
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