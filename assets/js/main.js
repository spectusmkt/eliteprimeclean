// Elite Prime Clean — small site helpers
(function () {
  // ===== CONFIG =====
  // Paste the Google Apps Script "Web app" URL here (see SETUP-PLANILHA.md).
  var SHEETS_URL = "";
  var PHONE = "+19733916392";
  var PHONE_DISPLAY = "(973) 391-6392";
  var CONTACT_EMAIL = "contact@eliteprimeclean.com";
  // On phones, open the dialer with our number right after the form is saved.
  var AUTO_OPEN_CALL_ON_MOBILE = true;
  // ==================

  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  function smsLink(body) {
    // "?&body=" works on both iOS and Android
    return "sms:" + PHONE + "?&body=" + encodeURIComponent(body);
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
    if (type === "Commercial") {
      var company = d["Company"] ? " from " + d["Company"] : "";
      return "Hi, this is " + name + company + ". I just requested a walkthrough on your website.";
    }
    return "Hi, this is " + name + ". I just requested a home cleaning quote on your website.";
  }

  function showThanks(form, type, d, skipAutoCall) {
    document.dispatchEvent(new CustomEvent("epc:lead", { detail: { type: type, source: d.source || "" } }));
    var first = (d["Your name"] || "").split(" ")[0];
    var body = smsMessage(type, d);
    form.innerHTML =
      '<div class="form-done">' +
        '<div class="done-icon" aria-hidden="true">✓</div>' +
        "<h3>Thanks" + (first ? ", " + escapeHtml(first) : "") + "! We got your request.</h3>" +
        "<p>Want an answer right now? Give us a call.</p>" +
        '<div class="done-actions">' +
          '<a class="btn btn-gold" href="tel:' + PHONE + '">Call ' + PHONE_DISPLAY + "</a>" +
          '<a class="btn btn-outline" href="' + smsLink(body) + '">Or send a text</a>' +
        "</div>" +
      "</div>";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    if (isMobile && AUTO_OPEN_CALL_ON_MOBILE && !skipAutoCall) {
      setTimeout(function () { window.location.href = "tel:" + PHONE; }, 1200);
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var type = form.getAttribute("data-quote-form");
      var d = collect(form);
      var btn = form.querySelector('button[type="submit"]');

      // Sheet not connected yet: fall back to the visitor's email app.
      if (!SHEETS_URL) {
        var lines = Object.keys(d).filter(function (k) { return d[k]; }).map(function (k) { return k + ": " + d[k]; });
        window.location.href = "mailto:" + CONTACT_EMAIL +
          "?subject=" + encodeURIComponent(type + " cleaning quote request — " + (d["Your name"] || "")) +
          "&body=" + encodeURIComponent(lines.join("\n"));
        showThanks(form, type, d, true);
        return;
      }

      btn.disabled = true;
      btn.textContent = "Sending…";

      var payload = new URLSearchParams();
      payload.append("Type", type);
      payload.append("Page", location.pathname);
      Object.keys(d).forEach(function (k) { payload.append(k, d[k]); });

      fetch(SHEETS_URL, { method: "POST", mode: "no-cors", body: payload })
        .then(function () { showThanks(form, type, d); })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "Try again";
          alert("Sorry, something went wrong. Please call or text us at " + PHONE_DISPLAY + ".");
        });
    });
  });
})();

// ===== Ads tracking, campaign capture, scroll reveal =====
(function () {
  // Sends an event to Google Ads / GA4 (gtag), Google Tag Manager (dataLayer) and Meta Pixel (fbq)
  // if their snippets are installed in the page <head>. Without them, nothing happens.
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (typeof window.fbq === "function") {
      var fb = { call_click: "Contact", text_click: "Contact", generate_lead: "Lead" }[name];
      if (fb) window.fbq("track", fb, params);
    }
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
