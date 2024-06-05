/**
 * @type HTMLCanvasElement
 */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const carImage = new Image();
carImage.src = "./car.png";

const PI = Math.PI;
const TPI = PI * 2;
const HPI = PI / 2;

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
	for (let i = 0; i < keys.length; i++) keys[i] = false;
};

const power = 0.1;
const friction = 0.075;

let car = {
	x: 0,
	y: 0,
	width: 16,
	height: 24,
	rotation: 0,
	baseSpeed: 2,
	velocity: 0,
	handling: 0.05,
	torque: 0,
};

let trail = [];

let lastTimestamp = 0;
const draw = () => {
	requestAnimationFrame(draw);
	const timestamp = performance.now();
	const frameTime = timestamp - lastTimestamp;
	lastTimestamp = timestamp;
	const deltaTime = frameTime / targetFrameTime;

	ctx.imageSmoothingQuality = "low";
	ctx.imageSmoothingEnabled = false;
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#0004";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Update logic here

	if (keyDown("ArrowUp")) {
		if (car.velocity > -1) {
			car.velocity -= power;
		} else car.velocity = -1;
	}
	if (keyDown("ArrowDown")) {
		if (car.velocity < 1) {
			car.velocity += power;
		} else car.velocity = 1;
	}

	if (keyDown("Space")) {
		car.velocity *= 0.75;
	}

	if (keyDown("ArrowLeft")) {
		if (car.torque > -1) {
			car.torque -= power;
		} else car.torque = -1;
	}
	if (keyDown("ArrowRight")) {
		if (car.torque < 1) {
			car.torque += power;
		} else car.torque = 1;
	}

	car.rotation += car.torque * Math.abs(car.velocity) * car.handling * deltaTime;
	if (car.rotation >= TPI) {
		car.rotation = car.rotation % TPI;
	} else if (car.rotation < 0) {
		car.rotation = TPI - (car.rotation % TPI);
	}

	const margin = car.height / 2;

	let changeX = Math.cos(car.rotation + HPI) * car.velocity * car.baseSpeed * deltaTime;
	let changeY = Math.sin(car.rotation + HPI) * car.velocity * car.baseSpeed * deltaTime;

	if (
		car.x + changeX + margin >= canvas.width / 2 ||
		car.x + changeX - margin <= -canvas.width / 2 ||
		car.y + changeY + margin >= canvas.height / 2 ||
		car.y + changeY - margin <= -canvas.height / 2
	) {
		car.velocity *= -1;
	}

	changeX = Math.cos(car.rotation + HPI) * car.velocity * car.baseSpeed * deltaTime;
	changeY = Math.sin(car.rotation + HPI) * car.velocity * car.baseSpeed * deltaTime;

	car.x += changeX;
	car.y += changeY;

	trail = [[car.x, car.y], ...trail];

	if (trail.length > 128 / deltaTime) {
		trail.pop();
	}

	car.velocity *= 1 - friction;
	car.torque *= 1 - friction;

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

	// End of cycle logic
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

document.addEventListener("keydown", (e) => {
	keys[e.code] = true;
});
document.addEventListener("keyup", (e) => {
	keys[e.code] = false;
});

window.addEventListener("blur", resetKeys);

window.addEventListener("load", () => {
	resize();
	draw();
});
window.addEventListener("resize", resize);
