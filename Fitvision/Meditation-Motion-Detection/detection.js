const store = {
  data: [],
  box: []
};

// Create the canvas environment and flip it horizontally
function getEnvironment(width = 768, height = 576, smooth = false) {
  const env = { canvas: document.createElement('canvas') };
  env.canvas.width = width;
  env.canvas.height = height;
  env.context = env.canvas.getContext('2d');
  env.context.imageSmoothingEnabled = smooth;

  // Apply horizontal flip
  env.context.translate(width, 0);
  env.context.scale(-1, 1); // Flip horizontally

  return env;
}

// Get image data from canvas or video feed (supports both canvas and video input)
function getData(image, width = 768, height = 576, env) {
  const w = image.width || width;
  const h = image.height || height;
  const { context } = env || getEnvironment(w, h);

  // Clear previous frame
  context.clearRect(0, 0, w, h);

  // Draw the video/canvas feed, which is now mirrored horizontally
  context.drawImage(image, 0, 0, w, h);

  return context.getImageData(0, 0, w, h).data;
}

// Draw processed image data back onto the canvas
function drawData(context, data, x, y, w, h, processFn = x => x, params = []) {
  const processedData = processFn(data, ...params);
  const imageData = new ImageData(processedData, w, h);
  context.putImageData(imageData, x, y);
}

// Get luminance of an RGB pixel
function getLuminance(r, g, b) {
  return (r + g + b) / 3;
}

// Get brightness using weighted values for R, G, and B channels
function getBrightness(r, g, b) {
  const rr = 0.299;
  const rg = 0.587;
  const rb = 0.114;
  return (r * rr + g * rg + b * rb) / (rr + rg + rb);
}

// Apply a filter to pixel data
function filter(data = [], filterFn = () => {}) {
  const d = data.slice();
  for (let i = 0; i < d.length; i += 4) {
    const { r, g, b, a } = filterFn(d[i], d[i + 1], d[i + 2], d[i + 3]);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  }
  return d;
}

// Calculate the difference between two frames (current and comparison)
function getDifference(data, compare) {
  let n = 0;
  return filter(data, (r, g, b) => {
    const cr = compare[n];
    const cg = compare[n + 1];
    const cb = compare[n + 2];
    const l1 = getLuminance(r, g, b);
    const l2 = getLuminance(cr, cg, cb);
    const l3 = (255 - l1 + l2) / 2;
    n += 4;
    return { r: l3, g: l3, b: l3, a: 255 };
  });
}

// Calculate average luminance of the frame
function getAverage(data) {
  let total = 0;
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const luma = getLuminance(data[i], data[i + 1], data[i + 2]);
    total += luma;
    if (luma > max) max = luma;
    if (luma < min) min = luma;
  }

  const mean = Math.round((total * 4) / data.length);
  return { mean, min: Math.round(min), max: Math.round(max) };
}

// Calculate the bounds of a region based on luminance threshold
function getBounds(data, width, threshold = 31, base = 128) {
  let pixel = 0;
  let xMin = Infinity;
  let xMax = 0;
  let yMin = Infinity;
  let yMax = 0;
  filter(data, (r, g, b) => {
    const luma = getLuminance(r, g, b);
    const diff = Math.abs(Math.round(luma - base));
    if (diff > threshold) {
      const coord = getCoordinate(pixel, width);
      if (coord.x < xMin) xMin = coord.x;
      if (coord.x > xMax) xMax = coord.x;
      if (coord.y < yMin) yMin = coord.y;
      if (coord.y > yMax) yMax = coord.y;
    }
    pixel++;
    return { r, g, b, a: 255 };
  });
  return { xMin, xMax, yMin, yMax };
}

// Smooth out the detected region by averaging the rectangle bounds over time
function getAverageRectangle(box, n = 3) {
  store.box.push(box);
  if (store.box.length > n) store.box.shift();
  const length = store.box.length;
  const r = store.box.reduce(
    (prev, curr) => ({
      xMin: prev.xMin + curr.xMin,
      xMax: prev.xMax + curr.xMax,
      yMin: prev.yMin + curr.yMin,
      yMax: prev.yMax + curr.yMax
    }),
    { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
  );
  return {
    x: r.xMin / length,
    y: r.yMin / length,
    w: r.xMax / length - r.xMin / length,
    h: r.yMax / length - r.yMin / length
  };
}

// Calculate threshold based on the pixel data
function getThreshold(data, factor = 0.67, ratio = 1.5, base = 127) {
  const { mean, min, max } = getAverage(data);
  const value = Math.abs(base - (min - max + 255) / 2);
  if (value > min * ratio && value < max / ratio) return value * factor;
  return 255;
}

// Get the coordinate of a pixel based on its index in a one-dimensional array
function getCoordinate(index, width = 768) {
  return {
    x: index % width,
    y: Math.floor(index / width)
  };
}
