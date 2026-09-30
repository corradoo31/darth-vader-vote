import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase-config.js";

const buttons = [...document.querySelectorAll(".vote")];
const loginButton = document.querySelector("#discord-login");
const logoutButton = document.querySelector("#discord-logout");
const authStatus = document.querySelector("#auth-status");
const authDetail = document.querySelector("#auth-detail");
const result = document.querySelector("#result");
const resultText = document.querySelector("#result-text");
const yesPercent = document.querySelector("#yes-percent");
const noPercent = document.querySelector("#no-percent");
const totalVotes = document.querySelector("#total-votes");
const yesTrack = document.querySelector(".result-track-yes");

const configured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
let supabase;
let activeUserId = null;
let checkingSession = 0;
let submittingVote = false;

function setButtonsDisabled(disabled) {
  buttons.forEach((button) => {
    button.disabled = disabled;
  });
}

function updateTotals(votes) {
  const yes = Number(votes.yes) || 0;
  const no = Number(votes.no) || 0;
  const total = yes + no;
  const yesShare = total === 0 ? 0 : Math.round((yes / total) * 100);
  const noShare = total === 0 ? 0 : 100 - yesShare;

  yesPercent.textContent = `${yesShare}%`;
  noPercent.textContent = `${noShare}%`;
  totalVotes.textContent = total === 1 ? "1 voto totale" : `${total} voti totali`;
  yesTrack.style.width = `${yesShare}%`;
}

function showSubmittedVote(choice) {
  setButtonsDisabled(true);
  buttons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.vote === choice);
  });

  if (choice === "yes") {
    resultText.textContent = "Hai scelto: vuoi Darth_vader_2026 nel server.";
  } else if (choice === "no") {
    resultText.textContent = "Hai scelto: non vuoi Darth_vader_2026 nel server.";
  } else {
    resultText.textContent = "Hai già espresso il tuo voto con questo account Discord.";
  }

  result.classList.remove("hidden");
}

async function refreshTotals() {
  const { data, error } = await supabase.rpc("get_vote_totals");
  if (error) throw error;
  updateTotals(data ?? { yes: 0, no: 0 });
}

async function syncSession(session) {
  const requestId = ++checkingSession;
  const user = session?.user ?? null;
  activeUserId = user?.id ?? null;
  setButtonsDisabled(true);
  result.classList.add("hidden");
  buttons.forEach((button) => button.classList.remove("is-selected"));
  loginButton.hidden = Boolean(user);
  logoutButton.hidden = !user;

  if (!user) {
    authStatus.textContent = "Accedi con Discord per votare.";
    authDetail.textContent = "Il voto è associato al tuo account Discord.";
  } else {
    authStatus.textContent = "Accesso Discord effettuato.";
    authDetail.textContent = "Controllo se hai già votato...";
  }

  try {
    await refreshTotals();
    if (!user) return;

    const { data: existingVote, error } = await supabase
      .from("votes")
      .select("choice")
      .eq("user_id", user.id)
      .maybeSingle();

    if (requestId !== checkingSession) return;
    if (error) throw error;

    if (existingVote) {
      showSubmittedVote(existingVote.choice);
      authDetail.textContent = "Il voto è già stato registrato per questo account.";
    } else {
      authDetail.textContent = "Puoi esprimere un solo voto con questo account.";
      setButtonsDisabled(false);
    }
  } catch (error) {
    if (requestId !== checkingSession) return;
    console.error("Supabase request failed:", error);
    authStatus.textContent = "Non riesco a collegarmi al servizio voti.";
    authDetail.textContent = "Riprova tra poco o contatta chi gestisce il sito.";
  }
}

async function signInWithDiscord() {
  loginButton.disabled = true;
  authStatus.textContent = "Apertura accesso Discord...";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });

  if (error) {
    authStatus.textContent = "Accesso Discord non riuscito.";
    authDetail.textContent = error.message;
    loginButton.disabled = false;
  }
}

async function submitVote(button) {
  if (!activeUserId || submittingVote) return;

  submittingVote = true;
  setButtonsDisabled(true);
  authStatus.textContent = "Registro il tuo voto...";

  const { error } = await supabase.from("votes").insert({
    user_id: activeUserId,
    choice: button.dataset.vote,
  });

  if (error?.code === "23505") {
    authStatus.textContent = "Voto già registrato.";
    await syncSession({ user: { id: activeUserId } });
  } else if (error) {
    console.error("Vote insert failed:", error);
    authStatus.textContent = "Non è stato possibile registrare il voto.";
    authDetail.textContent = "Controlla la connessione e riprova.";
    setButtonsDisabled(false);
  } else {
    showSubmittedVote(button.dataset.vote);
    authStatus.textContent = "Voto registrato.";
    authDetail.textContent = "Grazie per aver partecipato.";
    try {
      await refreshTotals();
    } catch (refreshError) {
      console.error("Could not refresh vote totals:", refreshError);
    }
  }

  submittingVote = false;
}

if (!configured) {
  loginButton.disabled = true;
  authStatus.textContent = "Accesso Discord non configurato.";
  authDetail.textContent = "Il gestore del sito deve collegare Supabase.";
  totalVotes.textContent = "Risultati non disponibili";
  yesPercent.textContent = "—";
  noPercent.textContent = "—";
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  loginButton.disabled = false;

  loginButton.addEventListener("click", signInWithDiscord);
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      authStatus.textContent = "Uscita non riuscita.";
      authDetail.textContent = error.message;
    }
    logoutButton.disabled = false;
  });
  buttons.forEach((button) => {
    button.addEventListener("click", () => void submitVote(button));
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => void syncSession(session), 0);
  });

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    authStatus.textContent = "Impossibile verificare l'accesso.";
    authDetail.textContent = "Ricarica la pagina e riprova.";
  } else {
    await syncSession(data.session);
  }
}
