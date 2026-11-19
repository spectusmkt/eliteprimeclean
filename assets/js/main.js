// Elite Prime Clean — small site helpers
(function () {
  // ===== CONFIG =====
  // Paste the Google Apps Script "Web app" URL here (see google-sheets/SETUP-PLANILHA.md).
  // While it is empty, the form still opens the call; the details just aren't saved.
  var SHEETS_URL = "https://script.google.com/macros/s/AKfycbz9t5Dt8BS5z7d3US_CDxZdWIK3bfhMuho8cXZS9heljnSemjJ7UVrp2nH6FtvHRJwJbQ/exec";
  var PHONE = "+19733916392";
  var PHONE_DISPLAY = "(973) 391-6392";
  // ==================

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  function smsLink(body) {
    // "?&body=" works on both iOS and Android
    return "sms:" + PHONE + (body ? "?&body=" + encodeURIComponent(body) : "");
  }

  function collect(form) {
    var data = new FormData(form);
    var out = {};
    form.querySelectorAll("[name]").forEach(function (field) {
      var label = form.querySelector('label[for="' + field.id + '"]');
      var key = label ? label.textContent.replace(/\s*\(optional\)\s*/i, "").trim() : field.name;
      out[key] = (data.get(field.name) || "").toString().trim();
    });
    return out;
  }

  function smsMessage(type, d) {
    var name = d["Your name"] || "";
    if (!name) return "";
    if (type === "Commercial") {
      var company = d["Company"] ? " from " + d["Company"] : "";
      var space = d["Type of space"] ? " for a " + d["Type of space"].toLowerCase() : "";
      return "Hi, this is " + name + company + ". I'd like a cleaning walkthrough" + space + ".";
    }
    var service = d["Type of cleaning"] ? " (" + d["Type of cleaning"].toLowerCase() + ")" : "";
    var zip = d["ZIP code"] ? " in " + d["ZIP code"] : "";
    return "Hi, this is " + name + ". I'd like a home cleaning quote" + service + zip + ".";
  }

  // Save the form in the Google Sheet. sendBeacon survives the page handing off to the phone app.
  function saveLead(type, d) {
    if (!SHEETS_URL) return;
    var payload = new URLSearchParams();
    payload.append("Type", type);
    payload.append("Page", location.pathname);
    Object.keys(d).forEach(function (k) { payload.append(k, d[k]); });
    var body = payload.toString();
    var sent = false;
    try {
      sent = navigator.sendBeacon &&
        navigator.sendBeacon(SHEETS_URL, new Blob([body], { type: "application/x-www-form-urlencoded" }));
    } catch (err) {}
    if (!sent) {
      fetch(SHEETS_URL, {
        method: "POST", mode: "no-cors", keepalive: true, body: body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }).catch(function () {});
    }
  }

  function showCalling(form, type, d) {
    var first = (d["Your name"] || "").split(" ")[0];
    form.innerHTML =
      '<div class="form-done">' +
        '<div class="done-icon" aria-hidden="true">✓</div>' +
        "<h3>Thanks" + (first ? ", " + escapeHtml(first) : "") + "! Calling Elite Prime Clean now.</h3>" +
        "<p>If the call didn’t start, tap below or dial " + PHONE_DISPLAY + ".</p>" +
        '<div class="done-actions">' +
          '<a class="btn btn-gold" href="tel:' + PHONE + '">Call ' + PHONE_DISPLAY + "</a>" +
          '<a class="btn btn-outline" href="' + smsLink(smsMessage(type, d)) + '">Send a text instead</a>' +
        "</div>" +
      "</div>";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    var type = form.getAttribute("data-quote-form");

    // "Call now": save the details, then open the phone app right away (same tap, so phones allow it).
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = collect(form);
      saveLead(type, d);
      document.dispatchEvent(new CustomEvent("epc:lead", { detail: { type: type, source: d.source || "" } }));
      if (window.epcTrack) window.epcTrack("call_click", { location: "form: " + (d.source || ""), page: location.pathname });
      window.location.href = "tel:" + PHONE;
      showCalling(form, type, d);
    });

    // "Prefer to send a message?": pre-write the text with whatever they already typed.
    var sms = form.querySelector("[data-form-sms]");
    if (sms) sms.addEventListener("click", function () {
      sms.setAttribute("href", smsLink(smsMessage(type, collect(form))));
    });
  });
})();

// ===== Ads tracking, campaign capture, scroll reveal =====
(function () {
  // Events go ONLY to the dataLayer. Google Tag Manager (GTM-MZ9DWBHB) forwards them to
  // GA4, Google Ads and Meta Pixel. Don't call gtag()/fbq() here too, or every event counts twice.
  //   call_click    -> tap on any phone link, or "Call now" on a form
  //   text_click    -> tap on any text (SMS) link
  //   generate_lead -> form sent to the Google Sheet
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
  }
  window.epcTrack = track;

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    var where = (a.closest("section, header, footer, .mobile-bar") || {}).id || (a.closest(".mobile-bar") ? "mobile-bar" : a.closest("header") ? "header" : "page");
    if (href.indexOf("tel:") === 0) track("call_click", { location: where, page: location.pathname });
    else if (href.indexOf("sms:") === 0) track("text_click", { location: where, page: location.pathname });
  });
  document.addEventListener("epc:lead", function (e) {
    track("generate_lead", { form_type: e.detail.type, form_location: e.detail.source, page: location.pathname });
  });

  // Keep ad click IDs / UTMs and send them with the form, so each lead in the sheet shows its campaign.
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  var params = new URLSearchParams(location.search), store = {};
  try { store = JSON.parse(sessionStorage.getItem("epc_utm") || "{}"); } catch (err) {}
  KEYS.forEach(function (k) { if (params.get(k)) store[k] = params.get(k); });
  try { sessionStorage.setItem("epc_utm", JSON.stringify(store)); } catch (err) {}
  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    Object.keys(store).forEach(function (k) {
      var i = document.createElement("input");
      i.type = "hidden"; i.name = k; i.value = store[k];
      form.appendChild(i);
    });
  });

  // Reveal on scroll
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in"); });
  }

  // Count-up numbers
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-count]").forEach(function (el) {
    if (reduce || !("IntersectionObserver" in window)) return;
    var end = parseFloat(el.getAttribute("data-count")), dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - k, 3));
        el.textContent = v.toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
    o.observe(el);
  });
})();
