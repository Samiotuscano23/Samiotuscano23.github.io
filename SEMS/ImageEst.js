var colors = 'red';
var lineWidths = 5;
var scales=1;

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
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

async function start(){
var imageScaleFactor = 0.8;
    var flipHorizontal = false;
    var outputStride = 8;
    var maxPoseDetections = 2;
	var minPoseConfidence=0.2;
	var minPartConfidence=0.15;
    var imageElement = document.getElementById('cat');

    var net =  await posenet.load();
	var canvas = document.getElementById('poster');
var ctx = canvas.getContext('2d')
	var poses = await net.estimateMultiplePoses(imageElement, imageScaleFactor, flipHorizontal, outputStride,
          maxPoseDetections,
          minPartConfidence,
          );
		 poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
       
          drawKeypoints(keypoints, minPartConfidence, ctx, scales);
          draw(keypoints,ctx);
      }
    });
}

function toTuple({ y, x }) 
{
  return [y, x];
}

    
	
  function drawSegmentss([ay, ax], [by, bx], colors, scales, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scales, ay * scales);
  ctx.lineTo(bx * scales, by * scales);
  ctx.lineWidth = lineWidths;
  ctx.strokeStyle = colors;
  ctx.stroke();
}
	
function draw(keypoints,ctx){

      setKeypoints(keypoints);	
      drawSegmentss(toTuple(keypoints[5].position),
      toTuple(keypoints[7].position), colors, scales, ctx);
	drawSegmentss(toTuple(keypoints[7].position),
      toTuple(keypoints[9].position), colors, scales, ctx);

	drawSegmentss(toTuple(keypoints[6].position),
      toTuple(keypoints[8].position), colors, scales, ctx);

      drawSegmentss(toTuple(keypoints[8].position),
      toTuple(keypoints[10].position), colors, scales, ctx);
      
      drawSegmentss(toTuple(keypoints[12].position),
      toTuple(keypoints[14].position), colors, scales, ctx);
	  
      drawSegmentss(toTuple(keypoints[14].position),
      toTuple(keypoints[16].position), colors, scales, ctx);
	  
      drawSegmentss(toTuple(keypoints[11].position),
      toTuple(keypoints[13].position), colors, scales, ctx);
	  
      drawSegmentss(toTuple(keypoints[13].position),
      toTuple(keypoints[15].position), colors, scales, ctx);

      drawSegmentss(toTuple(keypoints[5].position),
      toTuple(keypoints[6].position), colors, scales, ctx);

      drawSegmentss(toTuple(keypoints[6].position),
      toTuple(keypoints[12].position), colors, scales, ctx);
	  
      drawSegmentss(toTuple(keypoints[11].position),
      toTuple(keypoints[12].position), colors, scales, ctx);
	  
      drawSegmentss(toTuple(keypoints[5].position),
      toTuple(keypoints[11].position), colors, scales, ctx);
	}	
start();