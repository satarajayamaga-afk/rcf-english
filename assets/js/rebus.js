/* ==========================================================================
   RCF English - rebus readers

   One job: the "Show the words" button. Each picture in a story is wrapped
   in a span carrying the word it stands for, so swapping between picture and
   word needs no second copy of the story and nothing is fetched.

   Without this script the stories still read perfectly - the pictures are
   there, each with the word as its alt text. The button is an extra for
   checking afterwards, not the way the page works.
   ========================================================================== */

(function () {
  "use strict";

  var stories = document.querySelectorAll("[data-rebus]");
  if (!stories.length) return;

  Array.prototype.forEach.call(stories, function (story) {
    var button = story.querySelector("[data-rebus-toggle]");
    if (!button) return;

    var showing = false;

    button.addEventListener("click", function () {
      showing = !showing;
      story.classList.toggle("rebus--words", showing);
      button.textContent = showing ? "Show the pictures" : "Show the words";

      /* The swap is visual only. The picture keeps its alt text at all times,
         so a screen reader reads the same sentence either way; the written
         word is a duplicate for the eye and stays hidden from it. Marking
         both hidden - which an earlier version of this did - would have left
         a blind child hearing nothing at all. */
      if (showing) {
        Array.prototype.forEach.call(story.querySelectorAll(".rebus__swap"), function (swap) {
          if (swap.querySelector(".rebus__word")) return;
          var word = document.createElement("span");
          word.className = "rebus__word";
          word.setAttribute("aria-hidden", "true");
          word.textContent = swap.getAttribute("data-word") || "";
          swap.appendChild(word);
        });
      }
    });
  });
})();
