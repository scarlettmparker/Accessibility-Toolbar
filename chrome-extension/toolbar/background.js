// listener to allow new tabs to be opened
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "openTab") {
        chrome.tabs.create({url: request.url});
    }
});