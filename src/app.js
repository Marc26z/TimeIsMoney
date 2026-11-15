import { BLS } from "./data.js";
import {
  formatRate,
  formatWeeklyEarnings,
  hourlyRate,
  parsePrice,
  resultForPrice,
} from "./core.js";

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function readableDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? isoDate : dateFormatter.format(date);
}

function workDescription(parts) {
  const { hours, minutes } = parts;
  if (hours === 0 && minutes === 0) return "No work at all.";
  if (hours === 0 && minutes === 1) return "About 1 minute of gross pay.";
  if (hours === 0) return `About ${minutes} minutes of gross pay.`;
  if (minutes === 0) {
    return hours === 1
      ? "About 1 hour of gross pay."
      : `About ${integer.format(hours)} hours of gross pay.`;
  }
  const hourWord = hours === 1 ? "hour" : "hours";
  const minuteWord = minutes === 1 ? "minute" : "minutes";
  return `About ${integer.format(hours)} ${hourWord} and ${minutes} ${minuteWord} of gross pay.`;
}

export function fillStaticCopy(doc = document, data = BLS) {
  const set = (id, value) => {
    const node = doc.getElementById(id);
    if (node) node.textContent = value;
  };

  const hourly = hourlyRate(data);
  set("rate-pill", `${formatRate(hourly)}/hr`);
  set("bench-weekly", formatWeeklyEarnings(data));
  set("bench-hourly", formatRate(hourly));
  set("bench-period", data.periodLabel);
  set("method-weekly", formatWeeklyEarnings(data));
  set("method-hourly", formatRate(hourly));
  set("method-period", data.periodLabel);
  set("updated-date", readableDate(data.retrieved));
  set("release-date", data.releaseDate ? readableDate(data.releaseDate) : data.periodLabel);

  const periodNodes = doc.querySelectorAll("[data-period]");
  periodNodes.forEach((node) => {
    node.textContent = data.periodLabel;
  });
}

export function initApp(doc = document) {
  const view = doc.defaultView ?? globalThis;
  const input = doc.getElementById("price");
  const clearButton = doc.getElementById("clear-btn");
  const exampleButton = doc.getElementById("example-btn");
  const installButton = doc.getElementById("install-btn");
  const result = doc.getElementById("result");
  const resultTime = doc.getElementById("result-time");
  const resultHours = doc.getElementById("result-hours");
  const resultMinutes = doc.getElementById("result-minutes");
  const resultNote = doc.getElementById("result-note");
  const statDecimal = doc.getElementById("stat-decimal");
  const statDays = doc.getElementById("stat-days");
  const statWeeks = doc.getElementById("stat-weeks");
  const hint = doc.getElementById("input-hint");

  if (!input || !result || !resultTime || !resultHours || !resultMinutes) {
    throw new Error("TimeIsMoney UI is missing required elements");
  }

  fillStaticCopy(doc, BLS);

  const defaultHint = "Dollars and cents. No sign-up, no math.";

  function setHint(message, isError = false) {
    if (!hint) return;
    hint.textContent = message;
    hint.dataset.state = isError ? "error" : "";
  }

  function showEmpty() {
    result.dataset.state = "empty";
    resultHours.textContent = "0";
    resultMinutes.textContent = "00";
    resultTime.dataset.size = "normal";
    resultNote.textContent = "Enter a price to see the hours.";
    resultTime.setAttribute("aria-label", "No price entered");
    if (statDecimal) statDecimal.textContent = "—";
    if (statDays) statDays.textContent = "—";
    if (statWeeks) statWeeks.textContent = "—";
    if (clearButton) clearButton.hidden = true;
    setHint(defaultHint);
  }

  function showInvalid() {
    result.dataset.state = "invalid";
    resultHours.textContent = "—";
    resultMinutes.textContent = "";
    resultTime.dataset.size = "normal";
    resultNote.textContent = "That doesn't look like a price.";
    resultTime.setAttribute("aria-label", "Invalid price");
    if (statDecimal) statDecimal.textContent = "—";
    if (statDays) statDays.textContent = "—";
    if (statWeeks) statWeeks.textContent = "—";
    if (clearButton) clearButton.hidden = false;
    setHint("Use a number, like 200.45.", true);
  }

  function showResult(amount) {
    const calculated = resultForPrice(amount, BLS);
    if (!calculated) {
      showInvalid();
      return;
    }

    const { parts, decimalHours, workdays, workweeks } = calculated;
    const hoursText = integer.format(parts.hours);
    const timeLength = hoursText.length + 4;
    result.dataset.state = "valid";
    resultHours.textContent = hoursText;
    resultMinutes.textContent = String(parts.minutes).padStart(2, "0");
    resultTime.dataset.size = timeLength > 12 ? "tiny" : timeLength > 9 ? "compact" : "normal";
    resultNote.textContent =
      amount === 0
        ? "Zero work. Zero hours."
        : workDescription(parts);
    resultTime.setAttribute(
      "aria-label",
      amount === 0
        ? "Zero hours of work"
        : `${parts.hours} hours and ${parts.minutes} minutes of work`,
    );
    if (statDecimal) statDecimal.textContent = `${decimalHours} h`;
    if (statDays) statDays.textContent = workdays;
    if (statWeeks) statWeeks.textContent = workweeks;
    if (clearButton) clearButton.hidden = input.value.length === 0;
    setHint(defaultHint);
  }

  function update() {
    const raw = input.value;
    if (raw.trim() === "") {
      showEmpty();
      return;
    }

    const amount = parsePrice(raw);
    if (amount === null) {
      showInvalid();
      return;
    }

    showResult(amount);
  }

  input.addEventListener("input", update);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
  input.addEventListener("blur", () => {
    const amount = parsePrice(input.value);
    if (amount !== null && input.value.trim() !== "") {
      input.value = priceFormatter.format(amount);
    }
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      input.value = "";
      update();
      input.focus();
    });
  }

  if (exampleButton) {
    exampleButton.addEventListener("click", () => {
      input.value = "200.45";
      update();
      input.focus();
    });
  }

  let installPrompt = null;

  function isStandalone() {
    const matchesDisplayMode = view.matchMedia?.("(display-mode: standalone)")?.matches;
    return Boolean(matchesDisplayMode || view.navigator?.standalone);
  }

  function syncInstallButton() {
    if (!installButton) return;
    installButton.hidden = !installPrompt || isStandalone();
  }

  view.addEventListener?.("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    syncInstallButton();
  });

  view.addEventListener?.("appinstalled", () => {
    installPrompt = null;
    syncInstallButton();
  });

  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      try {
        await installPrompt.userChoice;
      } catch {
        // The browser can dismiss the prompt without resolving it.
      }
      installPrompt = null;
      syncInstallButton();
    });
  }

  showEmpty();
  syncInstallButton();

  return { update, input, result };
}

