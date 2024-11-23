function accessabilityToggle(){
    console.log("accesability toggle worked");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "accessabilityToggle" }, 
            (response) => {
              console.log(response.status);
            }
        );
      });
}
const originalBody = document.getElementsByTagName("body")[0];
console.log(originalBody);
document.getElementById("button").addEventListener("click", accessabilityToggle);


