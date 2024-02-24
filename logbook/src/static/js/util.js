/** @type {NodeListOf<HTMLTimeElement>} */
const timeElements = document.querySelectorAll("time[datetime]");
for (const el of timeElements) {
    el.textContent = new Date(el.dateTime).toLocaleString();
}