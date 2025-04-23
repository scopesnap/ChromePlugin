let lastScrapedText = '';
let currentTabUrl = '';

document.getElementById("scrape-btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    currentTabUrl = tab.url;

    chrome.tabs.sendMessage(tab.id, { action: "scrape" }, async (response) => {
      lastScrapedText = response.pageText;

      const gptResponse = await fetchGPTExtractedData(lastScrapedText);
      renderServices(gptResponse.services);
      renderHours(gptResponse.hours);
    });
  });
});

async function fetchGPTExtractedData(pageText) {
  const prompt = `
The following is the text from a business website. Extract:
1. A list of services (max 10)
2. A short description for each
3. Opening hours (1 line per day)

Respond in this format:
{
  "services": [
    { "name": "Service", "description": "..." }
  ],
  "hours": ["Monday: ...", "Tuesday: ..."]
}

TEXT:
"""${pageText}"""
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_OPENAI_API_KEY"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    })
  });

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { services: [], hours: [] };
  }
}

function renderServices(services) {
  const container = document.getElementById("services-list");
  container.innerHTML = "";
  services.forEach(({ name, description }) => {
    const div = document.createElement("div");
    const text = `${name}: ${description}`;

    const span = document.createElement("span");
    span.textContent = text;

    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className = "copy-btn";
    btn.onclick = () => copyToClipboard(text);

    div.appendChild(span);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function renderHours(hours) {
  const container = document.getElementById("hours-list");
  container.innerHTML = "";
  hours.forEach(hour => {
    const div = document.createElement("div");

    const span = document.createElement("span");
    span.textContent = hour;

    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className = "copy-btn";
    btn.onclick = () => copyToClipboard(hour);

    div.appendChild(span);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  });
}

document.getElementById("submit-feedback").addEventListener("click", async () => {
  const feedback = {
    services: document.getElementById("gpt-services").value,
    hours: document.getElementById("gpt-hours").value,
    originalText: lastScrapedText,
    sourceUrl: currentTabUrl,
    timestamp: new Date().toISOString()
  };

  await fetch("https://your-server.com/log-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback)
  });

  alert("Thanks! Feedback submitted.");
});
