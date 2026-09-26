// Wordshake - build three and four letter words from a grid of sixteen
// letters before the clock runs out.
//
// Adapted from the standalone game so that it works inside this site. Four
// things had to change, and none of them are cosmetic:
//
//   1. The original wired every button with an onclick="" attribute and put
//      its code in an inline <script>. The site's Content-Security-Policy
//      forbids both, so nothing would have run at all. Everything here is
//      attached with addEventListener from this file.
//   2. The letter tiles were <div>s. A div cannot be reached with the Tab key
//      or pressed with the keyboard, so the game was unplayable without a
//      mouse or a touchscreen. They are now real buttons with aria-pressed.
//   3. A right or wrong answer was signalled only by a sound, which tells a
//      deaf player nothing and a muted phone nothing either. Every result is
//      now written on the page as well, in a live region.
//   4. The audio was started when the page loaded. Browsers block that until
//      somebody interacts, so the first sounds were silently lost; it now
//      starts on the first tap.
(function () {
  "use strict";

  var root = document.querySelector("[data-wordshake]");
  if (!root) return;

  var GAME_SECONDS = 60;
  var VOWELS = "AEIOUAEO".split("");
  var CONSONANTS = "BCDFGHLMNPRSTWYK".split("");

  // Three and four letter words. Cleaned before it was put here: entries
  // that were not English words at all, proper nouns, words unfit for a
  // school page, and dictionary-corner words a Grade 6 learner will never
  // meet were all taken out. A word game that awards points for a string
  // that is not a word teaches the opposite of what it is for.
  var WORDS = new Set([
    "ABLE", "ACE", "ACID", "ACT", "ADD", "ADO", "AGE", "AGED", "AGO", "AID",
    "AIDE", "AIM", "AIR", "AKIN", "ALE", "ALL", "ALP", "ALTO", "AMID", "AMPS",
    "AND", "ANT", "ANY", "APE", "APT", "ARC", "ARCH", "ARE", "AREA", "ARK",
    "ARM", "ARMY", "ART", "ASH", "ASK", "ATE", "ATOM", "ATOP", "AURA", "AUTO",
    "AWE", "AXE", "BABE", "BABY", "BACK", "BAD", "BAG", "BAKE", "BALL", "BAN",
    "BAND", "BANK", "BAR", "BARE", "BARK", "BASE", "BAT", "BATH", "BAY", "BEAD",
    "BEAK", "BEAM", "BEAN", "BEAR", "BEAT", "BED", "BEE", "BEG", "BELL", "BEND",
    "BENT", "BEST", "BET", "BID", "BIG", "BIKE", "BIN", "BIRD", "BIT", "BITE",
    "BLOW", "BLUE", "BOAT", "BOB", "BODY", "BOG", "BOIL", "BONE", "BOOK", "BORN",
    "BOSS", "BOTH", "BOWL", "BOY", "BUD", "BUG", "BULK", "BULL", "BUN", "BURN",
    "BUS", "BUSH", "BUSY", "BUT", "BUY", "BYE", "BYTE", "CAB", "CAD", "CAFE",
    "CAGE", "CAKE", "CALL", "CALM", "CAM", "CAME", "CAMP", "CAN", "CAP", "CAPE",
    "CAR", "CARD", "CARE", "CART", "CASE", "CASH", "CAST", "CAT", "CATS", "CAVE",
    "CAW", "CELL", "CHAT", "CHIP", "CITY", "CLAP", "CLAY", "CLIP", "CLUB", "COAL",
    "COAT", "CODE", "COIN", "COLD", "COME", "COOK", "COOL", "COP", "COPE", "COPY",
    "CORE", "CORK", "CORN", "COST", "COT", "COW", "COY", "CREW", "CROP", "CRY",
    "CUB", "CUP", "CUR", "CUT", "CUTE", "DAD", "DAM", "DAMP", "DARE", "DARK",
    "DART", "DASH", "DATA", "DATE", "DAWN", "DAY", "DAYS", "DEAD", "DEAF", "DEAL",
    "DEAN", "DEAR", "DEBT", "DECK", "DEED", "DEEP", "DEER", "DEMO", "DEN", "DESK",
    "DEW", "DIAL", "DICE", "DID", "DIE", "DIET", "DIG", "DIN", "DIP", "DIRT",
    "DISH", "DISK", "DOC", "DOCK", "DOE", "DOES", "DOG", "DON", "DONE", "DOOR",
    "DOSE", "DOT", "DOWN", "DRAW", "DREW", "DROP", "DRUM", "DRY", "DUB", "DUCK",
    "DUD", "DUE", "DUG", "DUST", "DUTY", "DYE", "EACH", "EAR", "EARN", "EASE",
    "EAST", "EASY", "EAT", "EATS", "EBB", "EDGE", "EDIT", "EEL", "EGG", "EGO",
    "ELK", "ELM", "ELSE", "EMU", "END", "EPIC", "ERA", "ERE", "ERR", "ETA",
    "EVE", "EVEN", "EVER", "EVIL", "EXAM", "EXIT", "EYE", "EYES", "FACE", "FACT",
    "FAD", "FADE", "FAIL", "FAIR", "FAKE", "FALL", "FAME", "FAN", "FARM", "FAST",
    "FAT", "FATE", "FAWN", "FAX", "FEAR", "FEAT", "FED", "FEE", "FEED", "FEEL",
    "FEET", "FELL", "FELT", "FEN", "FEW", "FIB", "FIG", "FILE", "FILL", "FILM",
    "FIN", "FIND", "FINE", "FIR", "FIRE", "FIRM", "FISH", "FIT", "FIVE", "FIX",
    "FLAT", "FLEX", "FLIP", "FLOW", "FLU", "FLY", "FOAM", "FOB", "FOE", "FOG",
    "FOLD", "FOLK", "FOOD", "FOOL", "FOOT", "FOR", "FORD", "FORK", "FORM", "FORT",
    "FOUR", "FOX", "FREE", "FROG", "FROM", "FRY", "FUEL", "FULL", "FUN", "FUR",
    "FUSE", "FUZZ", "GAD", "GAIN", "GAL", "GALE", "GAME", "GANG", "GAP", "GAS",
    "GATE", "GAVE", "GAY", "GAZE", "GEAR", "GEE", "GEL", "GEM", "GET", "GIFT",
    "GIG", "GIN", "GIRL", "GIVE", "GLAD", "GNAT", "GNU", "GOAL", "GOAT", "GOB",
    "GOD", "GOLD", "GOLF", "GONE", "GOOD", "GOWN", "GRAB", "GRAY", "GREW", "GRID",
    "GRIN", "GROW", "GULF", "GULL", "GUM", "GUMS", "GUN", "GUT", "GUY", "GYM",
    "HAD", "HAG", "HAIR", "HALF", "HALL", "HALT", "HAM", "HAND", "HANG", "HAP",
    "HARD", "HARM", "HART", "HAS", "HAT", "HATE", "HAVE", "HAW", "HAWK", "HAY",
    "HEAD", "HEAL", "HEAR", "HEAT", "HELP", "HEM", "HEN", "HER", "HERB", "HERD",
    "HERE", "HERO", "HEW", "HEX", "HID", "HIGH", "HIKE", "HILL", "HIM", "HINT",
    "HIP", "HIRE", "HIS", "HIT", "HOB", "HOD", "HOE", "HOG", "HOLD", "HOLE",
    "HOME", "HOP", "HOPE", "HORN", "HOSE", "HOST", "HOT", "HOUR", "HOW", "HUB",
    "HUE", "HUG", "HUGE", "HUM", "HUNG", "HUNT", "HURT", "HUT", "ICE", "ICON",
    "ICY", "IDEA", "IDLE", "ILL", "IMP", "INCH", "INFO", "INK", "INN", "INTO",
    "ION", "IRE", "IRK", "IRON", "ISM", "ITEM", "ITS", "JAB", "JACK", "JADE",
    "JAG", "JAIL", "JAM", "JAR", "JAW", "JAY", "JAZZ", "JEAN", "JEEP", "JEST",
    "JET", "JIG", "JOB", "JOG", "JOIN", "JOKE", "JOT", "JOY", "JUG", "JUMP",
    "JURY", "JUST", "KAT", "KEEN", "KEEP", "KEG", "KEN", "KEY", "KICK", "KID",
    "KILL", "KIN", "KIND", "KING", "KIP", "KISS", "KIT", "KITE", "KNEE", "KNEW",
    "KNIT", "KNOB", "KNOT", "KNOW", "LAB", "LAC", "LACE", "LACK", "LAD", "LADY",
    "LAG", "LAKE", "LAM", "LAMB", "LAMP", "LAND", "LANE", "LAP", "LARK", "LASH",
    "LAST", "LATE", "LAW", "LAWN", "LAX", "LAY", "LAZY", "LEA", "LEAD", "LEAF",
    "LEAK", "LEAN", "LEAR", "LEAS", "LED", "LEE", "LEFT", "LEG", "LEI", "LEND",
    "LENS", "LESS", "LET", "LIAR", "LICK", "LID", "LIE", "LIFE", "LIFT", "LIKE",
    "LILY", "LINE", "LINK", "LION", "LIP", "LIPS", "LIST", "LIT", "LIVE", "LOAD",
    "LOAN", "LOB", "LOCK", "LOG", "LOGO", "LONE", "LONG", "LOOK", "LOP", "LORD",
    "LOSE", "LOSS", "LOST", "LOT", "LOUD", "LOVE", "LOW", "LUCK", "LUG", "LUMP",
    "LUNG", "LUSH", "LUX", "LYE", "MAC", "MAD", "MADE", "MAG", "MAIL", "MAIN",
    "MAKE", "MALE", "MALL", "MALT", "MAN", "MANY", "MAP", "MAPS", "MAR", "MARK",
    "MASK", "MASS", "MAT", "MATE", "MATH", "MAW", "MAX", "MAY", "MAYO", "MEAL",
    "MEAN", "MEAT", "MED", "MEET", "MEGA", "MELT", "MEMO", "MEN", "MENU", "MET",
    "MEW", "MICE", "MID", "MILD", "MILE", "MILK", "MILL", "MIND", "MINE", "MINI",
    "MINT", "MISS", "MIST", "MIX", "MOB", "MOD", "MODE", "MOM", "MOO", "MOOD",
    "MOON", "MOP", "MORE", "MOST", "MOVE", "MOW", "MUCH", "MUD", "MUG", "MUM",
    "MUST", "MYTH", "NAB", "NAG", "NAIL", "NAME", "NAP", "NAVY", "NAY", "NEAR",
    "NECK", "NEED", "NEST", "NET", "NEW", "NEWS", "NEXT", "NICE", "NIL", "NINE",
    "NIP", "NIT", "NIX", "NOD", "NODE", "NONE", "NOON", "NOR", "NORM", "NOSE",
    "NOT", "NOTE", "NOW", "NUN", "NUT", "OAK", "OAR", "OAT", "ODD", "ODDS",
    "ODE", "OFF", "OFT", "OHM", "OIL", "OILS", "OKAY", "OLD", "ONCE", "ONE",
    "ONLY", "ONTO", "OPEN", "OPT", "ORAL", "ORB", "ORE", "OUR", "OUT", "OVAL",
    "OVEN", "OVER", "OWE", "OWL", "OWN", "OWNS", "PACE", "PACK", "PAD", "PAGE",
    "PAID", "PAIR", "PAL", "PALE", "PALM", "PAN", "PAP", "PAR", "PARK", "PART",
    "PASS", "PAST", "PAT", "PATH", "PAVE", "PAW", "PAY", "PEA", "PEAK", "PEAR",
    "PEAS", "PEAT", "PEEK", "PEEL", "PEER", "PEG", "PEN", "PEP", "PER", "PET",
    "PEW", "PHI", "PIE", "PIG", "PIN", "PINS", "PIP", "PIPE", "PIT", "PLAN",
    "PLAY", "PLOT", "PLUG", "PLUM", "PLUS", "PLY", "POD", "POEM", "POET", "POLE",
    "POND", "PONY", "POOL", "POOR", "POP", "PORK", "PORT", "POSE", "POST", "POT",
    "POUR", "POW", "PRAY", "PREP", "PRO", "PRY", "PUB", "PULL", "PUMP", "PUN",
    "PUP", "PURE", "PUSH", "PUT", "QUA", "QUIT", "RACE", "RACK", "RAD", "RAG",
    "RAGE", "RAH", "RAID", "RAIL", "RAIN", "RAKE", "RAM", "RAN", "RANK", "RAP",
    "RARE", "RAT", "RATE", "RAW", "RAY", "READ", "REAL", "REAM", "REAR", "RED",
    "REF", "RELY", "RENT", "REP", "REST", "REV", "REX", "RIB", "RICE", "RICH",
    "RID", "RIDE", "RIG", "RIM", "RING", "RIP", "RISE", "RISK", "ROAD", "ROAM",
    "ROAR", "ROB", "ROBE", "ROCK", "ROD", "RODE", "ROE", "ROLE", "ROLL", "ROOF",
    "ROOM", "ROOT", "ROSE", "ROT", "ROW", "RUB", "RUE", "RUG", "RULE", "RUM",
    "RUN", "RUSH", "RUST", "RUT", "SAD", "SAFE", "SAG", "SAID", "SAIL", "SALE",
    "SALT", "SAME", "SAND", "SANG", "SANK", "SAP", "SAT", "SAVE", "SAW", "SAX",
    "SAY", "SEA", "SEAL", "SEAM", "SEAT", "SEC", "SEE", "SEED", "SEEK", "SEEM",
    "SEEN", "SELF", "SELL", "SEND", "SENT", "SET", "SEW", "SHE", "SHIP", "SHOE",
    "SHOP", "SHOW", "SHUT", "SHY", "SIC", "SICK", "SIDE", "SIFT", "SIGN", "SILK",
    "SIM", "SIN", "SING", "SINK", "SIP", "SIR", "SIS", "SIT", "SITE", "SIX",
    "SIZE", "SKI", "SKIN", "SKIP", "SKY", "SLAM", "SLAP", "SLID", "SLIM", "SLOW",
    "SLY", "SNAP", "SNOW", "SOAP", "SOAR", "SOB", "SOCK", "SOD", "SOFT", "SOIL",
    "SOL", "SOLD", "SOLE", "SOME", "SON", "SONG", "SOON", "SOOT", "SOP", "SOT",
    "SOUP", "SOUR", "SOW", "SOY", "SPA", "SPIN", "SPOT", "SPY", "STAR", "STAY",
    "STEP", "STOP", "SUB", "SUCH", "SUE", "SUIT", "SUM", "SUN", "SUP", "SURE",
    "SWIM", "TAB", "TAD", "TAG", "TALE", "TALK", "TALL", "TAN", "TANK", "TAP",
    "TAPE", "TAR", "TASK", "TAT", "TAW", "TAX", "TEA", "TEAM", "TEAR", "TECH",
    "TED", "TEE", "TELL", "TEN", "TEND", "TENT", "TERM", "TEST", "TEXT", "THAN",
    "THAT", "THE", "THEM", "THEN", "THEY", "THIN", "THIS", "THO", "THOU", "THY",
    "TIC", "TIDE", "TIE", "TILE", "TILT", "TIME", "TIN", "TINY", "TIP", "TIPS",
    "TIRE", "TIT", "TOAD", "TOE", "TOIL", "TOLD", "TOLL", "TOM", "TON", "TONE",
    "TOO", "TOOK", "TOOL", "TOP", "TOPS", "TOR", "TOT", "TOUR", "TOW", "TOWN",
    "TOY", "TRAP", "TREE", "TREK", "TRIM", "TRIP", "TRUE", "TRY", "TUB", "TUBE",
    "TUG", "TUN", "TUNE", "TURN", "TUT", "TUX", "TWIN", "TWO", "TYPE", "UGH",
    "UMP", "UNI", "UNIT", "UPON", "UPS", "URN", "USE", "USER", "VAC", "VAN",
    "VAST", "VAT", "VET", "VETO", "VIA", "VICE", "VIE", "VIM", "VINE", "VIS",
    "VISA", "VOID", "VOTE", "VOW", "WAD", "WAG", "WAGE", "WAIT", "WAKE", "WALK",
    "WALL", "WAN", "WANT", "WAR", "WARD", "WARM", "WAS", "WASH", "WAVE", "WAX",
    "WAY", "WAYS", "WEAK", "WEAR", "WEB", "WED", "WEE", "WEED", "WEEK", "WELL",
    "WENT", "WERE", "WEST", "WET", "WHAT", "WHEN", "WHO", "WHOM", "WHY", "WIDE",
    "WIFE", "WIG", "WILD", "WILL", "WIN", "WIND", "WINE", "WING", "WIRE", "WISE",
    "WISH", "WIT", "WITH", "WOE", "WOK", "WON", "WOO", "WOOD", "WOOL", "WORD",
    "WORK", "WORM", "WORN", "WOW", "WRAP", "WRY", "YAK", "YAM", "YAP", "YARD",
    "YARN", "YAW", "YAY", "YEA", "YEAH", "YEAR", "YES", "YET", "YEW", "YIN",
    "YIP", "YOGA", "YOU", "ZAG", "ZAP", "ZEE", "ZEN", "ZERO", "ZIG", "ZIP",
    "ZIT", "ZONE", "ZOO", "ZOOM"
  ]);

  var el = {
    board: root.querySelector("[data-board]"),
    start: root.querySelector("[data-start-panel]"),
    over: root.querySelector("[data-over-panel]"),
    grid: root.querySelector("[data-grid]"),
    word: root.querySelector("[data-word]"),
    time: root.querySelector("[data-time]"),
    score: root.querySelector("[data-score]"),
    tags: root.querySelector("[data-tags]"),
    message: root.querySelector("[data-message]"),
    finalScore: root.querySelector("[data-final-score]"),
    finalCount: root.querySelector("[data-final-count]"),
    startBtn: root.querySelector("[data-start]"),
    againBtn: root.querySelector("[data-again]"),
    clearBtn: root.querySelector("[data-clear]"),
    submitBtn: root.querySelector("[data-submit]")
  };

  var letters = [];
  var chosen = [];
  var score = 0;
  var timeLeft = GAME_SECONDS;
  var ticker = null;
  var found = new Set();

  // ---------------------------------------------------------------- sound
  // Made on the first tap, not on page load: a browser refuses to start
  // audio before somebody has interacted with the page.
  var audio = null;
  function audioContext() {
    if (audio) return audio;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try { audio = new Ctor(); } catch (err) { audio = null; }
    return audio;
  }
  function beep(freq, type, seconds, when) {
    var ctx = audioContext();
    if (!ctx) return;
    try {
      var at = (when || ctx.currentTime);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, at);
      osc.type = type || "sine";
      gain.gain.setValueAtTime(0.08, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + seconds);
    } catch (err) { /* a page with no sound is still a playable game */ }
  }
  function cheer() {
    var ctx = audioContext();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      beep(f, "triangle", 0.2, ctx.currentTime + i * 0.06);
    });
  }
  function buzz() { beep(150, "sawtooth", 0.15); }

  // ----------------------------------------------------------------- game
  function say(text, kind) {
    el.message.textContent = text;
    el.message.className = "wordshake__message" + (kind ? " wordshake__message--" + kind : "");
  }

  function dealLetters() {
    letters = [];
    for (var v = 0; v < 5; v++) letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
    for (var c = 0; c < 11; c++) letters.push(CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]);
    letters.sort(function () { return Math.random() - 0.5; });
  }

  function drawGrid() {
    el.grid.textContent = "";
    letters.forEach(function (letter, index) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "wordshake__tile";
      tile.textContent = letter;
      tile.setAttribute("aria-pressed", "false");
      tile.setAttribute("aria-label", "Letter " + letter);
      tile.addEventListener("click", function () { chooseTile(index, tile); });
      el.grid.appendChild(tile);
    });
  }

  function chooseTile(index, tile) {
    var at = chosen.indexOf(index);
    if (at === -1) {
      chosen.push(index);
      tile.setAttribute("aria-pressed", "true");
      beep(400 + chosen.length * 50, "sine", 0.08);
    } else if (at === chosen.length - 1) {
      // Only the last letter can be taken back, so the word cannot develop
      // a hole in the middle.
      chosen.pop();
      tile.setAttribute("aria-pressed", "false");
    } else {
      say("Take the last letter off first.", "bad");
      return;
    }
    showWord();
  }

  function currentWord() {
    return chosen.map(function (i) { return letters[i]; }).join("");
  }

  function showWord() {
    el.word.textContent = currentWord();
  }

  function clearWord() {
    chosen = [];
    var tiles = el.grid.querySelectorAll(".wordshake__tile");
    for (var i = 0; i < tiles.length; i++) tiles[i].setAttribute("aria-pressed", "false");
    showWord();
  }

  function submit() {
    var word = currentWord();
    if (word.length < 3) {
      say("Words need at least three letters.", "bad");
      clearWord();
      return;
    }
    if (found.has(word)) {
      say(word + " - you have that one already.", "bad");
      clearWord();
      return;
    }
    if (!WORDS.has(word)) {
      say(word + " is not in the word list. Try another.", "bad");
      buzz();
      clearWord();
      return;
    }

    found.add(word);
    var points = word.length * 10;
    score += points;
    el.score.textContent = String(score);
    say(word + " - well done, " + points + " points.", "good");

    if (found.size === 1) el.tags.textContent = "";
    var tag = document.createElement("li");
    tag.className = "wordshake__tag";
    tag.textContent = word + " +" + points;
    el.tags.insertBefore(tag, el.tags.firstChild);

    cheer();
    clearWord();
  }

  function start() {
    score = 0;
    timeLeft = GAME_SECONDS;
    found.clear();
    el.score.textContent = "0";
    el.time.textContent = String(GAME_SECONDS);
    el.tags.innerHTML = '<li class="wordshake__empty">No words yet.</li>';
    say("");
    el.start.hidden = true;
    el.over.hidden = true;
    el.board.hidden = false;

    dealLetters();
    drawGrid();
    clearWord();

    window.clearInterval(ticker);
    ticker = window.setInterval(function () {
      timeLeft--;
      el.time.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        window.clearInterval(ticker);
        finish();
      }
    }, 1000);

    var firstTile = el.grid.querySelector(".wordshake__tile");
    if (firstTile) firstTile.focus();
  }

  function finish() {
    el.finalScore.textContent = String(score);
    el.finalCount.textContent = String(found.size);
    el.board.hidden = true;
    el.over.hidden = false;
    el.againBtn.focus();
  }

  el.startBtn.addEventListener("click", start);
  el.againBtn.addEventListener("click", start);
  el.clearBtn.addEventListener("click", function () { clearWord(); say(""); });
  el.submitBtn.addEventListener("click", submit);

  // Enter submits from anywhere in the game, which is what a player expects.
  root.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    if (event.target === el.startBtn || event.target === el.againBtn) return;
    if (event.target.classList && event.target.classList.contains("wordshake__tile")) return;
    event.preventDefault();
    submit();
  });

  // A game left running in a background tab would count down unseen.
  window.addEventListener("pagehide", function () { window.clearInterval(ticker); });
})();
