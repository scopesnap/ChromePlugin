function getCleanedPageText() {
  return document.body.innerText.trim();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    const pageText = getCleanedPageText();
    sendResponse({ pageText });
  }
});
