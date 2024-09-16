
// import dat from 'dat.gui';
// import Stats from 'stats.js';
// import * as posenet from '../src';

// import { drawKeypoints, drawSkeleton } from './demo_util';
var maxVideoSize = 513;
var canvasSize = 700;
var stats = new Stats();
var Wpose;
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}
 
async function setupCamera() {
  var video = document.getElementById('video');
  video.width = maxVideoSize;
  video.height = maxVideoSize;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var mobile = isMobile();
    const stream = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        facingMode: 'user',
        width: mobile ? undefined : maxVideoSize,
        height: mobile ? undefined: maxVideoSize}
    });
    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  } else {
    var errorMessage = "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
    return Promise.reject(errorMessage);
  }
}

async function loadVideo() {
  var video = await setupCamera();
  video.play();

  return video;
}

var guiState = {
  algorithm: 'single-pose',
  input: {
    mobileNetArchitecture: isMobile() ? '0.75' : '0.5',
    outputStride: 16,
    imageScaleFactor: 0.5,
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 5,
    minPoseConfidence: 0.2,
    minPartConfidence: 0.15,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
  },
  net: null,
};

function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  var cameraOptions = cameras.reduce((result, { label, deviceId }) => {
    result[label] = deviceId;
    return result;
  }, {});

  var gui = new dat.GUI({ width: 300 });


  var algorithmController = gui.add(
    guiState, 'algorithm', ['single-pose', 'multi-pose']);

  let input = gui.addFolder('Input');

  var architectureController =
    input.add(guiState.input, 'mobileNetArchitecture', ['1.01', '1.00', '0.75', '0.50']);

  input.add(guiState.input, 'outputStride', [8, 16, 32]);

  input.add(guiState.input, 'imageScaleFactor').min(0.2).max(1.0);
  input.open();

  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);
  single.open();

  let multi = gui.addFolder('Multi Pose Detection');
  multi.add(
    guiState.multiPoseDetection, 'maxPoseDetections').min(1).max(20).step(1);
  multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);

  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.open();


  architectureController.onChange(function (architecture) {
    guiState.changeToArchitecture = architecture;
  });

  algorithmController.onChange(function (value) {
    switch (guiState.algorithm) {
      case 'single-pose':
        multi.close();
        single.open();
        break;
      case 'multi-pose':
        single.close();
        multi.open();
        break;
    }
  });
}

function setupFPS() {
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
}

function detectPoseInRealTime(video, net) {
  var canvas = document.getElementById('output');
  var ctx = canvas.getContext('2d');
  var flipHorizontal = true; 

  canvas.width = canvasSize;
  canvas.height = maxVideoSize;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      guiState.net.dispose();
      guiState.net = await posenet.load(Number(guiState.changeToArchitecture));

      guiState.changeToArchitecture = null;
    }

    stats.begin();
    var imageScaleFactor = guiState.input.imageScaleFactor;
    var outputStride = Number(guiState.input.outputStride);
	  let poses= []
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case 'single-pose':
        var pose = await guiState.net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
        
		//WebPose(pose);
		poses.push(pose);

        minPoseConfidence = Number(
          guiState.singlePoseDetection.minPoseConfidence);
        minPartConfidence = Number(
          guiState.singlePoseDetection.minPartConfidence);
        break;
      case 'multi-pose':
        poses = await guiState.net.estimateMultiplePoses(video, imageScaleFactor, flipHorizontal, outputStride,
          guiState.multiPoseDetection.maxPoseDetections,
          guiState.multiPoseDetection.minPartConfidence,
          guiState.multiPoseDetection.nmsRadius);

        minPoseConfidence = Number(guiState.multiPoseDetection.minPoseConfidence);
        minPartConfidence = Number(guiState.multiPoseDetection.minPartConfidence);
        break;
    }
	
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvasSize, 0);
      ctx.drawImage(video, 0, 0, canvasSize, canvasSize);
      ctx.restore();
    }

    var scale = canvasSize / video.width;

    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          drawKeypointss(keypoints, minPartConfidence, ctx, scale);
        }
        if (guiState.output.showSkeleton) {
          drawSkeletons(keypoints, minPartConfidence, ctx, scale);
        }
      }
    });
    stats.end();
	
    requestAnimationFrame(poseDetectionFrame);
	
  }

  poseDetectionFrame();
}

async function bindPage() {
  var net = await posenet.load();

  document.getElementById('loading').style.display = 'none';
  document.getElementById('main').style.display = 'block';

  let video;

  try {
    video = await loadVideo();
  } catch(e) {
    console.error(e);
    return;
  }

  setupGui([], net);
  setupFPS();
  detectPoseInRealTime(video, net);
}
function WebPose(){
	
	return Wpose;
}
navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
bindPage(); 
