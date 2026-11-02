import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22";

const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const signVideo = document.getElementById("signVideo");
const signCanvas = document.getElementById("signCanvas");
const cameraStatus = document.getElementById("cameraStatus");
const trackingStatus = document.getElementById("trackingStatus");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraBadge = document.querySelector(".camera-badge");

let cameraStream = null;
let handLandmarker = null;
let animationId = null;
let lastVideoTime = -1;

async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.65
  });
}

async function startCamera() {
  try {
    startCameraBtn.disabled = true;
    cameraStatus.textContent = "جاري تجهيز الكاميرا...";

    if (!handLandmarker) {
      await createHandLandmarker();
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    });

    signVideo.srcObject = cameraStream;
    await signVideo.play();

    cameraPlaceholder.classList.add("hidden");
    cameraStatus.textContent = "الكاميرا تعمل";
    trackingStatus.textContent = "جاري تتبع اليد";
    cameraBadge.classList.add("active");

    resizeCanvas();
    predictHands();

    if (navigator.vibrate) {
      navigator.vibrate(70);
    }
  } catch (error) {
    console.error(error);

    cameraStatus.textContent = "تعذر تشغيل الكاميرا";
    trackingStatus.textContent = "تحققي من الإذن";
    startCameraBtn.disabled = false;

    alert(
      "اسمحي للموقع باستخدام الكاميرا، وتأكدي أنكِ تفتحينه من رابط GitHub Pages يبدأ بـ https."
    );
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  signVideo.srcObject = null;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  const context = signCanvas.getContext("2d");
  context.clearRect(0, 0, signCanvas.width, signCanvas.height);

  cameraPlaceholder.classList.remove("hidden");
  cameraStatus.textContent = "الكاميرا متوقفة";
  trackingStatus.textContent = "لم يبدأ التتبع";
  cameraBadge.classList.remove("active");
  startCameraBtn.disabled = false;
}

function resizeCanvas() {
  signCanvas.width = signVideo.videoWidth || 640;
  signCanvas.height = signVideo.videoHeight || 480;
}

function predictHands() {
  if (!handLandmarker || signVideo.readyState < 2) {
    animationId = requestAnimationFrame(predictHands);
    return;
  }

  if (signVideo.currentTime !== lastVideoTime) {
    lastVideoTime = signVideo.currentTime;

    const results = handLandmarker.detectForVideo(
      signVideo,
      performance.now()
    );

    drawHands(results);
  }

  animationId = requestAnimationFrame(predictHands);
}

function drawHands(results) {
  const context = signCanvas.getContext("2d");

  context.clearRect(0, 0, signCanvas.width, signCanvas.height);

  const drawingUtils = new DrawingUtils(context);

  if (!results.landmarks || results.landmarks.length === 0) {
    trackingStatus.textContent = "لم يتم العثور على يد";
    return;
  }

  trackingStatus.textContent = `تم العثور على ${results.landmarks.length} يد`;

  for (const landmarks of results.landmarks) {
    drawingUtils.drawConnectors(
      landmarks,
      HandLandmarker.HAND_CONNECTIONS,
      {
        color: "#8fa3ff",
        lineWidth: 3
      }
    );

    drawingUtils.drawLandmarks(landmarks, {
      color: "#ffffff",
      fillColor: "#4968e8",
      lineWidth: 1,
      radius: 4
    });
  }
}

window.addEventListener("resize", resizeCanvas);

startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", stopCamera);

window.addEventListener("beforeunload", stopCamera);
