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
    infoElement.style.cssText = `
        background-color: #d85151;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
    `;

    if(episodeType === 'Filler') {
        infoElement.textContent = 'Vous êtes en train de regarder un filler.';
    }else if(episodeType === 'Manga Canon') {
        infoElement.textContent = 'Vous êtes en train de regarder un épisode canon.';
    }else if(episodeType === 'Mixed Canon/Filler') {
        infoElement.textContent = 'Vous êtes en train de regarder un épisode canon/filler.';
    }

    div?.appendChild(infoElement); 
}