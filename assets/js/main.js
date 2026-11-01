// Elite Prime Clean — small site helpers
(function () {
  var CONTACT_EMAIL = "contact@eliteprimeclean.com";

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Quote forms: no backend yet, so the form opens the visitor's
  // email app with every field filled in, addressed to the company.
  // TODO: connect a form service (e.g. Formspree) so leads arrive without email apps.
  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var type = form.getAttribute("data-quote-form");
      var data = new FormData(form);
      var lines = [];
      form.querySelectorAll("[name]").forEach(function (field) {
        var label = form.querySelector('label[for="' + field.id + '"]');
        var value = (data.get(field.name) || "").toString().trim();
        if (value) lines.push((label ? label.textContent : field.name) + ": " + value);
      });

      var subject = type + " cleaning quote request — " + (data.get("name") || "");
      var href = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      window.location.href = href;

      var status = form.querySelector(".form-status");
      if (status) status.classList.add("show");
    });
  });
})();
