/**
 * @type HTMLCanvasElement
 */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const carImage = new Image();
carImage.src = "car.png";

const PI = Math.PI;
const TPI = PI * 2;
const HPI = PI / 2;
const QPI = PI / 4;

const resolution = 192;
const targetFrameRate = 60;
const targetFrameTime = 1000 / targetFrameRate;

let keys = [];
let prevKeys = [];

let axes = {
  drive: 0,
  steer: 0,
};

let axesKeys = {
  drive: ["ArrowUp", "ArrowDown"],
  steer: ["ArrowLeft", "ArrowRight"],
};

const keyDown = (key) => keys[key] ?? false;
const keyPressed = (key) => !prevKeys[key] && keys[key];
const keyReleased = (key) => prevKeys[key] && !keys[key];

const snapKeys = () => {
  for (const key in keys) {
    prevKeys[key] = keys[key];
  }
};

const resetInputs = () => {
  keys = [];
  prevKeys = [];
  for (const axis in axes) {
    if (Object.hasOwnProperty.call(axes, axis)) {
      axes[axis] = 0;
    }
  }
};

const updateAxes = () => {
  for (const axis in axes) {
    if (Object.hasOwnProperty.call(axes, axis)) {
      // do not
      if (!hasTouch) axes[axis] = keyDown(axesKeys[axis][1]) - keyDown(axesKeys[axis][0]);
      if (axes[axis] > 1) axes[axis] = 1;
      else if (axes[axis] < -1) axes[axis] = -1;
    }
  }
};

let car = {
  x: 0,
  y: 0,
  width: 16,
  height: 24,
  rotation: 0,
  velocity: 0,
  maxSpeed: 2.5,
  movementPower: 0.05,
  movementFriction: 0.02,
  steeringAngle: 0,
  turnSensitivty: 0.15,
  rotationPower: 0.05,
  rotationFriction: 0.1,
  bounce: 0.75,
};

let trail = [];

let firstInput = false;
let hasTouch = false;
let hintOpacity = 1;
let showKeys = false;

let paused = false;
let lastTimestamp = 0;
const update = () => {
  const timestamp = performance.now();
  const frameTime = timestamp - lastTimestamp;
  if (paused) return;
  lastTimestamp = timestamp;
  const deltaTime = frameTime / targetFrameTime;

  updateAxes();

  // Update logic here
  // Before logic

  car.velocity -= car.movementFriction * car.velocity;
  car.steeringAngle -= car.rotationFriction * car.steeringAngle;

  if (trail.length > 128 / deltaTime) {
    trail.pop();
  }

  if (firstInput && hintOpacity) {
    hintOpacity *= 0.9;
  }

  // Main logic

  if (axes.drive && Math.abs(car.velocity) < car.maxSpeed) {
    car.velocity += car.movementPower * axes.drive;
  }

  if (keyDown("Space")) {
    car.velocity *= 0.85;
  }

  if (axes.steer) {
    car.steeringAngle += car.rotationPower * axes.steer;
  }
  if (car.steeringAngle > 1) car.steeringAngle = 1;
  else if (car.steeringAngle < -1) car.steeringAngle = -1;

  car.rotation += car.steeringAngle * car.turnSensitivty * -(car.velocity / car.maxSpeed) * deltaTime;
  if (car.rotation >= TPI) car.rotation %= TPI;
  else if (car.rotation < 0) car.rotation = TPI - (Math.abs(car.rotation) % TPI);

  const margin = car.height / 2;

  let changeX = Math.cos(car.rotation + HPI) * car.velocity;
  let changeY = Math.sin(car.rotation + HPI) * car.velocity;

  if (
    car.x + changeX + margin >= canvas.width / 2 ||
    car.x + changeX - margin <= -canvas.width / 2 ||
    car.y + changeY + margin >= canvas.height / 2 ||
    car.y + changeY - margin <= -canvas.height / 2
  ) {
    if (Math.abs(car.velocity) > 0.25) {
      car.velocity *= -car.bounce;
      changeX *= -car.bounce;
      changeY *= -car.bounce;
    } else {
      velocity = 0;
      changeX = 0;
      changeY = 0;
    }
  }

  if (keyPressed("KeyD") && keyDown("Shift")) {
    showKeys = !showKeys;
  }

  car.x += changeX * deltaTime;
  car.y += changeY * deltaTime;

  trail = [[car.x, car.y], ...trail];

  if (car.rotation >= TPI || car.rotation < 0) console.log(car.rotation % TPI);

  snapKeys();
};

const draw = () => {
  requestAnimationFrame(draw);

  ctx.imageSmoothingQuality = "low";
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#0004";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  update();

  // Drawing logic here

  // Trail

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  for (let i = 1; i < trail.length; i++) {
    const point = trail[i];
    ctx.lineTo(point[0], point[1]);
  }
  ctx.strokeStyle = "#4442";
  ctx.lineWidth = car.width;
  ctx.lineJoin = "bevel";
  ctx.lineCap = "butt";
  ctx.stroke();

  ctx.restore();

  // Car

  ctx.save();
  ctx.translate(canvas.width / 2 + car.x, canvas.height / 2 + car.y);
  ctx.rotate(car.rotation);

  ctx.fillStyle = "#f00";
  ctx.drawImage(carImage, -car.width / 2, -car.height / 2, car.width, car.height);

  ctx.restore();

  // Keys

  if (showKeys) {
    if (keyDown("ArrowUp")) ctx.fillStyle = "#fff";
    else ctx.fillStyle = "#888";
    ctx.fillRect(20, 2, 16, 16);

    if (keyDown("ArrowLeft")) ctx.fillStyle = "#fff";
    else ctx.fillStyle = "#888";
    ctx.fillRect(2, 20, 16, 16);

    if (keyDown("ArrowDown")) ctx.fillStyle = "#fff";
    else ctx.fillStyle = "#888";
    ctx.fillRect(20, 20, 16, 16);

    if (keyDown("ArrowRight")) ctx.fillStyle = "#fff";
    else ctx.fillStyle = "#888";
    ctx.fillRect(38, 20, 16, 16);

    if (keyDown("Space")) ctx.fillStyle = "#fff";
    else ctx.fillStyle = "#888";
    ctx.fillRect(2, 38, 52, 16);
  }

  // Gauges

  const end = canvas.width;

  ctx.fillStyle = "#888";
  ctx.fillRect(end - 34, 2, 32, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(end - 34, 2, Math.min(Math.abs(car.velocity) / car.maxSpeed, 1) * 32, 8);

  ctx.fillStyle = "#888";
  ctx.fillRect(end - 34, 12, 32, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(end - 18, 12, Math.min(car.steeringAngle, 1) * 32, 8);

  // Hint

  if (hintOpacity) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = hintOpacity;

    ctx.font = "10px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(hasTouch ? "Swipe to drive." : "Use arrow keys to drive.", 0, car.height + 16);

    ctx.restore();
  }

  // End of cycle logic
};

const resize = () => {
  if (innerWidth <= innerHeight) {
    canvas.width = resolution;
    canvas.height = innerHeight / (innerWidth / resolution);
  } else {
    canvas.height = resolution;
    canvas.width = innerWidth / (innerHeight / resolution);
  }
};

window.addEventListener("keydown", (e) => {
  firstInput = true;
  keys[e.key] = true;
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  keys[e.code] = false;
});

let lastPos = [0, 0];
window.addEventListener("touchstart", (e) => {
  firstInput = true;
  lastPos = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
});
window.addEventListener("touchmove", (e) => {
  axes.drive += (e.changedTouches[0].clientY - lastPos[1]) / 100;
  axes.steer += (e.changedTouches[0].clientX - lastPos[0]) / 100;
  lastPos = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
});
window.addEventListener("touchend", (e) => {
  axes.drive = 0;
  axes.steer = 0;
});

window.addEventListener("blur", () => {
  resetInputs();
  paused = true;
});
window.addEventListener("focus", () => {
  lastTimestamp = performance.now();
  paused = false;
});

window.addEventListener("load", () => {
  if (navigator.maxTouchPoints) {
    hasTouch = true; // i give up
  }
  resize();
  draw();
});
window.addEventListener("resize", resize);
