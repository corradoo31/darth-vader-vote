const buttons = document.querySelectorAll(".vote");
const result = document.getElementById("result");
const resultText = document.getElementById("result-text");
const yesPercent = document.getElementById("yes-percent");
const noPercent = document.getElementById("no-percent");
const totalVotes = document.getElementById("total-votes");
const yesTrack = document.querySelector(".result-track-yes");

const STORAGE_KEY = "darth_vader_2026_votes";
const USER_VOTE_KEY = `${STORAGE_KEY}_submitted`;

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

function getSubmittedVote() {
  try {
    const savedVote = localStorage.getItem(USER_VOTE_KEY);
    if (savedVote === "yes" || savedVote === "no") return savedVote;

    const votes = getVotes();
    return votes.yes + votes.no > 0 ? "previous" : null;
  } catch {
    return null;
  }
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

function showSubmittedVote(vote) {
  buttons.forEach((button) => {
    button.disabled = true;
    button.classList.toggle("is-selected", button.dataset.vote === vote);
  });

  if (vote === "yes") {
    resultText.textContent = "Hai scelto: vuoi Darth_vader_2026 nel server.";
  } else if (vote === "no") {
    resultText.textContent = "Hai scelto: non vuoi Darth_vader_2026 nel server.";
  } else {
    resultText.textContent = "Hai già espresso il tuo voto da questo browser.";
  }

  result.classList.remove("hidden");
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const submittedVote = getSubmittedVote();
    if (submittedVote) {
      showSubmittedVote(submittedVote);
      return;
    }

    const vote = button.dataset.vote;
    const votes = getVotes();

    votes[vote]++;
    saveVotes(votes);
    localStorage.setItem(USER_VOTE_KEY, vote);
    updatePercentages();
    showSubmittedVote(vote);
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

updatePercentages();
const submittedVote = getSubmittedVote();
if (submittedVote) showSubmittedVote(submittedVote);
