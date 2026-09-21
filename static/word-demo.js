(function () {
  "use strict";

  var script = document.currentScript;
  var root = document.querySelector("#word-demo");

  if (!script || !script.src || !root) {
    return;
  }

  var intro = root.querySelector("[data-demo-intro]");
  var play = root.querySelector("[data-demo-play]");
  var complete = root.querySelector("[data-demo-complete]");
  var startButton = root.querySelector("[data-demo-start]");
  var progressText = root.querySelector("[data-demo-progress]");
  var progressBar = root.querySelector("[data-demo-progressbar]");
  var question = root.querySelector("[data-demo-question]");
  var picture = root.querySelector("[data-demo-picture]");
  var hearButton = root.querySelector("[data-demo-hear]");
  var choices = root.querySelector("[data-demo-choices]");
  var answer = root.querySelector("[data-demo-answer]");
  var feedback = root.querySelector("[data-demo-feedback]");
  var audioStatus = root.querySelector("[data-demo-audio-status]");
  var nextButton = root.querySelector("[data-demo-next]");
  var completeTitle = root.querySelector("[data-demo-complete-title]");
  var replayButton = root.querySelector("[data-demo-replay]");
  var soundButton = root.querySelector("[data-demo-sound]");
  var soundLabel = root.querySelector("[data-demo-sound-label]");
  var instructionButton = root.querySelector("[data-demo-instruction]");
  var imageRetryButton = root.querySelector("[data-demo-image-retry]");

  var required = [
    intro,
    play,
    complete,
    startButton,
    progressText,
    progressBar,
    question,
    picture,
    hearButton,
    choices,
    answer,
    feedback,
    audioStatus,
    nextButton,
    completeTitle,
    replayButton,
    soundButton,
    soundLabel,
    imageRetryButton,
  ];

  if (required.some(function (node) { return !node; })) {
    return;
  }

  var demoBase = new URL("./demo/", script.src);
  var rounds = [
    { word: "mat", image: "word-mat.png", audio: "word-mat.m4a" },
    { word: "map", image: "word-map.png", audio: "word-map.m4a" },
    { word: "tap", image: "word-tap.png", audio: "word-tap.m4a" },
  ];
  var words = rounds.map(function (round) { return round.word; });
  var roundIndex = 0;
  var phase = "intro";
  var soundEnabled = true;
  var activeAudio = null;
  var audioToken = 0;
  var imageToken = 0;
  var activeImageLoader = null;
  var lastWrongButton = null;

  function assetUrl(filename) {
    return new URL(filename, demoBase).href;
  }

  function focusWithoutScrolling(element) {
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      element.focus();
    }
  }

  function stopAudio() {
    audioToken += 1;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio.load();
      activeAudio = null;
    }
  }

  function playAudio(filename, announceWhenMuted) {
    stopAudio();

    if (!soundEnabled) {
      if (announceWhenMuted) {
        audioStatus.textContent = "Sound is off.";
      }
      return;
    }

    audioStatus.textContent = "";
    var token = audioToken;
    var audio = new Audio(assetUrl(filename));
    activeAudio = audio;

    audio.addEventListener("ended", function () {
      if (token === audioToken && activeAudio === audio) {
        activeAudio = null;
      }
    }, { once: true });

    audio.addEventListener("error", function () {
      if (token === audioToken && activeAudio === audio) {
        activeAudio = null;
        audioStatus.textContent = "Audio isn't available right now.";
      }
    }, { once: true });

    var playback = audio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(function () {
        if (token === audioToken && activeAudio === audio) {
          activeAudio = null;
          audioStatus.textContent = "Audio isn't available right now.";
        }
      });
    }
  }

  function shuffle(values) {
    var result = values.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(Math.random() * (index + 1));
      var temporary = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = temporary;
    }
    return result;
  }

  function setScreen(name) {
    root.dataset.state = name;
    intro.hidden = name !== "intro";
    play.hidden = name === "intro" || name === "complete";
    complete.hidden = name !== "complete";
  }

  function clearLastWrongChoice() {
    if (lastWrongButton) {
      lastWrongButton.classList.remove("is-wrong");
      lastWrongButton = null;
    }
  }

  function chooseWord(event) {
    if (phase !== "playing" && phase !== "retry") {
      return;
    }

    var button = event.currentTarget;
    var chosenWord = button.textContent;
    var round = rounds[roundIndex];
    clearLastWrongChoice();

    if (chosenWord !== round.word) {
      phase = "retry";
      root.dataset.state = "retry";
      button.classList.add("is-wrong");
      lastWrongButton = button;
      feedback.textContent = "Look at the picture again. Let's try another word.";
      playAudio("retry-picture-word.m4a", false);
      return;
    }

    phase = "correct";
    root.dataset.state = "correct";
    Array.prototype.forEach.call(choices.querySelectorAll("button"), function (choice) {
      choice.disabled = true;
    });
    choices.hidden = true;
    imageRetryButton.hidden = true;
    imageRetryButton.disabled = true;
    if (instructionButton) {
      instructionButton.hidden = true;
    }
    answer.textContent = round.word;
    answer.hidden = false;
    feedback.textContent = "You did it!";
    progressBar.value = roundIndex + 1;
    nextButton.textContent = roundIndex === rounds.length - 1 ? "Finish" : "Next picture";
    nextButton.disabled = false;
    nextButton.hidden = false;
    playAudio("great-job.m4a", false);
    focusWithoutScrolling(nextButton);
  }

  function buildChoices() {
    choices.replaceChildren();
    shuffle(words).forEach(function (word) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "demo-choice";
      button.textContent = word;
      button.addEventListener("click", chooseWord);
      choices.appendChild(button);
    });
  }

  function loadCurrentPicture() {
    var round = rounds[roundIndex];
    var token = imageToken + 1;
    imageToken = token;
    phase = "loading";
    root.dataset.state = "loading";
    activeImageLoader = null;

    picture.hidden = true;
    picture.removeAttribute("src");
    picture.alt = "";
    choices.hidden = true;
    answer.hidden = true;
    hearButton.disabled = true;
    if (instructionButton) {
      instructionButton.disabled = true;
    }
    imageRetryButton.hidden = true;
    imageRetryButton.disabled = true;
    feedback.textContent = "Loading the picture…";

    var loader = new Image();
    activeImageLoader = loader;

    loader.addEventListener("load", function () {
      if (token !== imageToken || activeImageLoader !== loader) {
        return;
      }

      activeImageLoader = null;
      picture.src = loader.src;
      picture.alt = "A " + round.word;
      picture.hidden = false;
      choices.hidden = false;
      hearButton.disabled = false;
      if (instructionButton) {
        instructionButton.disabled = false;
      }
      phase = "playing";
      root.dataset.state = "playing";
      feedback.textContent = "Look at the picture. Tap the word that matches.";
      if (document.activeElement === question || document.activeElement === document.body) {
        focusWithoutScrolling(question);
        root.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }, { once: true });

    loader.addEventListener("error", function () {
      if (token !== imageToken || activeImageLoader !== loader) {
        return;
      }

      activeImageLoader = null;
      phase = "error";
      root.dataset.state = "error";
      imageRetryButton.textContent = "Try loading again";
      imageRetryButton.disabled = false;
      imageRetryButton.hidden = false;
      feedback.textContent = "The picture couldn’t load. Please try again.";
      focusWithoutScrolling(imageRetryButton);
    }, { once: true });

    loader.src = assetUrl(round.image);
  }

  function showRound() {
    lastWrongButton = null;
    setScreen("loading");
    progressText.textContent = "Picture " + (roundIndex + 1) + " of " + rounds.length;
    progressBar.max = rounds.length;
    progressBar.value = roundIndex;
    question.textContent = "Find the picture’s word.";
    if (instructionButton) {
      instructionButton.hidden = false;
    }
    answer.hidden = true;
    answer.textContent = "";
    audioStatus.textContent = "";
    nextButton.hidden = true;
    nextButton.disabled = true;
    buildChoices();
    loadCurrentPicture();
    focusWithoutScrolling(question);
    root.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function beginExercise() {
    if (phase !== "intro" && phase !== "complete") {
      return;
    }
    roundIndex = 0;
    showRound();
    playAudio("picture-word.m4a", false);
  }

  function finishExercise() {
    stopAudio();
    phase = "complete";
    setScreen("complete");
    progressBar.value = rounds.length;
    completeTitle.textContent = "You did it!";
    focusWithoutScrolling(completeTitle);
    root.scrollIntoView({ block: "start", behavior: "instant" });
  }

  startButton.addEventListener("click", beginExercise);
  replayButton.addEventListener("click", beginExercise);

  imageRetryButton.addEventListener("click", function () {
    if (phase !== "error") {
      return;
    }
    imageRetryButton.disabled = true;
    loadCurrentPicture();
  });

  nextButton.addEventListener("click", function () {
    if (phase !== "correct") {
      return;
    }

    nextButton.disabled = true;
    if (roundIndex === rounds.length - 1) {
      finishExercise();
      return;
    }

    roundIndex += 1;
    showRound();
    playAudio("picture-word.m4a", false);
  });

  hearButton.addEventListener("click", function () {
    if (phase !== "playing" && phase !== "retry" && phase !== "correct") {
      return;
    }
    var round = rounds[roundIndex];
    feedback.textContent = "The word is “" + round.word + ".”";
    playAudio(round.audio, true);
  });

  if (instructionButton) {
    instructionButton.addEventListener("click", function () {
      if (phase !== "playing" && phase !== "retry") {
        return;
      }
      feedback.textContent = "Look at the picture. Tap the word that matches.";
      playAudio("picture-word.m4a", true);
    });
  }

  soundButton.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
    audioStatus.textContent = soundEnabled ? "" : "Sound is off.";
    stopAudio();
  });

  window.addEventListener("pagehide", stopAudio);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopAudio();
    }
  });

  startButton.hidden = false;
  soundButton.hidden = false;
  imageRetryButton.hidden = true;
  imageRetryButton.disabled = true;
  soundButton.setAttribute("aria-pressed", "true");
  soundLabel.textContent = "Sound on";
  setScreen("intro");
}());
