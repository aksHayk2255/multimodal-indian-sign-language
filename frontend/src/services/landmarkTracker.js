/**
 * State-of-the-Art Invariant MediaPipe Landmark Tracker.
 * Runs MediaPipe Hands and Pose locally with zero lag and outputs:
 * 1. 189-dimensional biomechanical invariant feature vector:
 *    - Right hand 21 3D joints (wrist-relative, palm-scaled)
 *    - Left hand 21 3D joints (wrist-relative, palm-scaled)
 *    - Finger curl ratios & fingertip spreads for both hands
 *    - Upper body pose joints (shoulder-centered, scale-invariant)
 *    - Spatial hand-to-face and hand-to-shoulder vectors
 *    - Motion velocity dynamics & presence indicators
 * 2. 60 FPS smooth rendering overlay on transparent canvas.
 */

const getHandsClass = () => (typeof window !== 'undefined' ? window.Hands : null);
const getPoseClass = () => (typeof window !== 'undefined' ? window.Pose : null);

export const TOTAL_FEATURE_DIM = 189;
export const SEQUENCE_LENGTH = 30;

class LandmarkTracker {
  constructor() {
    this.handsDetector = null;
    this.poseDetector = null;
    this.isInitialized = false;
    this.isInitializing = false;

    // Latest raw detections
    this.lastPoseLandmarks = null;
    this.lastLeftHandLandmarks = null;
    this.lastRightHandLandmarks = null;

    // Sliding temporal sequence buffer (30 frames x 189 features)
    this.sequenceBuffer = [];

    // Motion velocity tracking (in normalized camera space)
    this.lastRightWrist = null;
    this.lastLeftWrist = null;
    this.rwVelocity = [0, 0, 0];
    this.lwVelocity = [0, 0, 0];
    this.motionEnergy = 0;

    // Processing throttling (~20 FPS)
    this.isProcessing = false;
    this.lastProcessTime = 0;
    this.fpsCount = 0;
    this.lastFpsTimestamp = performance.now();
    this.currentFps = 0;
  }

  async initialize() {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      const Hands = getHandsClass();
      const Pose = getPoseClass();

      // 1. Initialize MediaPipe Hands (Local assets)
      if (Hands) {
        this.handsDetector = new Hands({
          locateFile: (file) => `/mediapipe/hands/${file}`,
        });

        this.handsDetector.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.handsDetector.onResults((results) => {
          this.handleHandsResults(results);
        });
      }

      // 2. Initialize MediaPipe Pose (Local assets)
      if (Pose) {
        this.poseDetector = new Pose({
          locateFile: (file) => `/mediapipe/pose/${file}`,
        });

        this.poseDetector.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.poseDetector.onResults((results) => {
          this.handlePoseResults(results);
        });
      }

      this.isInitialized = true;
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('MediaPipe initialization notice:', err);
      this.isInitialized = true;
      this.isInitializing = false;
      return true;
    }
  }

  handleHandsResults(results) {
    this.lastLeftHandLandmarks = null;
    this.lastRightHandLandmarks = null;

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handedness = results.multiHandedness[i]?.label; // 'Left' or 'Right'
        const landmarks = results.multiHandLandmarks[i];

        // Mirror camera: human perspective
        if (handedness === 'Left') {
          this.lastRightHandLandmarks = landmarks;
        } else {
          this.lastLeftHandLandmarks = landmarks;
        }
      }
    }
  }

  handlePoseResults(results) {
    if (results.poseLandmarks) {
      this.lastPoseLandmarks = results.poseLandmarks;
    }
  }

  /**
   * Process a single video frame:
   * Throttles to ~20 FPS (50ms) for consistent temporal cadence.
   */
  async processFrame(videoElement, canvasElement) {
    if (!videoElement || videoElement.readyState < 2) return null;

    const now = performance.now();

    // Calculate tracking FPS
    this.fpsCount++;
    if (now - this.lastFpsTimestamp >= 1000) {
      this.currentFps = Math.round((this.fpsCount * 1000) / (now - this.lastFpsTimestamp));
      this.fpsCount = 0;
      this.lastFpsTimestamp = now;
    }

    if (now - this.lastProcessTime >= 50 && !this.isProcessing) {
      this.isProcessing = true;
      this.lastProcessTime = now;

      try {
        if (this.poseDetector) {
          await this.poseDetector.send({ image: videoElement });
        }
        if (this.handsDetector) {
          await this.handsDetector.send({ image: videoElement });
        }
      } catch (e) {
        // Non-fatal dropped frame handled silently
      } finally {
        this.isProcessing = false;
      }

      // Extract invariant 189-feature vector
      const featureVector = this.extractFeatureVector();

      this.sequenceBuffer.push(featureVector);
      if (this.sequenceBuffer.length > SEQUENCE_LENGTH) {
        this.sequenceBuffer.shift();
      }
    }

    // Render skeletal lines on transparent canvas
    if (canvasElement) {
      this.drawLandmarksOverlay(canvasElement, videoElement.videoWidth || 640, videoElement.videoHeight || 480);
    }

    const hasHands = !!(this.lastLeftHandLandmarks || this.lastRightHandLandmarks);
    const hasPose = !!this.lastPoseLandmarks;

    return {
      hasPose,
      hasHands,
      leftHandDetected: !!this.lastLeftHandLandmarks,
      rightHandDetected: !!this.lastRightHandLandmarks,
      bufferLength: this.sequenceBuffer.length,
      motionEnergy: this.motionEnergy,
      isSequenceFull: this.sequenceBuffer.length === SEQUENCE_LENGTH,
      currentSequence: this.sequenceBuffer.length === SEQUENCE_LENGTH ? [...this.sequenceBuffer] : null,
      featureVector: this.sequenceBuffer.length > 0 ? this.sequenceBuffer[this.sequenceBuffer.length - 1] : new Array(TOTAL_FEATURE_DIM).fill(0),
      fps: this.currentFps,
    };
  }

  extractFeatureVector() {
    const vector = new Float32Array(TOTAL_FEATURE_DIM);

    const hasRh = !!(this.lastRightHandLandmarks && this.lastRightHandLandmarks.length === 21);
    const hasLh = !!(this.lastLeftHandLandmarks && this.lastLeftHandLandmarks.length === 21);
    const hasPose = !!(this.lastPoseLandmarks && this.lastPoseLandmarks.length >= 17);

    // Default reference centers
    let midX = 0.5, midY = 0.38, shScale = 0.20;
    let nose = [0.5, 0.22, 0];
    let lSh = [0.6, 0.38, 0];
    let rSh = [0.4, 0.38, 0];
    let lW = [0.65, 0.70, 0];
    let rW = [0.35, 0.70, 0];

    // Helper 2D dist
    const dist2D = (p1, p2) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);

    // 1. Pose landmarks
    if (hasPose) {
      const getPt = (idx) => {
        const pt = this.lastPoseLandmarks[idx];
        return [1.0 - pt.x, pt.y, pt.z || 0];
      };

      nose = getPt(0);
      lSh = getPt(11);
      rSh = getPt(12);
      lW = getPt(15);
      rW = getPt(16);

      midX = (lSh[0] + rSh[0]) / 2.0;
      midY = (lSh[1] + rSh[1]) / 2.0;
      shScale = Math.max(Math.hypot(lSh[0] - rSh[0], lSh[1] - rSh[1]), 0.08);

      const keyIndices = [0, 11, 12, 13, 14, 15, 16];
      keyIndices.forEach((kIdx, orderIdx) => {
        const pt = getPt(kIdx);
        vector[144 + orderIdx * 3] = (pt[0] - midX) / shScale;
        vector[144 + orderIdx * 3 + 1] = (pt[1] - midY) / shScale;
        vector[144 + orderIdx * 3 + 2] = pt[2] / shScale;
      });
    }

    // 2. Right Hand Joints (0..62) & Finger states (126..134)
    if (hasRh) {
      const rhPts = this.lastRightHandLandmarks.map((pt) => [1.0 - pt.x, pt.y, pt.z || 0]);
      const w = rhPts[0];
      const mcp = rhPts[9];
      const palmLen = Math.max(Math.hypot(w[0] - mcp[0], w[1] - mcp[1]), 0.03);

      for (let i = 0; i < 21; i++) {
        vector[i * 3] = (rhPts[i][0] - w[0]) / palmLen;
        vector[i * 3 + 1] = (rhPts[i][1] - w[1]) / palmLen;
        vector[i * 3 + 2] = (rhPts[i][2] - w[2]) / palmLen;
      }

      const tTip = rhPts[4], iTip = rhPts[8], mTip = rhPts[12], rTip = rhPts[16], pTip = rhPts[20], iMcp = rhPts[5];
      vector[126] = dist2D(tTip, iMcp) / palmLen;
      vector[127] = dist2D(iTip, w) / palmLen;
      vector[128] = dist2D(mTip, w) / palmLen;
      vector[129] = dist2D(rTip, w) / palmLen;
      vector[130] = dist2D(pTip, w) / palmLen;
      vector[131] = dist2D(tTip, iTip) / palmLen;
      vector[132] = dist2D(iTip, mTip) / palmLen;
      vector[133] = dist2D(mTip, rTip) / palmLen;
      vector[134] = dist2D(rTip, pTip) / palmLen;

      rW = w;
    }

    // 3. Left Hand Joints (63..125) & Finger states (135..143)
    if (hasLh) {
      const lhPts = this.lastLeftHandLandmarks.map((pt) => [1.0 - pt.x, pt.y, pt.z || 0]);
      const w = lhPts[0];
      const mcp = lhPts[9];
      const palmLen = Math.max(Math.hypot(w[0] - mcp[0], w[1] - mcp[1]), 0.03);

      for (let i = 0; i < 21; i++) {
        vector[63 + i * 3] = (lhPts[i][0] - w[0]) / palmLen;
        vector[63 + i * 3 + 1] = (lhPts[i][1] - w[1]) / palmLen;
        vector[63 + i * 3 + 2] = (lhPts[i][2] - w[2]) / palmLen;
      }

      const tTip = lhPts[4], iTip = lhPts[8], mTip = lhPts[12], rTip = lhPts[16], pTip = lhPts[20], iMcp = lhPts[5];
      vector[135] = dist2D(tTip, iMcp) / palmLen;
      vector[136] = dist2D(iTip, w) / palmLen;
      vector[137] = dist2D(mTip, w) / palmLen;
      vector[138] = dist2D(rTip, w) / palmLen;
      vector[139] = dist2D(pTip, w) / palmLen;
      vector[140] = dist2D(tTip, iTip) / palmLen;
      vector[141] = dist2D(iTip, mTip) / palmLen;
      vector[142] = dist2D(mTip, rTip) / palmLen;
      vector[143] = dist2D(rTip, pTip) / palmLen;

      lW = w;
    }

    // 4. Spatial Relationships (165..177)
    vector[165] = (rW[0] - nose[0]) / shScale;
    vector[166] = (rW[1] - nose[1]) / shScale;
    vector[167] = (rW[2] - nose[2]) / shScale;

    vector[168] = (lW[0] - nose[0]) / shScale;
    vector[169] = (lW[1] - nose[1]) / shScale;
    vector[170] = (lW[2] - nose[2]) / shScale;

    vector[171] = (rW[0] - rSh[0]) / shScale;
    vector[172] = (rW[1] - rSh[1]) / shScale;
    vector[173] = (rW[2] - rSh[2]) / shScale;

    vector[174] = (lW[0] - lSh[0]) / shScale;
    vector[175] = (lW[1] - lSh[1]) / shScale;
    vector[176] = (lW[2] - lSh[2]) / shScale;

    vector[177] = dist2D(lW, rW) / shScale;

    // 5. Motion Velocity Dynamics (178..185)
    let rwVel = [0, 0, 0];
    let lwVel = [0, 0, 0];
    if (this.lastRightWrist) {
      rwVel = [
        (rW[0] - this.lastRightWrist[0]) / shScale,
        (rW[1] - this.lastRightWrist[1]) / shScale,
        (rW[2] - this.lastRightWrist[2]) / shScale,
      ];
    }
    if (this.lastLeftWrist) {
      lwVel = [
        (lW[0] - this.lastLeftWrist[0]) / shScale,
        (lW[1] - this.lastLeftWrist[1]) / shScale,
        (lW[2] - this.lastLeftWrist[2]) / shScale,
      ];
    }
    this.lastRightWrist = rW;
    this.lastLeftWrist = lW;

    vector[178] = rwVel[0];
    vector[179] = rwVel[1];
    vector[180] = rwVel[2];
    vector[181] = lwVel[0];
    vector[182] = lwVel[1];
    vector[183] = lwVel[2];
    vector[184] = Math.hypot(rwVel[0], rwVel[1]);
    vector[185] = Math.hypot(lwVel[0], lwVel[1]);

    this.motionEnergy = this.motionEnergy * 0.7 + (vector[184] + vector[185]) * 0.3;

    // 6. Presence Flags (186..188)
    vector[186] = hasRh ? 1.0 : 0.0;
    vector[187] = hasLh ? 1.0 : 0.0;
    vector[188] = (hasRh && hasLh) ? 1.0 : 0.0;

    return Array.from(vector);
  }

  drawLandmarksOverlay(canvas, width, height) {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Pose Skeleton (Shoulders, Arms, Elbows, Wrists)
    if (this.lastPoseLandmarks) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = '#60a5fa';

      this.drawConnection(ctx, this.lastPoseLandmarks[11], this.lastPoseLandmarks[12], width, height);
      this.drawConnection(ctx, this.lastPoseLandmarks[11], this.lastPoseLandmarks[13], width, height);
      this.drawConnection(ctx, this.lastPoseLandmarks[13], this.lastPoseLandmarks[15], width, height);
      this.drawConnection(ctx, this.lastPoseLandmarks[12], this.lastPoseLandmarks[14], width, height);
      this.drawConnection(ctx, this.lastPoseLandmarks[14], this.lastPoseLandmarks[16], width, height);

      [0, 11, 12, 13, 14, 15, 16].forEach((idx) => {
        const pt = this.lastPoseLandmarks[idx];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // 2. Draw Hand Joints and Finger Connections
    const drawHand = (hand, strokeColor, fillColor) => {
      if (!hand) return;
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;

      const fingers = [
        [0, 1, 2, 3, 4],
        [0, 5, 6, 7, 8],
        [0, 9, 10, 11, 12],
        [0, 13, 14, 15, 16],
        [0, 17, 18, 19, 20],
        [5, 9, 13, 17, 0],
      ];

      fingers.forEach((chain) => {
        for (let i = 0; i < chain.length - 1; i++) {
          this.drawConnection(ctx, hand[chain[i]], hand[chain[i + 1]], width, height);
        }
      });

      hand.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    if (this.lastRightHandLandmarks) {
      drawHand(this.lastRightHandLandmarks, '#10b981', '#34d399');
    }

    if (this.lastLeftHandLandmarks) {
      drawHand(this.lastLeftHandLandmarks, '#f59e0b', '#fbbf24');
    }
  }

  drawConnection(ctx, pt1, pt2, width, height) {
    if (!pt1 || !pt2) return;
    ctx.beginPath();
    ctx.moveTo(pt1.x * width, pt1.y * height);
    ctx.lineTo(pt2.x * width, pt2.y * height);
    ctx.stroke();
  }

  clearBuffer() {
    this.sequenceBuffer = [];
    this.motionEnergy = 0;
  }
}

export const landmarkTracker = new LandmarkTracker();
export default landmarkTracker;
