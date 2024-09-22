chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received from service worker:', message.message);
    sendResponse({ received: true });
});