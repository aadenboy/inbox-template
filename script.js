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
const pen = document.getElementById("pen");
const line = document.getElementById("line");
const rect = document.getElementById("rect");
const circle = document.getElementById("circle");
const fill = document.getElementById("fill");
const erase = document.getElementById("erase");
const layersList = document.getElementById("canvas-layers");
const addLayer = document.getElementById("add-layer");
const layerUp = document.getElementById("layer-up");
const layerDown = document.getElementById("layer-down");
const layerRemove = document.getElementById("layer-remove");
const layerMerge = document.getElementById("layer-merge");
const layerOpacity = document.getElementById("layer-opacity");
const layerBlend = document.getElementById("layer-blend");
const exportBtn = document.getElementById("export");
const importBtn = document.getElementById("import");
const help = document.getElementById("help");
const canvasInput = document.querySelector("input[name='canvas']");
const submit = document.getElementById("submit");
const helpModal = document.getElementById("modal-help");
const helpExit = document.getElementById("exit-help");
const what = document.getElementById("what");
const whatModal = document.getElementById("modal-what");
const whatExit = document.getElementById("exit-what");
let isDrawing = false;
let layers = [{opacity: 100, blending: 0, strokes: [], visible: true}];
let layerPointer = 0;
let undoStack = [];
let undoPointer = -1;
let tool = "pen";
ctx.lineCap = "round";
ctx.lineJoin = "round";

const canvasTools = document.getElementById("canvas-tools");
const canvasLayersContainer = document.getElementById("canvas-layers-container");
const canvasLayerTools = document.getElementById("canvas-layer-tools");
const minimize = document.getElementById("minimize");
const maximize = document.getElementById("maximize");
if (!document.cookie.match("view=")) {
  document.cookie = "view=2";
}
let view = +document.cookie.match("view=([0-9]+)")[1];
function redoview() {
  canvasLayersContainer.style.display = view < 2 ? "none" : "flex";
  canvasLayerTools.style.display = view < 2 ? "none" : "flex";
  canvasTools.style.display = view < 1 ? "none" : "flex";
}
redoview();
minimize.addEventListener("click", () => {
  view = Math.max(0, --view);
  document.cookie = "view=" + view;
  redoview();
});
maximize.addEventListener("click", () => {
  view = Math.min(2, ++view);
  document.cookie = "view=" + view;
  redoview();
});

// https://stackoverflow.com/a/17386803
function isempty() {
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );
  return !pixelBuffer.some(color => color !== 0);
}

function debugggggg() { /*console.log(undoPointer, undoStack)*/ }
function state() {
  const data = exportCanvas();
  undoStack.splice(++undoPointer);
  undoStack.push(data);
  undo.disabled = false;
  redo.disabled = true;
  debugggggg();
}
state();

new ColorPicker(color, {toggleStyle: "input", submitMode: "instant", dialogPlacement: "right"});
pen.addEventListener("change", () => tool = "pen");
line.addEventListener("change", () => tool = "line");
rect.addEventListener("change", () => tool = "rect");
circle.addEventListener("change", () => tool = "circle");

const url = "https://docs.google.com/forms/d/e/1FAIpQLSdFQB9QoXHLQDriiW-QA6RqS9eD_-rOUGQI4NkK2_LIAdQxRA/formResponse?usp=pp_url&entry.967521860={{identity}}&entry.1121636087={{message}}&entry.1572319870={{drawing}}"

what.addEventListener("click", () => whatModal.showModal());
whatExit.addEventListener("click", () => whatModal.close());

help.addEventListener("click", () => helpModal.showModal());
helpExit.addEventListener("click", () => helpModal.close());

form.addEventListener("submit", (e) => {
  e.preventDefault();
});
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  layers = [{opacity: 100, blending: 0, strokes: [], visible: true}];
  state();
  updateLayers();
  undo.disabled = false;
  redo.disabled = true;
  canvasInput.value = "";
  recalcSize();
  clear.innerHTML = "clear";
  if (message.value.length == 0 || message.value.match(/^\s+$/)) {
    submit.disabled = true;
  }
});
message.addEventListener("input", () => {
  submit.disabled = isempty() && (message.value.length == 0 || message.value.match(/^\s+$/));
});

function drawAll() {
  const images = [];
  for (let layer of layers) {
    if (!layer.visible) continue;
    const lcanvas = document.createElement("canvas");
    lcanvas.width = canvas.width;
    lcanvas.height = canvas.height;
    const lctx = lcanvas.getContext("2d");
    for (let stroke of layer.strokes) {
      drawStroke(lctx, stroke);
    }
    images.push(lcanvas);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = images.length - 1; i >= 0; i--) {
    const layer = layers[i];
    ctx.globalAlpha = layer.opacity / 100;
    ctx.globalCompositeOperation = ["source-over", "source-in", "source-out", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "lighter", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"][layer.blending];
    ctx.drawImage(images[i], 0, 0);
  }
}
const ocanvas = document.createElement("canvas");
ocanvas.width = canvas.width;
ocanvas.height = canvas.height;
const octx = ocanvas.getContext("2d");
octx.lineCap = "round";
octx.lineJoin = "round";
function drawStroke(lctx, stroke) {
  let color = stroke.color;
  let opacity = 1;
  if (stroke.color.length > 7) {
    color = stroke.color.slice(0, 7);
    opacity = parseInt(stroke.color.slice(7, 9), 16) / 255;
  }
  octx.clearRect(0, 0, ocanvas.width, ocanvas.height);
  octx.strokeStyle = color;
  octx.fillStyle = color;
  octx.lineWidth = stroke.size;
  octx.beginPath();
  switch (stroke.type) {
    case "pen": {
      octx.moveTo(stroke.points[0][0], stroke.points[0][1])
      for (let i = 1; i < stroke.points.length; i++) {
        octx.lineTo(stroke.points[i][0], stroke.points[i][1]);
      }
      break;
    }
    case "line": {
      octx.moveTo(stroke.x1, stroke.y1);
      octx.lineTo(stroke.x2, stroke.y2);
      break;
    }
    case "rect": {
      octx.moveTo(stroke.x1, stroke.y1);
      octx.lineTo(stroke.x2, stroke.y1);
      octx.lineTo(stroke.x2, stroke.y2);
      octx.lineTo(stroke.x1, stroke.y2);
      octx.lineTo(stroke.x1, stroke.y1);
      break;
    }
    case "circle": {
      octx.ellipse((stroke.x1 + stroke.x2) / 2, (stroke.y1 + stroke.y2) / 2, Math.abs(stroke.x2 - stroke.x1) / 2, Math.abs(stroke.y2 - stroke.y1) / 2, 0, 0, Math.PI * 2);
      break;
    }
  }
  octx.stroke();
  if (stroke.fill) octx.fill();
  if (stroke.erase) lctx.globalCompositeOperation = "destination-out";
  lctx.globalAlpha = opacity;
  lctx.drawImage(ocanvas, 0, 0);
  lctx.globalCompositeOperation = "source-over";
}

function updateLayers() {
  layersList.innerHTML = "";
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const li = document.createElement("li");
    const label = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = layer.visible;
    toggle.addEventListener("change", () => {
      layer.visible = toggle.checked;
      drawAll();
    });
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "layer";
    input.value = i;
    input.checked = i == layerPointer;
    input.addEventListener("change", () => {
      layerPointer = i;
      layerOpacity.value = layer.opacity;
      layerBlend.value = layer.blending;
    });
    li.appendChild(toggle);
    label.appendChild(input);
    label.appendChild(document.createTextNode(`layer ${i + 1}`));
    li.appendChild(label);
    layersList.appendChild(li);
  }
}
updateLayers();
addLayer.addEventListener("click", () => {
  layers.push({opacity: 100, blending: 0, strokes: [], visible: true});
  layerPointer = layers.length - 1;
  updateLayers();
  state();
});
layerDown.addEventListener("click", () => {
  if (layerPointer == layers.length - 1) return;
  const layer = layers[layerPointer];
  layers.splice(layerPointer, 1);
  layers.splice(layerPointer + 1, 0, layer);
  layerPointer++;
  drawAll();
  updateLayers();
  state();
});
layerUp.addEventListener("click", () => {
  if (layerPointer == 0) return;
  const layer = layers[layerPointer];
  layers.splice(layerPointer, 1);
  layers.splice(layerPointer - 1, 0, layer);
  layerPointer--;
  drawAll();
  updateLayers();
  state();
});
layerOpacity.addEventListener("input", () => {
  layers[layerPointer].opacity = layerOpacity.value;
  drawAll();
  state();
});
layerBlend.addEventListener("input", () => {
  layers[layerPointer].blending = layerBlend.value;
  drawAll();
  state();
});
layerRemove.addEventListener("click", () => {
  if (layers.length == 1) return;
  layers.splice(layerPointer, 1);
  layerPointer = Math.min(layerPointer, layers.length - 1);
  drawAll();
  updateLayers();
  state();
});

const MIN = -128;
const MAX = 127;
const INSIDE = 0b0000;
const LEFT   = 0b0001;
const RIGHT  = 0b0010;
const BOTTOM = 0b0100;
const TOP    = 0b1000;
function CohenSutherland(dx, dy) { // simplified since one point is always at the center
  let code = INSIDE;
  if (dx < MIN)      code |= LEFT;
  else if (dx > MAX) code |= RIGHT;
  if (dy < MIN)      code |= BOTTOM;
  else if (dy > MAX) code |= TOP;
  let clipped = !!code;
  while (code) {
    if (code & TOP) {
      dx = dx * MAX / dy;
      dy = MAX;
    } else if (code & BOTTOM) {
      dx = dx * MIN / dy;
      dy = MIN;
    } else if (code & RIGHT) {
      dy = dy * MAX / dx;
      dx = MAX;
    } else if (code & LEFT) {
      dy = dy * MIN / dx;
      dx = MIN;
    }
    code = INSIDE;
    if (dx < MIN)      code |= LEFT;
    else if (dx > MAX) code |= RIGHT;
    if (dy < MIN)      code |= BOTTOM;
    else if (dy > MAX) code |= TOP;
  }
  return {dx, dy, clipped};
}

// this is all documented in the help modal now :D
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
  for (let layer of layers) {
    canvasdata.push(0xff, layer.opacity, layer.blending, layer.visible ? 0x01 : 0x00);
    for (let stroke of layer.strokes) {
      const mode = stroke.erase * 0b1 + stroke.fill * 0b10;
      const r = parseInt(stroke.color.slice(1, 3), 16);
      const g = parseInt(stroke.color.slice(3, 5), 16);
      const b = parseInt(stroke.color.slice(5, 7), 16);
      let a = parseInt(stroke.color.slice(7, 9), 16);
      if (isNaN(a) || a === null) a = 255; // ?? 255 won't work >:(
      switch (stroke.type) {
        case "pen": {
          const len = splitNum(stroke.points.length); // I will kill you if you end up with a stroke with more than 32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230655 points
          canvasdata.push(0x00, mode, r, g, b, a, +stroke.size, len.length, ...len, stroke.points[0][0], stroke.points[0][1]);
          for (let i = 1; i < stroke.points.length; i++) {
            const cur = stroke.points[i];
            const prev = stroke.points[i - 1];
            const dx = cur[0] - prev[0];
            const dy = cur[1] - prev[1];
            const {dx: ndx, dy: ndy, clipped} = CohenSutherland(dx, dy); // also killing you if you feed this 255
            canvasdata.push(ndx & 0xff, ndy & 0xff);
            if (clipped) canvasdata.push((dx - ndx) & 0xff, (dy - ndy) & 0xff);
          }
          break;
        }
        case "line": case "rect": case "circle": {
          canvasdata.push(0x01, mode, r, g, b, a, +stroke.size, stroke.x1, stroke.y1, stroke.x2, stroke.y2);
          break;
        }
      }
    }
  }
  const bytes = new Uint8Array(canvasdata);
  const compressed = pako.deflate(bytes);
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  let data = "3:" + btoa(binary);
  data = data.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); // you can ignore this step
  return data;
}
function importCanvas(base64) {
  let [_, version, params, base64actual] = (base64.match(/^(\d+)([a-z]*):(.+)/) ?? [null, "1", "", base64])
  base64actual = base64actual.replace(/-/g, "+").replace(/_/g, "/");
  let binary = atob(base64actual);
  let bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const absolute = version < 3 || params.match("a");
  if (version > 1) bytes = pako.inflate(bytes);
  if (version < 3) layers = [{opacity: 100, blending: 0, strokes: [], visible: true}];
  else layers = [];
  let currentLayer = layers[layers.length - 1]; // null if version > 3

  let i = 0;
  while (i < bytes.length) {
    const type = version < 3 ? 0x00 : bytes[i];
    i += version < 3 ? 0 : 1;
    let stroke;
    switch (type) {
      case 0xff: {
        const opacity = bytes[i]; i++;
        const blending = bytes[i]; i++;
        const visible = bytes[i]; i++;
        layers.push({opacity, blending, visible, strokes: []});
        currentLayer = layers[layers.length - 1];
        continue;
      }
      case 0x00: {
        const mode = version < 3 ? 0 : bytes[i];
        i += version < 3 ? 0 : 1;
        const erase = mode & 0b1;
        const fill = mode & 0b10;
        const r = bytes[i]; i++;
        const g = bytes[i]; i++;
        const b = bytes[i]; i++;
        const a = version < 3 ? 255 : bytes[i];
        i += version < 3 ? 0 : 1;
        const size = bytes[i]; i++;
        const lensize = bytes[i]; i++;
        let len = 0
        for (let j=0; j < lensize; j++) {
          len |= bytes[i] << (8 * j);
          i++;
        }
        stroke = {
          type: "pen",
          erase: !!erase,
          fill: !!fill,
          color: "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0") + a.toString(16).padStart(2, "0"),
          size: size,
          points: []
        }
        for (let j=0; j < len; j++) {
          let pos = [];
          pos.push(bytes[i]); i++;
          pos.push(bytes[i]); i++;
          if (!absolute && stroke.points.length > 0) {
            const last = stroke.points[stroke.points.length - 1];
            pos = [last[0] + (pos[0] << 24 >> 24), last[1] + (pos[1] << 24 >> 24)];
          }
          stroke.points.push(pos);
        }
        break;
      }
      case 0x01: case 0x02: case 0x03: {
        const mode = bytes[i]; i++;
        const erase = mode & 0b1;
        const fill = mode & 0b10;
        const r = bytes[i]; i++;
        const g = bytes[i]; i++;
        const b = bytes[i]; i++;
        const a = bytes[i]; i++;
        const size = bytes[i]; i++;
        const x1 = bytes[i]; i++;
        const y1 = bytes[i]; i++;
        const x2 = bytes[i]; i++;
        const y2 = bytes[i]; i++;
        stroke = {
          type: ["line", "rect", "circle"][type],
          erase: !!erase,
          fill: !!fill,
          color: "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0") + a.toString(16).padStart(2, "0"),
          size: size,
          x1, y1, x2, y2
        };
        break;
      }
      default: {
        throw new Error("invalid stroke type " + type);
      }
    }
    currentLayer.strokes.push(stroke);
  }
  drawAll();
}

const size = document.getElementById("size")
function recalcSize(str) {
  str ??= exportCanvas();
  //const urlstr = encodeURIComponent(str).replace(/%3A/g, ':');
  size.innerHTML = "size: " + str.length; //+ "<br><i><small>(" + urlstr.length + " in URL)</small></i>";
}

submit.addEventListener("click", () => {
  const base64 = exportCanvas();
  canvasInput.value = base64;

  const visit = url.replace("{{identity}}", encodeURIComponent(identity.value))
                   .replace("{{message}}", encodeURIComponent(message.value))
                   .replace("{{drawing}}", encodeURIComponent(canvasInput.value).replace(/%3A/g, ':'));
  window.open(visit);
});

const filesave = document.getElementById("filesave");
const filename = document.getElementById("filename");
const savefile = document.getElementById("save-file");
const exitfilesave = document.getElementById("exit-filesave");
save.addEventListener("click", () => {
  filesave.showModal();
  //const link = document.createElement("a");
  //link.download = "drawing.png";
  //link.href = canvas.toDataURL();
  //link.click();
});
savefile.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = (filename.value ?? "drawing") + ".png";
  link.href = canvas.toDataURL();
  link.click();
  filesave.close();
});
exitfilesave.addEventListener("click", () => filesave.close());

exportBtn.addEventListener("click", () => {
  const base64 = exportCanvas();
  canvasInput.value = base64;
  navigator.clipboard.writeText(base64);
});
async function getter() {
  const base64 = await navigator.clipboard.readText();
  importCanvas(base64);
  undoStack = [];
  undoPointer = -1;
  layerPointer = 0;
  undo.disabled = true;
  redo.disabled = true;
  state();
  updateLayers();
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
  let end = points.length - 1;
  let endsequal = points[0][0] == points[end][0] && points[0][1] == points[end][1];
  end -= endsequal ? 1 : 0;
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
  end += endsequal ? 1 : 0;
  return [points[0], points[end]]
}

let snapshot;
const device = window.navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) ? "touch" : "mouse";

function startStroke(x, y) {
  isDrawing = true;
  if (!layers[layerPointer]) {
    layerPointer = 0;
    updateLayers();
  }
  const layer = layers[layerPointer];
  switch (tool) {
    case "pen": {
      layer.strokes.push({
        type: "pen",
        erase: erase.checked,
        fill: fill.checked,
        color: color.value,
        size: brushSize.value,
        points: [[x, y]]
      });
      break;
    }
    default: {
      layer.strokes.push({
        type: tool,
        erase: erase.checked,
        fill: fill.checked,
        color: color.value,
        size: brushSize.value,
        x1: x,
        y1: y,
        x2: x,
        y2: y
      });
      break;
    }
  }
}
function continueStroke(x, y) {
  if (!isDrawing) return;
  const layer = layers[layerPointer];
  const stroke = layer.strokes[layer.strokes.length - 1];
  switch (tool) {
    case "pen": {
      stroke.points.push([x, y]);
      break;
    }
    default: {
      stroke.x2 = x;
      stroke.y2 = y;
      break;
    }
  }
  drawAll();
}
function endStroke() {
  if (!isDrawing) return;
  isDrawing = false;
  const layer = layers[layerPointer];
  const stroke = layer.strokes[layer.strokes.length - 1];
  if (tool == "pen") stroke.points = DouglasPeucker(stroke.points);
  drawAll();
  state();
  submit.disabled = false;
  recalcSize();
}

if (device == "mouse") {
  canvas.addEventListener("mousedown", (e) => {
    startStroke(e.offsetX, e.offsetY);
  });
  canvas.addEventListener("mousemove", (e) => {
    continueStroke(e.offsetX, e.offsetY);
  });
  document.addEventListener("mouseup", endStroke);
  canvas.addEventListener("mouseenter", (e) => {
    continueStroke(e.offsetX, e.offsetY);
  })
  canvas.addEventListener("mouseleave", (e) => {
    continueStroke(e.offsetX, e.offsetY);
  });
} else {
  canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    startStroke(x, y);
  });
  canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    continueStroke(x, y);
  });
  document.addEventListener("touchend", endStroke);
}
undo.addEventListener("click", () => {
  const current = undoStack[--undoPointer];
  debugggggg();
  importCanvas(current);
  recalcSize(current);
  updateLayers();
  redo.disabled = false;
  if (!undoPointer) {
    undo.disabled = true;
    submit.disabled = true;
  }
});
redo.addEventListener("click", () => {
  undo.disabled = false;
  submit.disabled = false;
  const current = undoStack[++undoPointer];
  debugggggg();
  importCanvas(current);
  recalcSize(current);
  updateLayers()
  if (undoPointer == undoStack.length - 1) {
    redo.disabled = true;
  }
});

// silliness
const caption = document.getElementById("caption");
const captions = [
  "built in a cave with a box of scraps because google forms works well enough",
  "so ridiculous...",
  "so unnecessary...",
  "thanks github",
  "I DO READ THEM ALL",
  "I might've lost the plot",
  "only a little bit overcomplicated",
  "better than Straw.Page!",
  "thanks google",
  "thanks gzip",
  "accessible, I think!",
  "the canvas is probably why you're here",
  "no I totally didn't put too much effort into a single feature",
  "HAHA FREE FAN ART FOR ME",
  "QUICK!!! PRESS CTRL+W!!!!!!",
  "look at my amazing website design skills",
  "waiter waiter there's a form in my drawing tool",
  "hey how do I bloat this so that it isn't 99% canvas",
  "yes, it can play bad apple",
  "no it CANNOT run doom do NOT get any ideas. this is NOT turing complete",
  "thanks gratkrzy",
  "thanks anon",
  "fully automatable!",
  "this is not at all optimized!",
  "so much complexity and I still limit you to a 250x200 canvas just so I can stuff all the values into 8 bits",
  "IT'S LITERALLY MSPAINT IN THE WEB."
]
caption.innerHTML = captions[(Math.random()*captions.length)|0]; // haha
