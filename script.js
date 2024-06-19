document.getElementById("generate-embed").addEventListener("click", () => {
  const username = document.getElementById("twitter-username").value;
  if (username) {
    document.getElementById("twitter-embed").innerHTML = "";
    const blockquote = document.createElement("blockquote");
    blockquote.className = "twitter-tweet";
    const anchor = document.createElement("a");
    anchor.href = `https://twitter.com/${username}`;
    blockquote.appendChild(anchor);
    document.getElementById("twitter-embed").appendChild(blockquote);
    twttr.widgets.load();
    monitorNetworkRequests();
  }
});

function monitorNetworkRequests() {
  const observer = new MutationObserver(() => {
    const iframes = document.getElementsByTagName("iframe");
    for (let iframe of iframes) {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDocument) {
        const xhrOpen = iframeDocument.XMLHttpRequest.prototype.open;
        iframeDocument.XMLHttpRequest.prototype.open = function () {
          this.addEventListener("readystatechange", function () {
            if (this.readyState === 4 && this.status === 200) {
              const authHeader = this.getResponseHeader("authorization");
              if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                localStorage.setItem("twitterBearerToken", token);
                document.getElementById("delete-tweets").style.display =
                  "block";
                // Update the authorization variable in main.js
                authorization = `Bearer ${token}`;
              }
            }
          });
          xhrOpen.apply(this, arguments);
        };
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

document.getElementById("delete-tweets").addEventListener("click", async () => {
  const token = localStorage.getItem("twitterBearerToken");
  if (!token) {
    alert("You need to login first!");
    return;
  }

  // Call the functions from main.js
  if (delete_options["from_archive"] === true) {
    while (twitter_archive_loading_confirmed === false) {
      await sleep(1000);
    }
    tweets_to_delete = parseTweetsFromArchive(twitter_archive_content);
    console.log(tweets_to_delete);
    await delete_tweets(tweets_to_delete);
  } else if (
    delete_options["delete_specific_ids_only"].length === 1 &&
    delete_options["delete_specific_ids_only"][0].length === 0
  ) {
    while (next !== "finished" && stop_signal !== true) {
      entries = await fetch_tweets(next);
      next = await log_tweets(entries);
      await delete_tweets(tweets_to_delete);
      tweets_to_delete = [];
      await sleep(3000);
    }
  } else {
    await delete_tweets(delete_options["delete_specific_ids_only"]);
  }

  alert("Tweets deleted successfully!");
});
