// Captured 2026-04-20 from https://job-boards.greenhouse.io/discord/jobs/8475182002.
// Minimal subset covering the modern Greenhouse DOM shape we must support.
export const MODERN_DISCORD_FORM_HTML = `
<form id="application-form" class="application--form" data-discover="true">
  <input id="first_name" aria-label="First Name" aria-required="true" type="text" />
  <input id="last_name" aria-label="Last Name" aria-required="true" type="text" />
  <input id="email" aria-label="Email" aria-required="true" type="email" />
  <input id="phone" aria-label="Phone" type="tel" />
  <label id="country-label">Country</label>
  <input id="country" role="combobox" aria-labelledby="country-label" aria-autocomplete="list" type="text" />
  <input id="resume" class="visually-hidden" type="file" />
  <textarea id="question_35845283002" aria-label="Why are you interested in joining Discord?"></textarea>
</form>
`
