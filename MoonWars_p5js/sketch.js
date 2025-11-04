// p5.js sketch: Rage-bait Course Selection (multiple screens)

let state = "login"; // 'login', 'main', 'error'
let loginInputs = {};

let loginBtn;
let goBtn;

let video, videoX, videoY, videoW, videoH;
let playing = false;

let xImg; // X button image

let lastErrorMsg = "";

let courses = [];
let plusIcons = [];
let selected = [];
let showCaptcha = false;
let captchaModal;
let pendingAddCourse = null; // course waiting for captcha approval

function setup() {
  createCanvas(1000, 700);
  textFont("Arial");

  video = createVideo(["/assets/rickroll.mp4"]);
  videoW = 640; // desired width
  videoH = 360; // desired height
  videoX = (width - videoW) / 2; // center horizontally
  videoY = (height - videoH) / 2; // center vertically

  video.hide();

  setupLoginDOM();
  createDemoCourses();
  captchaModal = new CaptchaModal();
}

function setupLoginDOM() {
  // --- Inputs ---
  loginInputs.user = createInput("");
  loginInputs.user.position(0, -1000);
  loginInputs.fakepass = createInput("", "");
  loginInputs.fakepass.position(0, -1000);
  loginInputs.pass = createInput("", "password");
  loginInputs.pass.position(0, -1000);

  // --- Real login button ---
  loginBtn = createButton("Log In");
  loginBtn.position(0, 0);
  loginBtn.mousePressed(handleLogin);

  // --- Fake rickroll login button ---
  goBtn = createButton("Fast Log In");
  goBtn.position(0, -1000);
  goBtn.mousePressed(() => {
    // Hide login UI and play the looping rickroll
    showLoginDOM(false);
    playing = true;
    video.loop();
    video.volume(1.0);
  });
}

function showLoginDOM(show) {
  if (show) {
    loginInputs.user.position(width / 2 - 120, height / 2 - 20);
    loginInputs.fakepass.position(width / 2 - 120, height / 2 + 20);
    loginInputs.pass.position(width / 2 - 120, height / 2 + 60);

    loginBtn.position(0, 0); //buttons move back
    goBtn.position(width / 2 + 110, height / 2 + 60);
  } else {
    loginInputs.user.position(0, -1000);
    loginInputs.fakepass.position(0, -1000);
    loginInputs.pass.position(0, -1000);
    goBtn.position(0, -1000);
    loginBtn.position(0, -1000);
  }
}

function handleLogin() {
  const u = loginInputs.user.value();
  const p = loginInputs.pass.value();
  // make username upper case, password is "password"
  if (u !== u.toUpperCase() || p !== "p4$$w0rd") {
    lastErrorMsg =
      "Login failed: incorrect credentials or wrong capitalization.";
    state = "error";
    showLoginDOM(true);
  } else {
    state = "main";
    showLoginDOM(false);
  }
}

function mousePressed() {
  // --- Stop video if playing ---
  if (playing) {
    if (
      mouseX > videoX &&
      mouseX < videoX + videoW &&
      mouseY > videoY &&
      mouseY < videoY + videoH
    ) {
      video.stop();
      playing = false;
      showLoginDOM(true); // show login again
      return; // consume click
    }
  }

  if (state === "main") {
    // Check plus icon clicks
    for (let pi of plusIcons) {
      if (pi.isMouseOver()) {
        // clicking a plus triggers flee behavior (it will run away continuously)
        pi.fleeFrom(createVector(mouseX, mouseY));
        return; // consumed
      }
    }
    // Check course cards
    for (let c of courses) {
      if (c.isMouseOver()) {
        // Try to add course: show captcha sometimes
        if (random() < 0.35) {
          // require captcha
          pendingAddCourse = c;
          showCaptcha = true;
          captchaModal.reset();
        } else {
          addCourseToSelection(c);
        }
        return;
      }
    }
    // Check selected list remove buttons
    for (let i = 0; i < selected.length; i++) {
      const r = selected[i];
      if (r.isMouseOverRemove()) {
        selected.splice(i, 1);
        return;
      }
    }
  } else if (state === "error") {
    // click to go back to login
    state = "login";
    showLoginDOM(true);
  }
}

function draw() {
  background(245);
  if (state === "login") drawLogin();
  else if (state === "main") drawMain();
  else if (state === "error") drawError();

  if (showCaptcha) {
    captchaModal.draw();
  }
}

/* ---------------------- Screens ---------------------- */

function drawLogin() {
  background(30, 30, 40);
  fill(255);

  textFont("Helvetica, Arial, sans-serif");
  textSize(14);
  text("Welcome to add-drop at:", width / 2, height / 2 - 160);

  textFont("cursive");
  fill(255, 80, 80);
  textSize(48 + sin(frameCount * 0.2) * 4); // pulsating size
  textAlign(CENTER, CENTER);
  text("r4GE Bait UniverS1ty", width / 2, height / 2 - 120);

  textFont("sans-serif");
  fill(255, 255, 255);
  textSize(14);
  text(
    'Please enter your credentials. Username must be full caps.(password is NOT "p4$$w0rd" )',
    width / 2,
    height / 2 - 90
  );

  textFont("sans-serif");
  fill(255, 255, 255);
  textSize(5);
  text("*terms and conditions apply", width / 2, height / 2 - 80);

  textFont("cursive");
  fill(50, 50, 80);
  textSize(10);
  text(
    "*By signing in, you agree to sign your soul to our university for $0.014. We are also not liable for any trauma caused by our website, courses, etc. Again, terms and conditions apply.",
    width / 2,
    height / 2 + 220
  );

  textFont("cursive");

  //rainbow font
  colorMode(HSB, 360, 100, 100);
  let hue = (frameCount * 3) % 360; // fast spinning hue
  fill(hue, 100, 100);

  textSize(20);
  text("username", width / 3, height / 2 - 10);

  textFont("cursive");
  textSize(14);
  text("password", width / 3, height / 2 + 30);

  textFont("cursive");
  textSize(30);
  text("idk hehe", width / 3, height / 2 + 70);

  textFont("cursive");
  textSize(5);
  text("password?", width / 3, height / 2 + 80);

  colorMode(RGB);

  showLoginDOM(true);

  if (playing) {
    image(video, videoX, videoY, videoW, videoH);
    return; // skip drawing other UI elements while rickrolling
  }
}

function drawMain() {
  background(255);
  // header
  fill(20);
  textSize(24);
  textAlign(LEFT, CENTER);
  text("Course Catalog — Click the + to add", 20, 30);
  text("Add 7 courses and submit!", 20, 60);

  // draw courses grid
  for (let c of courses) c.updateAndDraw();
  // draw plus icons
  for (let p of plusIcons) p.updateAndDraw();

  // draw selected list on right
  drawSelectedPanel();
}

function drawError() {
  background(10, 60, 10);
  fill(180, 255, 180);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("ERROR", width / 2, height / 2 - 40);
  textSize(16);
  text(
    lastErrorMsg + "\n\nClick anywhere to return to login",
    width / 2,
    height / 2 + 10
  );
}

/* ---------------------- Courses and UI ---------------------- */

function createDemoCourses() {
  const names = [
    "Intro to Meme Studies",
    "Advanced Procrastination",
    "Quantum Coffee",
    "JavaScript Rituals",
    "Angry Typography",
    "History of Clickbait",
    "Reactive Rage Design",
    "Midnight Algorithms",
  ];

  courses = [];
  plusIcons = [];
  for (let i = 0; i < names.length; i++) {
    const x = 50 + (i % 4) * 230;
    const y = 80 + floor(i / 4) * 180;
    courses.push(new CourseCard(names[i], x, y));
    // put a plus icon near each card
    plusIcons.push(new PlusIcon(x + 180, y + 80));
  }
}

class CourseCard {
  constructor(title, x, y) {
    this.title = title;
    this.x = x;
    this.y = y;
    this.w = 200;
    this.h = 120;
    this.hover = false;
  }
  isMouseOver() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.w &&
      mouseY > this.y &&
      mouseY < this.y + this.h
    );
  }
  updateAndDraw() {
    this.hover = this.isMouseOver();
    stroke(30);
    strokeWeight(1);
    if (this.hover) fill(255, 250, 220);
    else fill(250);
    rect(this.x, this.y, this.w, this.h, 8);
    noStroke();
    fill(20);
    textSize(16);
    textAlign(LEFT, TOP);
    text(this.title, this.x + 12, this.y + 12, this.w - 24, this.h - 24);

    // little info and click hint
    textSize(12);
    fill(100);
    text("Click to add", this.x + 12, this.y + this.h - 22);
  }
}

class PlusIcon {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.radius = 18;
    this.fleeing = false;
    this.fleeDuration = 0;
  }
  isMouseOver() {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) <= this.radius;
  }
  fleeFrom(point) {
    // set velocity away from click point
    const away = p5.Vector.sub(this.pos, point);
    if (away.mag() < 1) away.set(random(0.5, 1), random(0.5, 1));
    away.normalize();
    away.mult(random(4, 7));
    this.vel = away;
    this.fleeing = true;
    this.fleeDuration = 90 + floor(random(0, 120)); // frames to keep fleeing
  }
  updateAndDraw() {
    if (this.fleeing) {
      this.pos.add(this.vel);
      // slight random wiggle
      this.pos.x += random(-1, 1);
      this.pos.y += random(-1, 1);
      this.vel.mult(0.98);
      this.fleeDuration--;
      if (this.fleeDuration <= 0) this.fleeing = false;
      // keep on canvas
      this.pos.x = constrain(this.pos.x, 10, width - 250); // leave space for right panel
      this.pos.y = constrain(this.pos.y, 60, height - 20);
    }
    // draw plus
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(255, 220, 220);
    ellipse(0, 0, this.radius * 2);
    stroke(120);
    strokeWeight(3);
    line(-8, 0, 8, 0);
    line(0, -8, 0, 8);
    pop();
  }
}

/* ---------------------- Selected Panel ---------------------- */

function drawSelectedPanel() {
  push();
  const panelX = width - 240;
  fill(245);
  stroke(200);
  rect(panelX, 0, 240, height);
  noStroke();
  fill(20);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Your Selections", panelX + 16, 16);

  // draw selected items
  for (let i = 0; i < selected.length; i++) {
    const s = selected[i];
    const y = 56 + i * 44;
    s.draw(panelX + 12, y);
  }

  // instructions
  textSize(12);
  fill(100);
  text("Click the red X to remove an item", panelX + 12, height - 60);
  pop();
}

class SelectedItem {
  constructor(title) {
    this.title = title;
    // compute bounding on the fly when drawing
  }
  draw(x, y) {
    fill(255);
    stroke(200);
    rect(x, y, 216, 36, 6);
    noStroke();
    fill(10);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(this.title, x + 8, y + 18);
    // remove X
    fill(220, 80, 80);
    ellipse(x + 196, y + 18, 22);
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("X", x + 196, y + 18);
  }
  isMouseOverRemove() {
    const panelX = width - 240;
    for (let i = 0; i < selected.length; i++) {
      if (selected[i] === this) {
        const x = panelX + 12 + 196;
        const y = 56 + i * 44 + 18;
        return dist(mouseX, mouseY, x, y) < 12;
      }
    }
    return false;
  }
}

function addCourseToSelection(course) {
  // avoid duplicates
  if (selected.some((s) => s.title === course.title)) return;
  selected.push(new SelectedItem(course.title));
}

/* ---------------------- Captcha Modal ---------------------- */

class CaptchaModal {
  constructor() {
    this.w = 420;
    this.h = 200;
    this.reset();
  }
  reset() {
    this.a = floor(random(2, 12));
    this.b = floor(random(1, 9));
    this.answer = "";
    this.active = true;
    this.msg = "";

     // Math captcha
    this.a = floor(random(2, 12));
    this.b = floor(random(1, 9));

    // Sequence captcha
    this.sequence = [1, 2, 3, 4];
    this.buttons = [];
    this.sequenceInput = [];
    for (let i = 0; i < this.sequence.length; i++) {
      const s = this.sequence[i];
      this.buttons.push({
        val: s,
        x: 50 + i * 60,
        y: 100,
        w: 50,
        h: 50,
        clicked: false,
      });
    }

    // Click captcha
    this.timer = 180; // 3 seconds
    this.buttonPos = null;

    // Pick a random captcha
    this.captchas = ["math", "click", "sequence"];
    this.currentCaptcha = random(this.captchas);
  }

draw() {
    // darkened background
    push();
    fill(0, 0, 0, 140);
    rect(0, 0, width, height);

    const cx = width / 2 - this.w / 2;
    const cy = height / 2 - this.h / 2;

    fill(255);
    stroke(50);
    rect(cx, cy, this.w, this.h, 8);
    noStroke();
    fill(20);
    textSize(16);
    textAlign(LEFT, TOP);
    text("Captcha Verification — are you human?", cx + 16, cy + 12);

    // draw current captcha
    if (this.currentCaptcha === "math") this.drawMathCaptcha(cx, cy);
    else if (this.currentCaptcha === "click") this.drawClickCaptcha(cx, cy);
    else if (this.currentCaptcha === "sequence") this.drawSequenceCaptcha(cx, cy);

    pop();
  }

 /* ---------------------- Math Captcha ---------------------- */
  drawMathCaptcha(cx, cy) {
    textSize(14);
    text(`Solve: ${this.a} + ${this.b} = ?`, cx + 16, cy + 48);
    fill(240);
    rect(cx + 16, cy + 80, 120, 34, 4);
    fill(10);
    textAlign(LEFT, CENTER);
    text(this.answer, cx + 22, cy + 80 + 17);
    this.drawButtons(cx, cy);
  }

  drawButtons(cx, cy) {
    // Submit
    fill(200);
    rect(cx + this.w - 120, cy + this.h - 52, 92, 36, 6);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("Submit", cx + this.w - 120 + 46, cy + this.h - 52 + 18);

    // Cancel
    fill(180);
    rect(cx + this.w - 260, cy + this.h - 52, 92, 36, 6);
    fill(255);
    text("Cancel", cx + this.w - 260 + 46, cy + this.h - 52 + 18);

    fill(120);
    textSize(12);
    text(this.msg, cx + 16, cy + this.h - 22);
  }

  /* ---------------------- Click Captcha ---------------------- */
  drawClickCaptcha(cx, cy) {
    this.timer = max(0, this.timer - 1);
    const secondsLeft = ceil(this.timer / 60);

    textSize(14);
    text("Press the button below before the timer runs out!", cx + 16, cy + 48);
    textSize(20);
    fill(secondsLeft < 10 ? color(255, 0, 0) : 20);
    text(`Time left: ${secondsLeft}s`, cx + 16, cy + 80);

    if (!this.buttonPos) this.randomizeButtonPosition(cx, cy);

    if (frameCount % 60 === 0 && !this.buttonClicked) this.randomizeButtonPosition(cx, cy);

    const bx = this.buttonPos.x;
    const by = this.buttonPos.y;
    fill(this.buttonClicked ? "green" : "#007bff");
    rect(bx, by, 60, 20, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("CLICK HERE", bx + 30, by + 10);

    if (this.buttonClicked) this.success();
    else if (this.timer <= 0) this.fail();
    this.drawButtons(cx, cy);
  }

/* ---------------------- Sequence Captcha ---------------------- */

drawSequenceCaptcha(cx, cy) {
    textSize(16);
    textAlign(LEFT, TOP);
    fill(20);
    text("Press the numbers in sequence.", cx + 16, cy + 16);

    for (let i = 0; i < this.buttons.length; i++) {
      let b = this.buttons[i];
      fill(b.clicked ? color(180, 180, 180) : color(255, 200, 200));
      rect(b.x, b.y, b.w, b.h, 6);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(b.val, b.x + b.w / 2, b.y + b.h / 2);
    }
    this.drawButtons(cx, cy);
  }

  randomizeButtonPosition(cx, cy) {
    const minX = cx + 20;
    const maxX = cx + this.w - 80;
    const minY = cy + 110;
    const maxY = cy + this.h - 60;
    this.buttonPos = createVector(random(minX, maxX), random(minY, maxY));
  }


 
  handleClick(mx, my) {
    const cx = width / 2 - this.w / 2;
    const cy = height / 2 - this.h / 2;

    // Check input rect for Math captcha
    if (this.currentCaptcha === "math") {
      if (mx > cx + 16 && mx < cx + 136 && my > cy + 80 && my < cy + 114) return;
      // Submit
      if (mx > cx + this.w - 120 && mx < cx + this.w - 28 && my > cy + this.h - 52 && my < cy + this.h - 16) {
        if (int(this.answer) === this.a + this.b) this.success();
        else this.fail();
        return;
    }
  }

 // Click captcha button
    if (this.currentCaptcha === "click") {
      if (mx > this.buttonPos.x && mx < this.buttonPos.x + 60 && my > this.buttonPos.y && my < this.buttonPos.y + 20) {
        this.buttonClicked = true;
        return;
      }
    }

    // Cancel button
    if (mx > cx + this.w - 260 && mx < cx + this.w - 168 && my > cy + this.h - 52 && my < cy + this.h - 16) {
      pendingAddCourse = null;
      showCaptcha = false;
      this.active = false;
      return;
    }
  }

 success() {
    if (pendingAddCourse) addCourseToSelection(pendingAddCourse);
    pendingAddCourse = null;
    showCaptcha = false;
    this.active = false;
    this.msg = "Captcha solved!";
  }

  fail() {
    lastErrorMsg = "Captcha failed. You are not human!";
    state = "error";
    pendingAddCourse = null;
    showCaptcha = false;
    this.active = false;
  }
}
    


function keyTyped() {
  if (showCaptcha && captchaModal.active && captchaModal.currentCaptcha === "math") {
    if (key === "Backspace") captchaModal.answer = captchaModal.answer.slice(0, -1);
    else if (key >= "0" && key <= "9") captchaModal.answer += key;
  }
}

function mouseClicked() {
  if (showCaptcha && captchaModal.active) {
    captchaModal.handleClick(mouseX, mouseY);
    // consume click
    return false;
  }
}

// small helper: prevent text inputs from stealing key events when typing captcha
function keyPressed() {
  // allow normal behavior
  if (key === "f" || key === "F") {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

// cleanup when page is closed
function windowResized() {
  // keep canvas size consistent (optional)
  resizeCanvas(windowWidth, windowHeight);
}
