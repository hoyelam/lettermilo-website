(function () {
  "use strict";

  var script = document.currentScript;
  var root = document.querySelector("#word-demo");
  if (!script || !script.src || !root) return;

  var progressText = root.querySelector("[data-demo-progress]");
  var progressBar = root.querySelector("[data-demo-progressbar]");
  var question = root.querySelector("[data-demo-question]");
  var listenIcon = root.querySelector("[data-demo-listen]");
  var letter = root.querySelector("[data-demo-letter]");
  var picture = root.querySelector("[data-demo-picture]");
  var imageRetry = root.querySelector("[data-demo-image-retry]");
  var choices = root.querySelector("[data-demo-choices]");
  var hearButton = root.querySelector("[data-demo-hear]");
  var hearLabel = root.querySelector("[data-demo-hear-label]");
  var hintButton = root.querySelector("[data-demo-hint]");
  var milo = root.querySelector("[data-demo-milo]");
  var feedback = root.querySelector("[data-demo-feedback]");
  var audioStatus = root.querySelector("[data-demo-audio-status]");
  var actionButton = root.querySelector("[data-demo-action]");
  var soundButton = root.querySelector("[data-demo-sound]");
  var soundLabel = root.querySelector("[data-demo-sound-label]");
  var motionButton = root.querySelector("[data-demo-motion]");
  var motionLabel = root.querySelector("[data-demo-motion-label]");
  var required = [
    progressText, progressBar, question, listenIcon, letter, picture,
    imageRetry, choices, hearButton, hearLabel, hintButton, milo,
    feedback, audioStatus, actionButton, soundButton, soundLabel,
  ];
  if (required.some(function (node) { return !node; })) return;

  var demoBase = new URL("./demo/", script.src);
  var miloBase = new URL("./demo/milo/", script.src);
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var phase = "intro";
  var round = "letter";
  var soundEnabled = true;
  var motionOverride = null;
  var activeAudio = null;
  var cancelActiveClip = null;
  var audioToken = 0;
  var imageToken = 0;
  var activeImageLoader = null;
  var desiredMiloState = "idle";
  var animationStarted = false;
  var animationBroken = false;
  var isVisible = !document.hidden;
  var isInView = true;
  var lastMiloUrl = "";

  function assetUrl(filename) {
    return new URL(filename, demoBase).href;
  }

  function miloUrl(filename) {
    return new URL(filename, miloBase).href;
  }

  function focusWithoutScrolling(element) {
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      // The exercise still works if this focus option is unavailable.
    }
  }

  function motionAllowed() {
    return motionOverride === null ? !motionQuery.matches : motionOverride;
  }

  function syncMotionControl() {
    if (!motionButton || !motionLabel) return;
    var allowed = motionAllowed();
    motionButton.hidden = false;
    motionButton.setAttribute("aria-pressed", allowed ? "true" : "false");
    motionLabel.textContent = allowed ? "Motion on" : "Motion off";
  }

  function updateMilo() {
    var useStill = !animationStarted || !motionAllowed() ||
      !isVisible || !isInView || animationBroken;
    var filename;
    if (useStill) {
      filename = desiredMiloState === "success"
        ? "milo-success-still.webp"
        : "milo-idle-still.webp";
    } else {
      filename = {
        talking: "milo-talking.webp",
        listening: "milo-listening.webp",
        success: "milo-success.webp",
        idle: "milo-idle.webp",
      }[desiredMiloState] || "milo-idle.webp";
    }
    var url = miloUrl(filename);
    if (url !== lastMiloUrl) {
      lastMiloUrl = url;
      milo.src = url;
    }
  }

  function setMilo(state) {
    desiredMiloState = state;
    updateMilo();
  }

  function restartMiloSuccess() {
    if (!animationStarted || !motionAllowed() || !isVisible || !isInView || animationBroken) {
      return;
    }
    var successUrl = miloUrl("milo-success.webp");
    lastMiloUrl = successUrl;
    milo.src = successUrl;
    milo.src = successUrl;
  }

  milo.addEventListener("error", function () {
    if (animationBroken) return;
    animationBroken = true;
    var fallback = miloUrl("milo-idle-still.webp");
    lastMiloUrl = fallback;
    milo.src = fallback;
  });

  function exposeLetter() {
    if (round !== "letter") return;
    listenIcon.hidden = true;
    letter.hidden = false;
    hintButton.disabled = true;
  }

  function stopAudio(preserveMilo) {
    audioToken += 1;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio.load();
      activeAudio = null;
    }
    if (cancelActiveClip) {
      cancelActiveClip();
      cancelActiveClip = null;
    }
    if (!preserveMilo) {
      setMilo(phase === "correct" || phase === "complete" ? "success" : "idle");
    }
  }

  function playClip(filename, mood, token) {
    return new Promise(function (resolve) {
      if (token !== audioToken || !soundEnabled || document.hidden) {
        resolve(false);
        return;
      }
      var settled = false;
      var audio = new Audio(assetUrl(filename));
      var timeout = window.setTimeout(function () { finish(false); }, 15000);
      activeAudio = audio;
      setMilo(mood);

      function finish(didPlay) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        if (!didPlay) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }
        if (activeAudio === audio) activeAudio = null;
        if (cancelActiveClip === cancel) cancelActiveClip = null;
        resolve(token === audioToken && didPlay);
      }
      function cancel() { finish(false); }
      function onEnded() { finish(true); }
      function onError() { finish(false); }

      cancelActiveClip = cancel;
      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });
      var playback = audio.play();
      if (playback && typeof playback.catch === "function") playback.catch(onError);
    });
  }

  function playSequence(clips, options) {
    stopAudio(true);
    var token = audioToken;
    var settings = options || {};
    if (!soundEnabled) {
      audioStatus.textContent = "Sound is off.";
      if (round === "letter") exposeLetter();
      setMilo(settings.holdSuccess ? "success" : "idle");
      return;
    }
    audioStatus.textContent = "";
    clips.reduce(function (chain, clip) {
      return chain.then(function (previousPlayed) {
        if (token !== audioToken) return false;
        if (previousPlayed === false && settings.stopAfterFailure) return false;
        return playClip(clip.file, clip.mood, token);
      });
    }, Promise.resolve(true)).then(function (played) {
      if (token !== audioToken) return;
      if (played === false) {
        audioStatus.textContent = "Audio isn’t available right now.";
        if (round === "letter") exposeLetter();
      }
      setMilo(settings.holdSuccess ? "success" : "idle");
    });
  }

  function setAction(label, disabled) {
    actionButton.textContent = label;
    actionButton.disabled = disabled;
  }

  function setChoices(values, correctAnswer) {
    choices.replaceChildren();
    values.forEach(function (value) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "demo-choice";
      button.textContent = value;
      button.disabled = phase === "intro" || phase === "loading" || phase === "complete";
      button.addEventListener("click", function () {
        chooseAnswer(button, value, correctAnswer);
      });
      choices.appendChild(button);
    });
  }

  function setChoicesDisabled(disabled) {
    Array.prototype.forEach.call(choices.querySelectorAll("button"), function (button) {
      button.disabled = disabled;
    });
  }

  function chooseAnswer(button, value, correctAnswer) {
    if (phase !== "playing" && phase !== "retry") return;
    Array.prototype.forEach.call(choices.querySelectorAll(".is-wrong"), function (choice) {
      choice.classList.remove("is-wrong");
    });
    if (value !== correctAnswer) {
      phase = "retry";
      root.dataset.state = "retry";
      button.classList.add("is-wrong");
      feedback.textContent = round === "letter"
        ? "Let’s listen and try again."
        : "Look again. Try another word.";
      if (round === "letter") {
        playSequence([
          { file: "try-again.m4a", mood: "talking" },
          { file: "sound-m.wav", mood: "listening" },
        ]);
      } else {
        playSequence([{ file: "retry-picture-word.m4a", mood: "talking" }]);
      }
      return;
    }

    stopAudio(true);
    phase = "correct";
    root.dataset.state = "correct";
    button.classList.add("is-correct");
    setChoicesDisabled(true);
    progressBar.value = round === "letter" ? 1 : 2;
    feedback.textContent = round === "letter" ? "That’s m. You found it!" : "Mat. You matched it!";
    hintButton.disabled = true;
    hearButton.disabled = false;
    setMilo("success");
    restartMiloSuccess();
    setAction(round === "letter" ? "Next: word" : "Finish", false);
    playSequence([{ file: "great-job.m4a", mood: "success" }], { holdSuccess: true });
    focusWithoutScrolling(actionButton);
  }

  function showLetterRound(autoplay) {
    stopAudio(false);
    imageToken += 1;
    activeImageLoader = null;
    round = "letter";
    phase = autoplay ? "playing" : "intro";
    root.dataset.kind = "letter";
    root.dataset.state = phase;
    progressText.textContent = "Letter · 1 of 2";
    progressBar.max = 2;
    progressBar.value = 0;
    question.textContent = "Listen and find the letter.";
    listenIcon.hidden = false;
    letter.hidden = true;
    picture.hidden = true;
    imageRetry.hidden = true;
    imageRetry.disabled = true;
    choices.setAttribute("aria-label", "Choose the matching letter");
    feedback.textContent = autoplay
      ? "Listen to the sound, then choose its letter."
      : "Let’s try a letter, then a word.";
    hearLabel.textContent = "Hear sound";
    hearButton.disabled = !autoplay;
    hintButton.textContent = "Show the letter";
    hintButton.disabled = !autoplay;
    audioStatus.textContent = "";
    setAction(autoplay ? "Choose an answer" : "Start example", autoplay);
    setChoices(["a", "m"], "m");
    if (autoplay) {
      setChoicesDisabled(false);
      animationStarted = true;
      playSequence([
        { file: "find-letter.m4a", mood: "talking" },
        { file: "sound-m.wav", mood: "listening" },
      ]);
    } else {
      animationStarted = false;
      setMilo("idle");
    }
  }

  function loadWordPicture() {
    var token = imageToken + 1;
    imageToken = token;
    phase = "loading";
    root.dataset.state = "loading";
    activeImageLoader = null;
    picture.hidden = true;
    imageRetry.hidden = true;
    imageRetry.disabled = true;
    setChoicesDisabled(true);
    feedback.textContent = "Loading the picture…";
    setAction("Choose an answer", true);

    var loader = new Image();
    activeImageLoader = loader;
    loader.addEventListener("load", function () {
      if (token !== imageToken || loader !== activeImageLoader) return;
      activeImageLoader = null;
      picture.src = loader.src;
      picture.alt = "A mat";
      picture.hidden = false;
      phase = "playing";
      root.dataset.state = "playing";
      setChoicesDisabled(false);
      hearButton.disabled = false;
      hintButton.disabled = false;
      feedback.textContent = "Look at the picture. Tap the matching word.";
      playSequence([{ file: "picture-word.m4a", mood: "talking" }]);
    }, { once: true });
    loader.addEventListener("error", function () {
      if (token !== imageToken || loader !== activeImageLoader) return;
      activeImageLoader = null;
      phase = "error";
      root.dataset.state = "error";
      imageRetry.hidden = false;
      imageRetry.disabled = false;
      feedback.textContent = "The picture couldn’t load. Please try again.";
      focusWithoutScrolling(imageRetry);
    }, { once: true });
    loader.src = assetUrl("word-mat.png");
  }

  function showWordRound() {
    stopAudio(false);
    round = "word";
    phase = "loading";
    root.dataset.kind = "word";
    root.dataset.state = "loading";
    setMilo("idle");
    progressText.textContent = "Word · 2 of 2";
    progressBar.value = 1;
    question.textContent = "Find the picture’s word.";
    listenIcon.hidden = true;
    letter.hidden = true;
    choices.setAttribute("aria-label", "Choose the matching word");
    hearLabel.textContent = "Hear word";
    hearButton.disabled = true;
    hintButton.textContent = "Hear instructions";
    hintButton.disabled = true;
    audioStatus.textContent = "";
    setChoices(["map", "mat", "tap"], "mat");
    loadWordPicture();
  }

  function completeExample() {
    stopAudio(true);
    phase = "complete";
    root.dataset.state = "complete";
    progressText.textContent = "Complete · 2 of 2";
    progressBar.value = 2;
    question.textContent = "You did it!";
    feedback.textContent = "You found m and matched mat.";
    setChoicesDisabled(true);
    hearButton.disabled = false;
    hintButton.disabled = true;
    setAction("Play again", false);
    setMilo("success");
    focusWithoutScrolling(question);
  }

  actionButton.addEventListener("click", function () {
    if (phase === "intro") showLetterRound(true);
    else if (phase === "correct" && round === "letter") showWordRound();
    else if (phase === "correct" && round === "word") completeExample();
    else if (phase === "complete") showLetterRound(true);
  });

  imageRetry.addEventListener("click", function () {
    if (round === "word" && phase === "error") loadWordPicture();
  });

  hearButton.addEventListener("click", function () {
    if (phase === "intro" || phase === "loading" || phase === "error") return;
    if (round === "letter") {
      playSequence([{ file: "sound-m.wav", mood: "listening" }], {
        holdSuccess: phase === "correct",
      });
    } else {
      playSequence([{ file: "word-mat.m4a", mood: "talking" }], {
        holdSuccess: phase === "correct" || phase === "complete",
      });
    }
  });

  hintButton.addEventListener("click", function () {
    if (phase !== "playing" && phase !== "retry") return;
    if (round === "letter") {
      exposeLetter();
      feedback.textContent = "Here’s m. Choose it below.";
    } else {
      playSequence([{ file: "picture-word.m4a", mood: "talking" }]);
    }
  });

  soundButton.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
    stopAudio(false);
    audioStatus.textContent = soundEnabled ? "" : "Sound is off.";
    if (!soundEnabled && round === "letter") exposeLetter();
  });

  if (motionButton && motionLabel) {
    motionButton.addEventListener("click", function () {
      motionOverride = !motionAllowed();
      syncMotionControl();
      updateMilo();
    });
  }

  window.addEventListener("pagehide", function () { stopAudio(false); });
  document.addEventListener("visibilitychange", function () {
    isVisible = !document.hidden;
    if (!isVisible) stopAudio(false);
    updateMilo();
  });

  if (typeof IntersectionObserver === "function") {
    var observer = new IntersectionObserver(function (entries) {
      isInView = entries[0].isIntersecting;
      updateMilo();
    });
    observer.observe(root);
  }
  function handleMotionPreferenceChange() {
    syncMotionControl();
    updateMilo();
  }
  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(handleMotionPreferenceChange);
  }

  actionButton.hidden = false;
  soundButton.hidden = false;
  soundButton.setAttribute("aria-pressed", "true");
  soundLabel.textContent = "Sound on";
  syncMotionControl();
  showLetterRound(false);
}());
