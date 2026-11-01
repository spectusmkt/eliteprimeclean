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
