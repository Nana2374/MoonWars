// p5.js sketch: Rage-bait Course Selection (multiple screens)

let state = "login"; // can be 'login', 'main', 'errorCaptcha', 'error404'

let loginInputs = {};

let loginBtn;
let goBtn;

let video, videoX, videoY, videoW, videoH;
let playing = false;


let xButtonImg, quicktimeFrameImg; //x button and quicktime

let videoClones = []; // holds all duplicated videos

let lastErrorMsg = "";

let courses = [];
let plusIcons = [];
let selected = [];
let showCaptcha = false;
let captchaModal;
let pendingAddCourse = null; // course waiting for captcha approval
let submitButton = null;

let clickSound;

function preload() {
  clickSound = loadSound("/assets/SFXclick.mp3");
  failSound = loadSound("/assets/SFXfail.mp3");
  errorSound = loadSound("/assets/SFXerror.mp3");
  quicktimeFrameImg = loadImage("/assets/quicktime.png"); // your fake QuickTime window
  xButtonImg = loadImage("/assets/xbutton.png"); 
}

function setup() {
  createCanvas(1000, 700);
  textFont("Arial");

  video = createVideo(["/assets/rickroll.mp4"]);
  videoW = 600; // desired width
  videoH = 360; // desired height
  videoX = (width - videoW) / 2+650; // center horizontally
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
    state = "login";
    showLoginDOM(true);
  } else {
    state = "main";
    showLoginDOM(false);
  }
}

function mousePressed() {

// play click sound
  if (clickSound && !clickSound.isPlaying()) {
    clickSound.play();
  }

  // Captcha overlay always takes priority
  if (showCaptcha && captchaModal.active) {
    captchaModal.handleClick(mouseX, mouseY);
    return;
  }

  // --- Stop video if playing ---
if (playing) {
  // X button zone
  const xBtnSize = 40;
  const xBtnX = videoX + videoW - xBtnSize / 2;
  const xBtnY = videoY - xBtnSize / 2;

  const overX =
    mouseX > xBtnX &&
    mouseX < xBtnX + xBtnSize &&
    mouseY > xBtnY &&
    mouseY < xBtnY + xBtnSize;

  // Clicked either the video area or the X button
if (overX) {

 if (errorSound && !errorSound.isPlaying()) {
    errorSound.play();
  }

  //  When the X is clicked — create more Rick Rolls
  for (let i = 0; i < 3; i++) { // create 3 new quick Rickrolls each click
    let clone = createVideo(["/assets/rickroll.mp4"]);
    clone.hide();
    clone.loop();
    clone.volume(1.0);

    // place them randomly across screen
    let x = random(0, width - videoW / 2);
    let y = random(0, height - videoH / 2);
    let w = videoW / random(1.5, 3);
    let h = videoH / random(1.5, 3);

    videoClones.push({ vid: clone, x, y, w, h });
  }

  // also quick flash effect (optional)
  background(255, 0, 0, 80);

  return; // consume click
}

// If clicked video area — stop original Rickroll
if (
  mouseX > videoX &&
  mouseX < videoX + videoW &&
  mouseY > videoY &&
  mouseY < videoY + videoH
) {
  // Stop and hide main video
  video.stop();
  playing = false;

  // Stop and remove all cloned Rickrolls
  for (let c of videoClones) {
    c.vid.stop();
    c.vid.remove(); // remove the HTML video element from DOM
  }
  videoClones = []; // clear the array

  showLoginDOM(true);
  return; // consume click
  }
}

  if (state === "main") {
    // Check plus icon clicks
    for (let pi of plusIcons) {
      if (pi.isMouseOver()) {
        pi.fleeFrom(createVector(mouseX, mouseY));
        return; // consumed
      }
    }

    // Submit button click
    if (
      submitButton &&
      mouseX > submitButton.x &&
      mouseX < submitButton.x + submitButton.w &&
      mouseY > submitButton.y &&
      mouseY < submitButton.y + submitButton.h
    ) {
      lastErrorMsg = "Error 404: Course Submission Server Not Found.";
      state = "error404"; // <- use the actual error state
      submitButton = null;
  // play fail sound once
  if (failSound && !failSound.isPlaying()) {
    failSound.play();
  }
      
      return;
    }

    // Check course cards
    for (let c of courses) {
      if (c.isMouseOver()) {
        // Try to add course: show captcha sometimes
        pendingAddCourse = c;
showCaptcha = true;
captchaModal.reset();
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
  } else if (state === "errorCaptcha" || state === "error404") {
    state = "login";
    showLoginDOM(true);

     // stop fail sound if still playing
  if (failSound && failSound.isPlaying()) {
    failSound.stop();
  }
  }
}

function draw() {
  background(240);

  if (state === "login") {
    drawLogin();
  } else if (state === "main") {
    drawMain();
  } else if (state === "errorCaptcha") {
    drawErrorCaptcha();
  } else if (state === "error404") {
    drawError404();
  }

  
  // Draw captcha overlay on top of everything
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
  // Original Rickroll
  if (quicktimeFrameImg) {
    image(quicktimeFrameImg, videoX - 20, videoY - 30, videoW + 40, videoH + 140);
  }
  image(video, videoX, videoY, videoW, videoH);

  // X button
  if (xButtonImg) {
    const xBtnSize = 40;
    const xBtnX = videoX + videoW - xBtnSize / 2-5;
    const xBtnY = videoY - xBtnSize / 2-10;
    image(xButtonImg, xBtnX, xBtnY, xBtnSize, xBtnSize);
  }

  // 👀 Draw cloned quicktime Rickrolls
  for (let c of videoClones) {
    image(quicktimeFrameImg, c.x - 20, c.y - 30, c.w + 40, c.h + 100);
    image(c.vid, c.x, c.y, c.w, c.h);
  }

  return;
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

  // --- Submit button ---
  const btnX = width - 180;
  const btnY = height - 100;
  const btnW = 140;
  const btnH = 40;

  fill(240, 100, 100);
  stroke(200, 50, 50);
  rect(btnX, btnY, btnW, btnH, 10);

  noStroke();
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Submit", btnX + btnW / 2, btnY + btnH / 2);

  // Save for click detection
  submitButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawErrorCaptcha() {
  background(255, 230, 230);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(50);
  text("ACCESS DENIED", width / 2, height / 2 - 60);

  fill(0);
  textSize(22);
  text("You got it right? Can't be a human then.", width / 2, height / 2);

  fill(100);
  textSize(14);
  text("Click anywhere to return to login.", width / 2, height / 2 + 80);

  // Add some fake captcha visual static
  for (let i = 0; i < 30; i++) {
    stroke(random(255), random(100), random(100));
    line(random(width), random(height), random(width), random(height));
  }
}

function drawError404() {
  background(255); // plain white

  fill(0); // black text
  textAlign(CENTER, CENTER);

  textFont("Helvetica, Arial, sans-serif");
  textSize(200);
  text("404", width / 2, height / 2 - 60);

  textFont("sans-serif");
  textSize(24);
  text("Page Not Found", width / 2, height / 2 + 40);

  textSize(16);
  text("Click anywhere to return to login", width / 2, height / 2 + 80);
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
    "Why am I in Uni",
    "The Meaning of Skibiddi",
    "Mana Manifestation",
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
    this.h = 100;
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
    this.w = 600;
    this.h = 300;
    this.reset();
  }
  reset() {
    this.a = floor(random(2, 12));
    this.b = floor(random(1, 9));
    this.answer = "";
    this.active = true;
    this.msg = "";

  // Click captcha reset
   this.clickTextClicked = false;
    this.clickTextTimer = 300; // reset timer for new captcha
    this.clickTextPos = null;
    this.fakeMes = null;
    this.staticMes = null;


    // Math captcha
    this.a = floor(random(2, 12));
    this.b = floor(random(1, 9));


// Sequence captcha
this.sequence = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // correct order for checking
this.sequenceInput = [];

// create a shuffled copy for button positions
let shuffled = this.sequence.slice();
shuffled.sort(() => random() - 0.5); // simple shuffle

this.buttons = [];
for (let i = 0; i < shuffled.length; i++) {
  const s = shuffled[i];
  this.buttons.push({
    val: s,
    x: 50 + (i % 5) * 60, // arrange in two rows of 5
    y: 100 + floor(i / 5) * 70,
    w: 50,
    h: 50,
    clicked: false,
      });
    }

    // Click captcha
    this.timer = 300; // 5 seconds
    this.clickTextClicked = false;
    this.buttonPos = null;
    this.fakeMes = [];
    for (let i = 0; i < 5; i++) {
  this.fakeMes.push({
    x: random(50, this.w - 50),
    y: random(80, this.h - 60),
    vx: random(-2, 2),
    vy: random(-2, 2),
  });
}

    // Pick a random captcha
    this.captchas = ["math", "click", "sequence", "clickText"];
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
    else if (this.currentCaptcha === "sequence")
      this.drawSequenceCaptcha(cx, cy);
else if (this.currentCaptcha === "clickText")
  this.drawClickTextCaptcha(cx, cy);
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

    if (frameCount % 60 === 0 && !this.buttonClicked)
      this.randomizeButtonPosition(cx, cy);

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
  text("Click the numbers in order.", cx + 16, cy +  48);

  for (let i = 0; i < this.buttons.length; i++) {
    let b = this.buttons[i];
    // visual indication when clicked
    if (b.clicked) fill(150, 255, 150); // light green highlight
    else fill(255, 200, 200);
    const bx = cx + b.x;
    const by = cy + b.y;
    rect(bx, by, b.w, b.h, 6);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(b.val, bx + b.w / 2, by + b.h / 2);
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

/* ---------------------- Chase Captcha ---------------------- */

// Updated drawClickTextCaptcha
drawClickTextCaptcha(cx, cy) {

  // Count down the timer each frame
    if (!this.clickTextClicked) {
        this.clickTextTimer = max(0, this.clickTextTimer - 1);
    }
  const secondsLeft = ceil(this.clickTextTimer / 60);

  textSize(16);
  textAlign(LEFT, TOP);
  fill(20);
  text("Click on the word 'ME'!", cx + 16, cy + 48);

  // --- Initialize real clickable "ME" ---
  if (!this.clickTextPos) {
    const textW = textWidth("ME");
    const textH = 24;
    this.clickTextPos = createVector(
      random(cx + 50, cx + this.w - 50 - textW),
      random(cy + 80, cy + this.h - 60 - textH)
    );
  }

  // --- Initialize flying fake "ME"s ---
  if (!this.fakeMes) {
    this.fakeMes = [];
    for (let i = 0; i < 6; i++) { // 6 flying fakes
      this.fakeMes.push({
        x: random(cx + 20, cx + this.w - 40),
        y: random(cy + 80, cy + this.h - 30),
        vx: random(-2, 2),
        vy: random(-2, 2),
      });
    }
  }

  // --- Initialize static fake "ME"s ---
  if (!this.staticMes) {
    this.staticMes = [];
    for (let i = 0; i < 4; i++) { // 4 static fakes
      this.staticMes.push({
        x: random(cx + 20, cx + this.w - 40),
        y: random(cy + 80, cy + this.h - 30),
      });
    }
  }

  // --- Draw flying fake "ME"s ---
 fill(150, 50, 50);
textSize(16);
for (let f of this.fakeMes) {
  // update position
  f.x += f.vx;
  f.y += f.vy;

  // Bounce off inner modal edges
  const minX = cx + 20;
  const maxX = cx + this.w - 60;  // account for text width
  const minY = cy + 80;
  const maxY = cy + this.h - 40;

  if (f.x < minX || f.x > maxX) f.vx *= -1;
  if (f.y < minY || f.y > maxY) f.vy *= -1;

  // Constrain to stay within bounds
  f.x = constrain(f.x, minX, maxX);
  f.y = constrain(f.y, minY, maxY);

  text("ME", f.x, f.y);
  }

  // --- Draw static fake "ME"s ---
  fill(150, 50, 50, 180); // slightly transparent
  textSize(16);
  for (let s of this.staticMes) {
    text("ME", s.x, s.y);
  }

  // --- Draw actual clickable "ME" ---
  fill(this.clickTextClicked ? "green" : "#ff5555");
  textSize(8);
  text("ME", this.clickTextPos.x, this.clickTextPos.y);

  // Timer warning
  fill(secondsLeft < 10 ? color(255, 0, 0) : 20);
  textSize(14);
  text(`Time left: ${secondsLeft}s`, cx + 16, cy + this.h - 40);

  // Call success/fail if needed
  if (this.clickTextClicked) this.success();
  else if (this.clickTextTimer <= 0) this.fail();

  // Draw captcha buttons
  this.drawButtons(cx, cy);
}




  handleClick(mx, my) {
    const cx = width / 2 - this.w / 2;
    const cy = height / 2 - this.h / 2;

    // Check input rect for Math captcha
    if (this.currentCaptcha === "math") {
      if (mx > cx + 16 && mx < cx + 136 && my > cy + 80 && my < cy + 114)
        return;
      // Submit
      if (
        mx > cx + this.w - 120 &&
        mx < cx + this.w - 28 &&
        my > cy + this.h - 52 &&
        my < cy + this.h - 16
      ) {
        if (int(this.answer) === this.a + this.b) this.fail();
        else this.success();
        return;
      }
    }


    
    // Click captcha button
    if (this.currentCaptcha === "click") {
      if (
        mx > this.buttonPos.x &&
        mx < this.buttonPos.x + 60 &&
        my > this.buttonPos.y &&
        my < this.buttonPos.y + 20
      ) {
        this.buttonClicked = true;
        return;
      }
    }



  // --- Sequence captcha clicks ---
  if (this.currentCaptcha === "sequence") {
    for (let b of this.buttons) {
      const bx = width / 2 - this.w / 2 + b.x;
      const by = height / 2 - this.h / 2 + b.y;

      if (
        mx > bx &&
        mx < bx + b.w &&
        my > by &&
        my < by + b.h &&
        !b.clicked
      ) {
        b.clicked = true;
        this.sequenceInput.push(b.val);

        // check if correct so far
        const correctSeq = this.sequence.slice(0, this.sequenceInput.length);
        const correctSoFar = this.sequenceInput.every(
          (v, i) => v === correctSeq[i]
        );

        if (!correctSoFar) {
          this.fail();
          return;
        }

        // completed sequence successfully
        if (this.sequenceInput.length === this.sequence.length) {
          this.success();
        }
        return;
      }
    }
  }


// Updated handleClick for clickText captcha
if (this.currentCaptcha === "clickText") {
  const tx = this.clickTextPos.x;
  const ty = this.clickTextPos.y;
  const tw = textWidth("ME");
  const th = 24;
  if (mx > tx && mx < tx + tw && my > ty && my < ty + th) {
    this.clickTextClicked = true;
    return;
  }
}

    // Cancel button
    if (
      mx > cx + this.w - 260 &&
      mx < cx + this.w - 168 &&
      my > cy + this.h - 52 &&
      my < cy + this.h - 16
    ) {
      pendingAddCourse = null;
      showCaptcha = false;
      this.active = false;
      return;
    }
  }

  
  success() {
    if (pendingAddCourse) {
      addCourseToSelection(pendingAddCourse); // add course
      pendingAddCourse = null;
    }
    showCaptcha = false;
    this.active = false;
    state = "main";
  }

  fail() {
    pendingAddCourse = null;
    showCaptcha = false;
    this.active = false;
    state = "errorCaptcha";
  }
}

function keyTyped() {
  if (
    showCaptcha &&
    captchaModal.active &&
    captchaModal.currentCaptcha === "math"
  ) {
    if (key === "Backspace")
      captchaModal.answer = captchaModal.answer.slice(0, -1);
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
