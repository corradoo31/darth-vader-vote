const buttons = document.querySelectorAll(".vote");
const result = document.getElementById("result");
const resultText = document.getElementById("result-text");
const again = document.getElementById("again");
const yesPercent = document.getElementById("yes-percent");
const noPercent = document.getElementById("no-percent");
const totalVotes = document.getElementById("total-votes");
const yesTrack = document.querySelector(".result-track-yes");

const STORAGE_KEY = "darth_vader_2026_votes";

function getVotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { yes: 0, no: 0 };
  } catch {
    return { yes: 0, no: 0 };
  }
}

function saveVotes(votes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

function updatePercentages() {
  const votes = getVotes();
  const total = votes.yes + votes.no;

  const yes = total === 0 ? 0 : Math.round((votes.yes / total) * 100);
  const no = total === 0 ? 0 : 100 - yes;

  yesPercent.textContent = `${yes}%`;
  noPercent.textContent = `${no}%`;
  totalVotes.textContent = total === 1 ? "1 voto totale" : `${total} voti totali`;
  yesTrack.style.width = `${yes}%`;
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const vote = button.dataset.vote;
    const votes = getVotes();

    votes[vote]++;
    saveVotes(votes);
    updatePercentages();

    if (vote === "yes") {
      resultText.textContent = "Hai scelto: vuoi Darth_vader_2026 nel server.";
    } else {
      resultText.textContent = "Hai scelto: non vuoi Darth_vader_2026 nel server.";
    }

    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.45";
    });

    result.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

again.addEventListener("click", () => {
  buttons.forEach((btn) => {
    btn.disabled = false;
    btn.style.opacity = "1";
  });

  result.classList.add("hidden");
});

updatePercentages();
