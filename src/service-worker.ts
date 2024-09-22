chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(changeInfo.status === 'complete' && tab.url?.includes("https://v5.voiranime.com/")) {
        chrome.tabs.sendMessage(tabId, { message: 'URL mise à jour' })
        .then(response => { 
                console.log(response.received);
        }).catch(onerror => {
            console.log(onerror)
        });
    }
});