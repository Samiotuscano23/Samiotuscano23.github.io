// import * as tf from '@tensorflow/tfjs-core';
// import * as posenet from '../src';


var color = 'red';
var lineWidth = 5;
var scale=1;
function toTuples({ y, x }) {
  return [y, x];
}

function drawSegments([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSkeletons(keypoints, minConfidence, ctx, scale = 1) {
	
	if(compareLeftElbow(keypoints[5].position,keypoints[7].position,keypoints[9].position,keypoints[11].position)==1){
		colors='green';
		
	}
	else{
		colors='black';
	}
	
	if(compareRightElbow(keypoints[6].position,keypoints[8].position,keypoints[10].position,keypoints[12].position)==1){
		colorR='green';
		
	}
	else{
		colorR='black';
	}
	
	if(compareLeftLeg(keypoints[11].position,keypoints[13].position,keypoints[15].position,keypoints[12].position)==1){
		colorsLL='green';
		
	}
	else{
		colorsLL='black';
	}
	
	if(compareRightLeg(keypoints[12].position,keypoints[14].position,keypoints[16].position,keypoints[11].position)==1){
		colorsRL='green';
		
	}
	else{
		colorsRL='black';
	}
	
	
if(keypoints[5].score >= minConfidence && keypoints[7].score >= minConfidence){ 

drawSegments(toTuple(keypoints[5].position),
      toTuple(keypoints[7].position), colors, scale, ctx);
}
if(keypoints[7].score >= minConfidence && keypoints[9].score >= minConfidence){ 
			  
drawSegments(toTuple(keypoints[7].position),
      toTuple(keypoints[9].position), colors, scale, ctx);
	  
}
		
	
	
if(keypoints[6].score >= minConfidence && keypoints[8].score >= minConfidence){ 		
	drawSegments(toTuple(keypoints[6].position),
  toTuple(keypoints[8].position), colorR, scale, ctx);
}
if(keypoints[8].score >= minConfidence && keypoints[10].score >= minConfidence){ 
		
    drawSegments(toTuple(keypoints[8].position),
    toTuple(keypoints[10].position), colorR, scale, ctx);
	  }  

if(keypoints[12].score >= minConfidence && keypoints[14].score >= minConfidence){ 
		
    drawSegments(toTuple(keypoints[12].position),
    toTuple(keypoints[14].position), colorsRL, scale, ctx);
}
if(keypoints[14].score >= minConfidence && keypoints[16].score >= minConfidence){ 	  
    drawSegments(toTuple(keypoints[14].position),
    toTuple(keypoints[16].position), colorsRL, scale, ctx);
}  

if(keypoints[11].score >= minConfidence && keypoints[13].score >= minConfidence){ 
    drawSegments(toTuple(keypoints[11].position),
    toTuple(keypoints[13].position), colorsLL, scale, ctx);
}
if(keypoints[13].score >= minConfidence && keypoints[15].score >= minConfidence){  
    drawSegments(toTuple(keypoints[13].position),
    toTuple(keypoints[15].position), colorsLL, scale, ctx);
}

if(keypoints[5].score >= minConfidence && keypoints[6].score > minConfidence){ 			  
    drawSegments(toTuple(keypoints[5].position),
    toTuple(keypoints[6].position), color, scale, ctx);
}
if(keypoints[6].score >= minConfidence && keypoints[12].score >= minConfidence){ 	
    drawSegments(toTuple(keypoints[6].position),
    toTuple(keypoints[12].position), color, scale, ctx);
}
if(keypoints[11].score >= minConfidence && keypoints[12].score >= minConfidence){ 
    drawSegments(toTuple(keypoints[11].position),
    toTuple(keypoints[12].position), color, scale, ctx);
}
if(keypoints[5].score >= minConfidence && keypoints[11].score >= minConfidence){ 		 
    drawSegments(toTuple(keypoints[5].position),
    toTuple(keypoints[11].position), color, scale, ctx);
}	  
}

function drawKeypointss(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    var keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    var { y, x } = keypoint.position;
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawBoundingBoxs(keypoints, ctx) {
  var boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(boundingBox.minX, boundingBox.minY,
    boundingBox.maxX - boundingBox.minX, boundingBox.maxY - boundingBox.minY);

  ctx.stroke();
}

async function renderToCanvass(a, ctx) {
  var [height, width] = a.shape;
  var imageData = new ImageData(width, height);

  var data = await a.data();

  for (let i = 0; i < height * width; ++i) {
    var j = i * 4;
    var k = i * 3;

    imageData.data[j + 0] = data[k + 0];
    imageData.data[j + 1] = data[k + 1];
    imageData.data[j + 2] = data[k + 2];
    imageData.data[j + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

function renderImageToCanvass(image, size, canvas) {
  canvas.width = size[0];
  canvas.height = size[1];
  var ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
}

function drawHeatMapValuess(heatMapValues, outputStride, canvas) {
  var ctx = canvas.getContext('2d');
  var radius = 5;
  var scaledValues = heatMapValues.mul(tf.scalar(outputStride, 'int32'));

  drawPointss(ctx, scaledValues, radius, color);
}

function drawPointss(ctx, points, radius, color) {
  var data = points.buffer().values;

  for (let i = 0; i < data.length; i += 2) {
    var pointY = data[i];
    var pointX = data[i + 1];

    if (pointX !== 0 && pointY !== 0) {
      ctx.beginPath();
      ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

function drawOffsetVectorss(
  heatMapValues, offsets, outputStride, scale = 1, ctx) {
  var offsetPoints = posenet.singlePose.getOffsetPoints(
    heatMapValues, outputStride, offsets);

  var heatmapData = heatMapValues.buffer().values;
  var offsetPointsData = offsetPoints.buffer().values;

  for (let i = 0; i < heatmapData.length; i += 2) {
    var heatmapY = heatmapData[i] * outputStride;
    var heatmapX = heatmapData[i + 1] * outputStride;
    var offsetPointY = offsetPointsData[i];
    var offsetPointX = offsetPointsData[i + 1];

    drawSegments([heatmapY, heatmapX], [offsetPointY, offsetPointX],
      color, scale, ctx);
  }
}
