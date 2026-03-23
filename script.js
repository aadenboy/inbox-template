const form = document.getElementById("form");
const identity = document.getElementById("identity");
const message = document.getElementById("message");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const brushSize = document.getElementById("brush-size");
const color = document.getElementById("color");
const clear = document.getElementById("clear");
const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
const save = document.getElementById("save");
const exportBtn = document.getElementById("export");
const importBtn = document.getElementById("import");
const canvasInput = document.querySelector("input[name='canvas']");
const submit = document.getElementById("submit")
let isDrawing = false;
let strokes = []
let undoStack = [];
ctx.lineCap = "round";
ctx.lineJoin = "round";

const url = "https://docs.google.com/forms/d/e/1FAIpQLSdFQB9QoXHLQDriiW-QA6RqS9eD_-rOUGQI4NkK2_LIAdQxRA/formResponse?usp=pp_url&entry.967521860={{identity}}&entry.1121636087={{message}}&entry.1572319870={{drawing}}"

form.addEventListener("submit", (e) => {
  e.preventDefault();
});
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
  undoStack = [];
  undo.disabled = true;
  redo.disabled = true;
  canvasInput.value = "";
  if (message.value.length == 0 || message.value.match(/^\s+$/)) {
    submit.disabled = true;
  }
});
message.addEventListener("input", () => {
  if (strokes.length == 0 && (message.value.length == 0 || message.value.match(/^\s+$/))) {
    submit.disabled = true;
  } else {
    submit.disabled = false;
  }
});

function drawStroke(stroke, path) {
  path ??= stroke.points;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.moveTo(stroke.points[0][0], stroke.points[0][1])
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
  }
  ctx.stroke();
}

function splitNum(n) {
  if (n < 256) return [n];
  const len = Math.log(n)/Math.log(256);
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(n & 0xff)
    n >>= 8;
  }
  return arr;
}
function exportCanvas() {
  let canvasdata = [];
  for (let stroke of strokes) {
    const r = parseInt(stroke.color.slice(1, 3), 16)
    const g = parseInt(stroke.color.slice(3, 5), 16)
    const b = parseInt(stroke.color.slice(5, 7), 16)
    const len = splitNum(stroke.points.length); // I will kill you if you end up with a stroke with more than 32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230656 points
    canvasdata.push(r, g, b, stroke.size, len.length, ...len, ...stroke.points.flat());
  }
  const bytes = new Uint8Array(canvasdata);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function importCanvas(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
  undoStack = [];
  undo.disabled = true;
  redo.disabled = true;
  let i = 0;
  while (i < bytes.length) {
    const r = bytes[i]; i++;
    const g = bytes[i]; i++;
    const b = bytes[i]; i++;
    const size = bytes[i]; i++;
    const lensize = bytes[i]; i++;
    let len = 0
    for (let j=0; j < lensize; j++) {
      len <<= 8;
      len ||= bytes[i]; i++;
    }
    const stroke = {
      color: "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0"),
      size: size,
      points: []
    }
    for (let j=0; j < len; j++) {
      const pos = [];
      pos.push(bytes[i]); i++;
      pos.push(bytes[i]); i++;
      stroke.points.push(pos);
    }
    drawStroke(stroke);
    strokes.push(stroke);
  }
}

const size = document.getElementById("size")
function recalcSize() {
  const str = exportCanvas();
  size.innerText = "size: " + str.length;
}

submit.addEventListener("click", () => {
  const base64 = exportCanvas();
  canvasInput.value = base64;
  
  const visit = url.replace("{{identity}}", encodeURIComponent(identity.value))
                   .replace("{{message}}", encodeURIComponent(message.value))
                   .replace("{{drawing}}", encodeURIComponent(canvasInput.value));
  window.open(visit);
});
save.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = canvas.toDataURL();
  link.click();
});
exportBtn.addEventListener("click", () => {
  const base64 = exportCanvas();
  canvasInput.value = base64;
  navigator.clipboard.writeText(base64);
});
async function getter() {
  const base64 = await navigator.clipboard.readText();
  importCanvas(base64);
  recalcSize();
}
importBtn.addEventListener("click", () => {
  getter();
})

function perpdist(x1, y1, x2, y2, x, y) {
  return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
}
let epsilon = 0.5;
function DouglasPeucker(points) {
  let dmax = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpdist(points[0][0], points[0][1], points[end][0], points[end][1], points[i][0], points[i][1])
    if (d > dmax) {
      index = i
      dmax = d
    }
  }
  if (dmax > epsilon) {
    const recResults1 = DouglasPeucker(points.slice(0, index + 1), epsilon);
    const recResults2 = DouglasPeucker(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  }
  return [points[0], points[end]]
}

let snapshot;
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  strokes.push({
    color: color.value,
    size: brushSize.value,
    points: [[e.offsetX, e.offsetY]]
  });
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});
canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  strokes[strokes.length - 1].points.push([e.offsetX, e.offsetY]);
  const stroke = strokes[strokes.length - 1];
  const preview = DouglasPeucker(stroke.points);
  ctx.putImageData(snapshot, 0, 0);
  drawStroke(stroke, preview);
});
canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    isDrawing = false;
    const stroke = strokes[strokes.length - 1];
    stroke.points = DouglasPeucker(stroke.points);
    ctx.putImageData(snapshot, 0, 0);
    drawStroke(stroke);
    undoStack = [];
    undo.disabled = false;
    redo.disabled = true;
    submit.disabled = false;
    recalcSize();
  }
});
undo.addEventListener("click", () => {
  undoStack.push(strokes.pop());
  redo.disabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((stroke) => {
    drawStroke(stroke);
  });
  recalcSize();
  if (strokes.length === 0) {
    undo.disabled = true;
    submit.disabled = true;
  }
});
redo.addEventListener("click", () => {
  strokes.push(undoStack.pop());
  drawStroke(strokes[strokes.length - 1]);
  undo.disabled = false;
  submit.disabled = false;
  recalcSize();
  if (undoStack.length === 0) {
    redo.disabled = true;
  }
});
