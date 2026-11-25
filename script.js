const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const today = new Date();
const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

let selectedMonth = today.getMonth();
let selectedYear = today.getFullYear();

// Starts completely empty — user adds all habits
let habits = JSON.parse(localStorage.getItem("bloom_garden_pink_v3")) || [];

// DOM Elements
const habitForm = document.getElementById("habit-form");
const habitInput = document.getElementById("habit-input");
const dailyHabitList = document.getElementById("daily-habit-list");
const monthlyTable = document.getElementById("monthly-table");

const tabDaily = document.getElementById("tab-daily");
const tabMonthly = document.getElementById("tab-monthly");
const dailyView = document.getElementById("daily-view");
const monthlyView = document.getElementById("monthly-view");

const monthSelect = document.getElementById("month-select");
const yearSelect = document.getElementById("year-select");

const dailyPercentEl = document.getElementById("daily-percent");
const dailyCountEl = document.getElementById("daily-count");
const monthlyPercentEl = document.getElementById("monthly-percent");
const monthlyLabelEl = document.getElementById("monthly-label");
const yearlyCountEl = document.getElementById("yearly-count");
const yearlyLabelEl = document.getElementById("yearly-label");
const barPercentEl = document.getElementById("bar-percent");
const progressBarEl = document.getElementById("progress-bar");
const todayDateHeading = document.getElementById("today-date-heading");
const monthlyGridHeading = document.getElementById("monthly-grid-heading");

function formatDate(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// Automatically returns exact days (28, 29 in leap years, 30, or 31)
function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function saveHabits() {
  localStorage.setItem("bloom_garden_pink_v3", JSON.stringify(habits));
}

function initSelectors() {
  MONTHS.forEach((name, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = name;
    if (index === selectedMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  const currentYear = today.getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === selectedYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  todayDateHeading.textContent = `Today — ${today.toDateString()}`;
}

// Only allows toggling today's date; past and future days are locked
function toggleDate(habitId, dateStr) {
  if (dateStr !== todayStr) return;

  habits = habits.map((habit) => {
    if (habit.id !== habitId) return habit;
    const exists = habit.completedDates.includes(dateStr);
    const updatedDates = exists
      ? habit.completedDates.filter((d) => d !== dateStr)
      : [...habit.completedDates, dateStr];
    return { ...habit, completedDates: updatedDates };
  });

  saveHabits();
  renderAll();
}

function deleteHabit(habitId) {
  habits = habits.filter((h) => h.id !== habitId);
  saveHabits();
  renderAll();
}

function renderDailyView() {
  dailyHabitList.innerHTML = "";

  if (habits.length === 0) {
    dailyHabitList.innerHTML = `<p class="empty-msg">No habits yet. Add your first habit above!</p>`;
    return;
  }

  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  habits.forEach((habit) => {
    const isDoneToday = habit.completedDates.includes(todayStr);
    const monthCount = habit.completedDates.filter((d) => d.startsWith(monthPrefix)).length;

    const li = document.createElement("li");
    li.className = `habit-item ${isDoneToday ? "done" : ""}`;

    li.innerHTML = `
      <label class="habit-label">
        <input type="checkbox" ${isDoneToday ? "checked" : ""} />
        <span class="habit-name">${habit.name}</span>
      </label>
      <div class="habit-meta">
        <span class="streak-badge">${monthCount} days this month</span>
        <button class="delete-btn" aria-label="Delete habit">✕</button>
      </div>
    `;

    li.querySelector("input").addEventListener("change", () => toggleDate(habit.id, todayStr));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteHabit(habit.id));

    dailyHabitList.appendChild(li);
  });
}

function renderMonthlyView() {
  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  monthlyGridHeading.textContent = `${MONTHS[selectedMonth]} ${selectedYear} (${daysCount} Days)`;
  monthlyTable.innerHTML = "";

  if (habits.length === 0) {
    monthlyTable.innerHTML = `<tr><td class="empty-msg">Add a habit above to start tracking it across ${MONTHS[selectedMonth]}.</td></tr>`;
    return;
  }

  // Header row (Habit + exact days 1..daysCount + Result)
  const thead = document.createElement("thead");
  let headerHtml = `<tr><th class="habit-col">Habit</th>`;
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = formatDate(selectedYear, selectedMonth, d);
    const isToday = dateStr === todayStr;
    headerHtml += `<th class="${isToday ? "today-header" : ""}">${d}</th>`;
  }
  headerHtml += `<th class="result-col">Result</th></tr>`;
  thead.innerHTML = headerHtml;
  monthlyTable.appendChild(thead);

  // Body rows
  const tbody = document.createElement("tbody");
  habits.forEach((habit) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.className = "habit-col";
    nameTd.textContent = habit.name;
    tr.appendChild(nameTd);

    let completedInMonth = 0;

    for (let d = 1; d <= daysCount; d++) {
      const dateStr = formatDate(selectedYear, selectedMonth, d);
      const isChecked = habit.completedDates.includes(dateStr);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;

      if (isChecked) completedInMonth++;

      const td = document.createElement("td");

      if (isToday) {
        td.className = `day-cell today-cell ${isChecked ? "checked" : ""}`;
        td.textContent = isChecked ? "✓" : "";
        td.title = `Today (${dateStr}) — Click to toggle`;
        td.addEventListener("click", () => toggleDate(habit.id, dateStr));
      } else {
        td.className = `day-cell locked ${isChecked ? "checked" : ""}`;
        td.textContent = isChecked ? "✓" : isPast ? "·" : "";
        td.title = isPast
          ? `Locked (Past day: ${dateStr})`
          : `Locked (Future day: ${dateStr})`;
      }

      tr.appendChild(td);
    }

    const percent = Math.round((completedInMonth / daysCount) * 100);
    const resultTd = document.createElement("td");
    resultTd.className = "result-col";
    resultTd.textContent = `${percent}%`;
    tr.appendChild(resultTd);

    tbody.appendChild(tr);
  });

  monthlyTable.appendChild(tbody);
}

function updateDashboard() {
  const totalHabits = habits.length;

  // 1. Daily Result
  const doneToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const dailyPct = totalHabits === 0 ? 0 : Math.round((doneToday / totalHabits) * 100);
  dailyPercentEl.textContent = `${dailyPct}%`;
  dailyCountEl.textContent = `${doneToday}/${totalHabits} done`;
  barPercentEl.textContent = `${dailyPct}%`;
  progressBarEl.style.width = `${dailyPct}%`;

  // 2. Monthly Result
  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  let totalMonthCheckins = 0;
  habits.forEach((h) => {
    totalMonthCheckins += h.completedDates.filter((d) => d.startsWith(monthPrefix)).length;
  });
  const maxPossibleMonth = totalHabits * daysCount;
  const monthlyPct = maxPossibleMonth === 0 ? 0 : Math.round((totalMonthCheckins / maxPossibleMonth) * 100);
  monthlyPercentEl.textContent = `${monthlyPct}%`;
  monthlyLabelEl.textContent = `${MONTHS[selectedMonth]} ${selectedYear}`;

  // 3. Yearly Result
  const yearPrefix = `${selectedYear}-`;
  let totalYearCheckins = 0;
  habits.forEach((h) => {
    totalYearCheckins += h.completedDates.filter((d) => d.startsWith(yearPrefix)).length;
  });
  yearlyCountEl.textContent = totalYearCheckins;
  yearlyLabelEl.textContent = `Total in ${selectedYear}`;
}

function renderAll() {
  renderDailyView();
  renderMonthlyView();
  updateDashboard();
}

// Event Listeners
habitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = habitInput.value.trim();
  if (!text) return;

  habits.push({
    id: Date.now(),
    name: text,
    completedDates: []
  });

  habitInput.value = "";
  saveHabits();
  renderAll();
});

tabDaily.addEventListener("click", () => {
  tabDaily.classList.add("active");
  tabMonthly.classList.remove("active");
  dailyView.classList.remove("hidden");
  monthlyView.classList.add("hidden");
});

tabMonthly.addEventListener("click", () => {
  tabMonthly.classList.add("active");
  tabDaily.classList.remove("active");
  monthlyView.classList.remove("hidden");
  dailyView.classList.add("hidden");
});

monthSelect.addEventListener("change", (e) => {
  selectedMonth = Number(e.target.value);
  renderAll();
});

yearSelect.addEventListener("change", (e) => {
  selectedYear = Number(e.target.value);
  renderAll();
});

initSelectors();
renderAll();