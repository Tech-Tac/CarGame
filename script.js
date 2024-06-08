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

const keyDown = (key) => keys[key] ?? false;
const keyPressed = (key) => prevKeys[key] ?? false < keys[key] ?? false;
const keyReleased = (key) => prevKeys[key] ?? false > keys[key] ?? false;

const snapKeys = () => {
	prevKeys = [...keys];
};

const resetKeys = () => {
	keys = [];
	prevKeys = [];
};

let car = {
	x: 0,
	y: 0,
	width: 16,
	height: 24,
	rotation: 0,
	velocity: 0,
	maxSpeed: 2.5,
	movementPower: 0.075,
	movementFriction: 0.025,
	steeringAngle: 0,
	turnSensitivty: 0.15,
	rotationPower: 0.05,
	rotationFriction: 0.1,
	bounce: 0.75,
};

let trail = [];

let firstInput = false;
let hintOpacity = 1;

let paused = false;
let lastTimestamp = 0;
const draw = () => {
	requestAnimationFrame(draw);
	const timestamp = performance.now();
	const frameTime = timestamp - lastTimestamp;
	if (paused) return;
	lastTimestamp = timestamp;
	const deltaTime = frameTime / targetFrameTime;

	ctx.imageSmoothingQuality = "low";
	ctx.imageSmoothingEnabled = false;
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#0004";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Update logic here

	if (keyDown("ArrowUp")) {
		car.velocity -= car.movementPower;
	}
	if (car.velocity < -car.maxSpeed) car.velocity = -car.maxSpeed;

	if (keyDown("ArrowDown")) {
		car.velocity += car.movementPower;
	}
	if (car.velocity > car.maxSpeed) car.velocity = car.maxSpeed;

	if (keyDown("Space")) {
		car.velocity *= 0.85;
	}

	if (keyDown("ArrowRight")) {
		car.steeringAngle += car.rotationPower;
	}
	if (car.steeringAngle > 1) car.steeringAngle = 1;

	if (keyDown("ArrowLeft")) {
		car.steeringAngle -= car.rotationPower;
	}
	if (car.steeringAngle < -1) car.steeringAngle = -1;

	car.rotation += car.steeringAngle * car.turnSensitivty * -(car.velocity / car.maxSpeed) * deltaTime;
	if (car.rotation >= TPI) {
		car.rotation = car.rotation % TPI;
	} else if (car.rotation < 0) {
		car.rotation = TPI - (car.rotation % TPI);
	}

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

	// Drawing logic here
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);

	ctx.beginPath();
	ctx.moveTo(car.x, car.y);
	for (let i = 1; i < trail.length; i++) {
		const point = trail[i];
		ctx.lineTo(point[0], point[1]);
	}
	ctx.strokeStyle = "#1112";
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

	// Gauges

	const end = canvas.width;

	ctx.fillStyle = "#888";
	ctx.fillRect(end - 34, 2, 32, 8);
	ctx.fillStyle = "#fff";
	ctx.fillRect(end - 34, 2, (Math.abs(car.velocity) / car.maxSpeed) * 32, 8);

	ctx.fillStyle = "#888";
	ctx.fillRect(end - 34, 12, 32, 8);
	ctx.fillStyle = "#fff";
	ctx.fillRect(end - 18, 12, car.steeringAngle * 32, 8);

	// Hint

	if (hintOpacity) {
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.globalAlpha = hintOpacity;

		ctx.font = "10px monospace";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText("Use arrow keys to drive.", 0, car.height + 16);

		ctx.restore();
	}

	// End of cycle logic

	car.x += changeX * deltaTime;
	car.y += changeY * deltaTime;

	trail = [[car.x, car.y], ...trail];

	if (trail.length > 128 / deltaTime) {
		trail.pop();
	}

	car.velocity -= car.movementFriction * car.velocity;
	car.steeringAngle -= car.rotationFriction * car.steeringAngle;

	if (firstInput && hintOpacity) {
		hintOpacity *= 0.9;
	}

	snapKeys();
};

const resize = () => {
	/* canvas.width = innerWidth;
	canvas.height = innerHeight; */
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
	keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
	keys[e.code] = false;
});

window.addEventListener("blur", () => {
	resetKeys();
	paused = true;
});
window.addEventListener("focus", () => {
	lastTimestamp = performance.now();
	paused = false;
});

window.addEventListener("load", () => {
	resize();
	draw();
});
window.addEventListener("resize", resize);
