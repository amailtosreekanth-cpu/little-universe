/* ==========================================================================
   A LITTLE UNIVERSE CALLED FARA — central content file
   --------------------------------------------------------------------------
   Everything she reads or sees lives here. Edit freely; no build step.

   PHOTOS
   - Live in  public/assets/fara/photos/
   - Each photo has two sizes:  <name>-lg.jpg (≈2000px)  and  <name>-sm.jpg (≈900px)
   - To REPLACE a photo: overwrite both files with the same names. Done.
   - To ADD a photo: drop  new-name-lg.jpg + new-name-sm.jpg  into the folder,
     add an entry to `photos` below, then reference its key anywhere.
   - `pos` = object-position (which part of the photo stays in frame when cropped).

   DATES: the dates below came from the photos' own camera metadata.
   Set any date to "" to hide it.
   ========================================================================== */

window.FARA_CONFIG = {
  name: "Fara",
  birthday: "November 24",
  title: "A Little Universe Called Fara",

  /* ---------- Opening sequence ---------- */
  intro: {
    lines: [
      "Some people make the world a little more beautiful simply by being in it.",
      "Today is about celebrating one of them.",
    ],
    reveal: "Happy Birthday, Fara.",
    button: "Enter your little universe",
  },

  /* ---------- Photo library ---------- */
  photos: {
    portraitGaze:   { file: "fara-portrait-gaze",     alt: "Fara resting her cheek on her hand, looking into the camera", w: 980,  h: 1384, pos: "50% 35%" },
    smileUp:        { file: "fara-smile-looking-up",  alt: "Fara smiling and looking up, chin resting on her hand",      w: 892,  h: 1348, pos: "40% 45%" },
    seated:         { file: "fara-seated-portrait",   alt: "Fara seated in a black dress, glasses resting on her head",  w: 935,  h: 1412, pos: "55% 25%" },
    saree:          { file: "fara-saree-standing",    alt: "Fara standing in a red and black printed saree",            w: 1125, h: 2000, pos: "50% 30%" },
    dandiya:        { file: "fara-night-dandiya",     alt: "Fara smiling, holding dandiya sticks, against a bright backdrop", w: 1125, h: 2000, pos: "50% 30%" },
    eyesClosed:     { file: "fara-eyes-closed",       alt: "Close portrait of Fara with her eyes gently closed",        w: 1125, h: 2000, pos: "50% 40%" },
    usMonkey:       { file: "together-monkey-selfie", alt: "A selfie of the two of us with a plush monkey",              w: 1125, h: 2000, pos: "50% 45%" },
    usStore:        { file: "together-store-selfie",  alt: "A selfie of the two of us",                                  w: 1125, h: 2000, pos: "50% 35%" },
    usEvening:      { file: "together-evening-selfie",alt: "A selfie of the two of us, dressed up",                      w: 1125, h: 2000, pos: "50% 40%" },
    usMirror:       { file: "together-mirror",        alt: "The two of us in a mirror",                                  w: 1125, h: 2000, pos: "50% 50%" },
  },

  /* A short muted moving moment (sound never plays). poster = still frame shown before it loads. Set to null to remove. */
  video: { src: "assets/fara/video/fara-twirl.mp4", poster: "assets/fara/video/fara-twirl-poster.jpg", alt: "Fara turning in a printed saree" },

  /* ---------- Hero ---------- */
  hero: {
    photo: "portraitGaze",
    eyebrow: "November 24",
    line: "A celebration of one person, and all the little things that make her who she is.",
  },

  /* ---------- Chapter I — A collection of little moments ---------- */
  gallery: {
    eyebrow: "Chapter I",
    title: "A collection of little moments",
    cinematic:  { photo: "dandiya",  caption: "Lit up." },
    trio: {
      line: "Some photographs say everything without trying.",
      photos: [
        { photo: "seated", caption: "" },
        { photo: "saree",  caption: "" },
      ],
      videoCaption: "Mid-turn.",
    },
    quiet: { photo: "eyesClosed", line: "And some are simply quiet." },
    polaroidsTitle: "A few of us",
    polaroids: [
      { photo: "usMonkey", caption: "with an unexpected third guest" },
      { photo: "usMirror", caption: "caught in the mirror" },
      { photo: "usStore",  caption: "same evening, straighter faces" },
    ],
    stripTitle: "Frame by frame",
    strip: ["portraitGaze", "dandiya", "seated", "smileUp", "saree", "eyesClosed"],
  },

  /* ---------- Chapter II — Things that make you, YOU ----------
     Personalise these! Each `body` is a gentle starting point drawn from your letter;
     replace with the specific details only you would know. */
  traits: {
    eyebrow: "Chapter II",
    title: "Things that make you, YOU.",
    items: [
      { theme: "Individuality",  title: "Unmistakably you.",          photo: "portraitGaze", body: "That very particular way you look at the world. It's entirely yours, and it never needed anyone's permission." },
      { theme: "Humour",         title: "The jokes.",                 photo: "smileUp",      body: "The silly ones, the well-timed ones, the ones that turn an ordinary day into a better one." },
      { theme: "Intelligence",   title: "A curious mind.",            photo: "seated",       body: "You think things through. You have opinions, and you hold them with conviction." },
      { theme: "Little quirks",  title: "The small, specific things.",photo: "eyesClosed",   body: "The habits and details nobody else would notice. The ones that make you completely yourself." },
      { theme: "Ambition",       title: "Whatever you set your mind to.", photo: "saree",    body: "When something matters to you, you go after it. I hope that never changes." },
      { theme: "Strength",       title: "Quiet strength.",            photo: "dandiya",      body: "Not always loud. Sometimes it's simply carrying on, and doing it with grace." },
      { theme: "Imperfections",  title: "Beautifully imperfect.",     photo: "portraitGaze", body: "Your stubbornness included. Especially your stubbornness. It's mostly conviction in disguise." },
      { theme: "The little things", title: "What makes you different.", photo: "smileUp",   body: "All the small things that add up to someone there is only one of." },
    ],
  },

  /* ---------- Chapter III — Timeline ----------
     date: optional ("" hides it) · caption: short · note: optional personal note ("" hides it) */
  timeline: {
    eyebrow: "Chapter III",
    title: "Some moments deserve to stay.",
    intro: "Not to go back to. Just to remember fondly.",
    entries: [
      { photo: "usMonkey",   date: "18 July",    caption: "The one with the plush monkey.", note: "" },
      { photo: "usStore",    date: "18 July",    caption: "Same evening.",                  note: "" },
      { photo: "saree",      date: "17 October", caption: "Ready.",                         note: "" },
      { photo: "usEvening",  date: "18 October", caption: "Side by side.",                  note: "" },
      { photo: "dandiya",    date: "18 October", caption: "Bangles, sticks, and that smile.", note: "" },
      { photo: "usMirror",   date: "19 October", caption: "Caught in the mirror.",          note: "" },
      { photo: "eyesClosed", date: "6 November", caption: "A quiet moment.",                note: "" },
    ],
  },

  /* ---------- Chapter IV — Little surprises ---------- */
  reveal: {
    eyebrow: "A few hidden things",
    title: "Open them whenever you like.",
    cards: [
      { label: "Open for a smile",      photo: "smileUp",   caption: "This one." },
      { label: "Open for a memory",     photo: "usEvening", caption: "A good evening." },
      { label: "Open for a reminder",   photo: "seated",    caption: "Look at you." },
      { label: "Open for no reason",    photo: "usMonkey",  caption: "Because why not." },
    ],
  },

  constellation: {
    eyebrow: "Make a wish",
    title: "Every star is a wish for you.",
    hint: "Tap a star.",
    done: "Every wish, found. Every one of them meant.",
    // x / y are percentages of the sky (0–100). Add or remove freely.
    wishes: [
      { x: 14, y: 30, text: "May you always find reasons to laugh." },
      { x: 28, y: 62, text: "May the coming year surprise you in the most beautiful ways." },
      { x: 40, y: 22, text: "May you have the courage to pursue everything you dream about." },
      { x: 52, y: 52, text: "May you find peace in the places where you need it most." },
      { x: 63, y: 18, text: "May life be exceptionally kind to you." },
      { x: 72, y: 70, text: "May you keep discovering beautiful places." },
      { x: 82, y: 38, text: "May your days be full of good conversations." },
      { x: 90, y: 74, text: "May you always have people around you who feel like home." },
      { x: 20, y: 84, text: "May you be as gentle with yourself as you deserve." },
      { x: 58, y: 86, text: "May every good plan you make find its way." },
    ],
  },

  cake: {
    eyebrow: "One more thing",
    title: "Make a wish.",
    hint: "Tap each candle to blow it out.",
    candles: 5,
    done: "Here’s to another beautiful chapter.",
  },

  /* ---------- The letter ---------- */
  letter: {
    eyebrow: "For you",
    envelopeHint: "Tap to open",
    greeting: "Dear Fara,",
    paragraphs: [
      "Happy birthday.",
      "I wish I could make today a little more special for you. I had imagined spending some time with you today, but I understand that things are different, and I respect that.",
      "There are so many little things about you that I hope you never lose.",
      "Your humour, your intelligence, your opinions, your stubbornness, your little quirks, and that very particular way of looking at the world.",
      "I hope you never stop being curious. I hope you continue discovering things, travelling to beautiful places, achieving the things you set your mind to, and becoming the person you have always wanted to be.",
      "We’ve shared some beautiful moments. The ordinary conversations, the silly jokes, the plans, the laughter and the little everyday things. I am grateful I got to experience them.",
      "I don’t want this birthday message to ask anything of you.",
      "I just wanted to create something beautiful for someone who has been an important part of my life.",
      "I hope this new year brings you happiness, good health, financial freedom, beautiful adventures, meaningful friendships, and above all, peace.",
      "You deserve a life that feels beautiful.",
      "Happy birthday, Fara.",
      "Take care of yourself.",
    ],
    signoff: "With love.",
  },

  /* ---------- Final screen ---------- */
  finale: {
    photo: "smileUp",
    lines: ["May this year be beautiful to you.", "Happy Birthday, Fara."],
    madeWith: "Made with love.",
  },

  /* ---------- Music (optional, never autoplays) ----------
     To enable: put an mp3 at public/assets/fara/music/ , set enabled: true and src.
     A small play button appears; nothing plays unless she presses it. */
  music: {
    enabled: false,
    src: "assets/fara/music/song.mp3",
    title: "",
    volume: 0.45,
  },
};
