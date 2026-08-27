/* ==========================================================================
   RCF English - contact forms

   This website is a set of plain files on GitHub Pages. There is no server
   behind it, so nothing can be "submitted" anywhere. These forms therefore do
   one honest thing: they write your message for you and hand it to WhatsApp or
   to your own email program, where you press send yourself.

   Mark up a form like this:

     <form data-message-form data-mode="whatsapp" data-subject="Resource correction">
   ========================================================================== */

import { esc, whatsappLink, CONFIG } from "./lib.js";

function fieldWrap(control) {
  return control.closest(".field") || control.parentElement;
}

function clearError(control) {
  const wrap = fieldWrap(control);
  if (!wrap) return;
  wrap.classList.remove("field--error");
  const message = wrap.querySelector(".field__error");
  if (message) message.remove();
  control.removeAttribute("aria-invalid");
  control.removeAttribute("aria-describedby");
}

function setError(control, text) {
  const wrap = fieldWrap(control);
  if (!wrap) return;
  clearError(control);
  wrap.classList.add("field--error");
  const id = `${control.id || control.name}-error`;
  const message = document.createElement("p");
  message.className = "field__error";
  message.id = id;
  message.textContent = text;
  wrap.appendChild(message);
  control.setAttribute("aria-invalid", "true");
  control.setAttribute("aria-describedby", id);
}

/** The visible label, without the "(required)" note that follows it. */
function labelTextFor(form, control) {
  const label = form.querySelector(`label[for="${control.id}"]`);
  if (!label) return "";
  return label.textContent.replace(/\(required\)/i, "").replace(/\s+/g, " ").trim();
}

function validate(form) {
  const problems = [];
  form.querySelectorAll("[data-required]").forEach((control) => {
    clearError(control);
    const value = String(control.value || "").trim();
    if (!value) {
      const name = labelTextFor(form, control);
      const isChoice = control.tagName === "SELECT";
      setError(
        control,
        name
          ? `Please ${isChoice ? "choose" : "fill in"} ${name.toLowerCase()}.`
          : "Please complete this field."
      );
      problems.push(control);
      return;
    }
    if (control.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(control, "Please write a complete email address, for example name@example.com.");
      problems.push(control);
    }
  });
  return problems;
}

function buildMessage(form) {
  const lines = [];
  const subject = form.getAttribute("data-subject");
  if (subject) lines.push(`${subject}`, "");

  form.querySelectorAll("[data-field]").forEach((control) => {
    const value = String(control.value || "").trim();
    if (!value) return;
    const name = control.getAttribute("data-field") || labelTextFor(form, control) || control.name;
    lines.push(`${name}: ${value}`);
  });

  return lines.join("\n");
}

function summaryBox(form) {
  let box = form.querySelector("[data-form-summary]");
  if (!box) {
    box = document.createElement("div");
    box.setAttribute("data-form-summary", "");
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.className = "callout callout--tip mt-4";
    form.appendChild(box);
  }
  return box;
}

document.querySelectorAll("[data-message-form]").forEach((form) => {
  form.setAttribute("novalidate", "novalidate");

  form.querySelectorAll("[data-required]").forEach((control) => {
    control.addEventListener("input", () => clearError(control));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const problems = validate(form);
    if (problems.length) {
      const box = summaryBox(form);
      box.className = "callout callout--legal mt-4";
      box.innerHTML = `<p class="callout__title">Please check the form</p>
        <p class="mb-0">${problems.length === 1 ? "One field needs" : `${problems.length} fields need`} attention. The problem is described beside each one.</p>`;
      problems[0].focus();
      return;
    }

    const message = buildMessage(form);
    const mode = form.getAttribute("data-mode") || "whatsapp";
    const box = summaryBox(form);

    if (mode === "email") {
      const subject = form.getAttribute("data-subject") || "Message from the RCF English website";
      const href = `mailto:${CONFIG.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        message
      )}`;
      box.className = "callout callout--tip mt-4";
      box.innerHTML = `<p class="callout__title">Your email is ready</p>
        <p>Your email program should now open with the message already written. If nothing happened, use the button below, or copy the message and send it to
        <a href="mailto:${esc(CONFIG.email || "")}">${esc(CONFIG.email || "")}</a> yourself.</p>
        <p class="mb-0"><a class="btn btn--sm btn--primary" href="${esc(href)}">Open my email program</a></p>`;
      window.location.href = href;
      return;
    }

    const href = whatsappLink(message);
    box.className = "callout callout--tip mt-4";
    box.innerHTML = `<p class="callout__title">Your WhatsApp message is ready</p>
      <p>WhatsApp should now open with the message already written. Read it, then press send yourself. Nothing is sent from this website.</p>
      <p class="mb-0"><a class="btn btn--sm btn--whatsapp" href="${esc(href)}" target="_blank" rel="noopener">Open WhatsApp (${esc(
      CONFIG.whatsappDisplay || ""
    )})</a></p>`;
    window.open(href, "_blank", "noopener");
  });
});
