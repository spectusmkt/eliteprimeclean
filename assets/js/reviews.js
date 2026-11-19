// Elite Prime Clean — Google-style review cards
//
// HOW TO ADD A REVIEW: copy a block below inside REVIEWS and fill it in.
//   name   : reviewer name as shown on Google
//   meta   : optional, e.g. "Local Guide · 14 reviews"
//   when   : e.g. "5 months ago"
//   stars  : 1–5
//   text   : the review text (use the ORIGINAL English text on Google, not the translation)
//   pages  : where it shows: "home", "commercial", "residential", "rentals" (one or more)
//   translated : optional, original language if the text is a translation, e.g. "Portuguese"
//
// Pages with at least one review show the cards; pages with none keep what they had.
(function () {
  var GOOGLE_REVIEWS_URL = "https://search.google.com/local/reviews?placeid=ChIJr-WxygP3wokRds18dQERJek";

  var REVIEWS = [
    {
      name: "Jake Lee",
      meta: "Local Guide · 14 reviews",
      stars: 5,
      text: "I’ve been in the short-term rental and vacation rental management industry for over 6.5 years. In that time, I’ve worked with more than 60 cleaning companies across 7 different states and operated over 230 vacation rentals. With that said, Elite Prime Clean and the owner, Geovana, are in a rare tier. This is a team who takes pride in their work, keep their word, and show up with reliability, professionalism, and accountability. In this business, that is not easy to find. What stands out most is their follow-through. They are trustworthy, responsive, and willing to receive feedback without getting defensive or confrontational. That matters a lot when you are trusting someone with guest-ready standards, property care, and the reputation of your business. This is a company I can genuinely recommend to my network. I hope to do business with Geovana and Elite Prime Clean for many years to come.",
      pages: ["home", "commercial", "rentals"],
    },
    {
      name: "Márcia Brito",
      meta: "Local Guide · 6 reviews",
      stars: 5,
      text: "I had an excellent experience with Elite Prime Clean! The team was highly professional, punctual, reliable, and attentive to every detail. The cleaning service was completed with exceptional care, leaving every area spotless, organized, and feeling fresh. Communication was prompt and courteous from start to finish. I highly recommend Elite Prime Clean to anyone looking for dependable, high-quality residential or commercial cleaning services in Cliffside Park and the surrounding New Jersey area. Outstanding quality, professionalism, and attention to detail. I will definitely use their services again!",
      pages: ["commercial"],
    },
    {
      name: "Williams Lacerda",
      meta: "Local Guide · 92 reviews",
      stars: 5,
      text: "A highly regarded company. They clean with great care and responsibility. I recommend them.",
      translated: "Portuguese",
      pages: ["commercial"],
    },
    {
      name: "Mariana Ramires Lacerda",
      meta: "1 review",
      stars: 5,
      text: "I am absolutely thrilled with the service provided by Elite Prime Clean. The team was punctual, incredibly thorough, and paid close attention to detail. They went above and beyond, making my home look and smell amazing. I would highly recommend them to anyone looking for a reliable and professional cleaning service!",
      pages: ["home", "residential"],
    },
    {
      name: "Patrick Kwon",
      stars: 5,
      text: "Excellent work - we hired them to give our recently renovated 3 bedroom house a deep clean before moving in. There was sawdust all over the floors and they managed to get it ALL out in one day. Will be using them again for our other unit. Highly recommended.",
      pages: ["home", "residential"],
    },
    {
      name: "Rebeca Emily",
      meta: "3 reviews",
      stars: 5,
      text: "Absolutely recommend! The cleaners did an excellent and impeccable work. I was very satisfied with the outcome and will be requesting their services again.",
      pages: ["residential"],
    },
  ];

  var COLORS = ["#1a73e8", "#e8710a", "#188038", "#a142f4", "#d93025", "#12b5cb", "#e52592", "#9334e6"];

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function colorFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  function stars(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= n ? "on" : "off") + '">★</span>';
    return out;
  }

  function card(r) {
    var name = r.name || "Google user";
    return (
      '<article class="g-review">' +
        '<header>' +
          '<span class="g-avatar" style="background:' + colorFor(name) + '" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + "</span>" +
          '<div><b>' + esc(name) + "</b>" + (r.meta ? "<small>" + esc(r.meta) + "</small>" : "") + "</div>" +
        "</header>" +
        '<div class="g-rating"><span class="g-stars" aria-label="' + (r.stars || 5) + ' out of 5 stars">' + stars(r.stars || 5) + "</span>" +
          (r.when ? '<span class="g-when">' + esc(r.when) + "</span>" : "") + "</div>" +
        '<p class="g-text">' + esc(r.text) + "</p>" +
        '<button type="button" class="g-more" hidden>More</button>' +
        '<footer>Posted on Google' + (r.translated ? " · Translated from " + esc(r.translated) : "") + '</footer>' +
      "</article>"
    );
  }

  document.querySelectorAll("[data-reviews]").forEach(function (box) {
    var page = box.getAttribute("data-reviews");
    var limit = parseInt(box.getAttribute("data-limit") || "3", 10);
    var list = REVIEWS.filter(function (r) { return (r.pages || []).indexOf(page) !== -1 && r.text; }).slice(0, limit);

    box.querySelectorAll("[data-google-reviews-link]").forEach(function (a) { a.href = GOOGLE_REVIEWS_URL; });
    document.querySelectorAll("a[data-google-reviews-link]").forEach(function (a) { a.href = GOOGLE_REVIEWS_URL; });

    var grid = box.querySelector(".g-reviews") || box;
    if (!list.length) { box.classList.add("g-empty"); return; }

    grid.innerHTML = list.map(card).join("");
    var fallback = box.getAttribute("data-replaces");
    if (fallback) document.querySelectorAll(fallback).forEach(function (el) { el.style.display = "none"; });

    // "More" for long reviews (clamped to a few lines, like Google)
    grid.querySelectorAll(".g-review").forEach(function (el) {
      var p = el.querySelector(".g-text"), more = el.querySelector(".g-more");
      if (p.scrollHeight > p.clientHeight + 2) {
        more.hidden = false;
        more.addEventListener("click", function () {
          var open = el.classList.toggle("open");
          more.textContent = open ? "Less" : "More";
        });
      }
    });
  });
})();
