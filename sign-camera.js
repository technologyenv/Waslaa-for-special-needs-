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

let stream = null;
let handLandmarker = null;
let animationFrame = null;
let lastVideoTime = -1;

async function loadHandModel() {
  cameraStatus.textContent = "جاري تحميل نموذج اليد...";

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
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("CAMERA_NOT_SUPPORTED");
    }

    startCameraBtn.disabled = true;
    cameraStatus.textContent = "جاري فتح الكاميرا...";

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    signVideo.srcObject = stream;
    signVideo.muted = true;
    signVideo.playsInline = true;

    await signVideo.play();

    cameraPlaceholder.classList.add("hidden");
    cameraStatus.textContent = "الكاميرا تعمل";
    trackingStatus.textContent = "جاري البحث عن اليد";
    cameraBadge.classList.add("active");

    signCanvas.width = signVideo.videoWidth || 640;
    signCanvas.height = signVideo.videoHeight || 480;

    if (!handLandmarker) {
      await loadHandModel();
    }

    cameraStatus.textContent = "الكاميرا تعمل";
    detectHands();

  } catch (error) {
    console.error(error);

    startCameraBtn.disabled = false;
    cameraStatus.textContent = "الكاميرا لم تعمل";

    if (error.name === "NotAllowedError") {
      trackingStatus.textContent = "تم رفض إذن الكاميرا";
      alert("افتحي إعدادات Chrome واسمحي للموقع باستخدام الكاميرا.");
    } else if (error.name === "NotFoundError") {
      trackingStatus.textContent = "لم يتم العثور على كاميرا";
      alert("المتصفح لم يجد كاميرا متاحة.");
    } else if (error.message === "CAMERA_NOT_SUPPORTED") {
      trackingStatus.textContent = "الرابط غير آمن";
      alert("افتحي الموقع من رابط GitHub Pages يبدأ بـ https.");
    } else {
      trackingStatus.textContent = "حدث خطأ";
      alert("حدث خطأ. افتحي Console أو ابعتي صورة الرسالة.");
    }
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  signVideo.srcObject = null;

  const context = signCanvas.getContext("2d");
  context.clearRect(0, 0, signCanvas.width, signCanvas.height);

  cameraPlaceholder.classList.remove("hidden");
  cameraStatus.textContent = "الكاميرا متوقفة";
  trackingStatus.textContent = "لم يبدأ التتبع";
  cameraBadge.classList.remove("active");
  startCameraBtn.disabled = false;
}

function detectHands() {
  if (!handLandmarker || !stream || signVideo.readyState < 2) {
    animationFrame = requestAnimationFrame(detectHands);
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

  animationFrame = requestAnimationFrame(detectHands);
}

function drawHands(results) {
  const context = signCanvas.getContext("2d");

  context.clearRect(0, 0, signCanvas.width, signCanvas.height);

  if (!results.landmarks || results.landmarks.length === 0) {
    trackingStatus.textContent = "حرّكي يدك أمام الكاميرا";
    return;
  }

  trackingStatus.textContent =
    `تم العثور على ${results.landmarks.length} يد`;

  const drawingUtils = new DrawingUtils(context);

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

startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", stopCamera);

window.addEventListener("beforeunload", stopCamera);
