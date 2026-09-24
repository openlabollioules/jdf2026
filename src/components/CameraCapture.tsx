"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { texts } from "@/config/texts";
import type { PublicConfig } from "@/lib/publicConfig";
import { captureFrame, imageUrlToCapture } from "@/lib/client/capture";
import { fitAspect, GUIDE_SCALE, rotatedSize, type Rect, type Size } from "@/lib/client/geometry";
import { sound } from "@/lib/client/sound";
import { PrimaryButton } from "./PrimaryButton";

type CameraState = "starting" | "live" | "denied" | "notFound" | "busy" | "insecure" | "generic";

interface Props {
  config: PublicConfig["camera"];
  /** Présent = écran de prévisualisation figée (le flux reste ouvert pour une reprise rapide). */
  capturedImage?: string;
  onCapture: (image: string) => void;
  onRetake: () => void;
  onConfirm: () => void;
  devTools: boolean;
  onDevImage: (image: string) => void;
}

function errorState(err: unknown): CameraState {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "notFound";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "generic";
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Capture webcam : grande prévisualisation, guide de cadrage, compte à rebours,
 * photo figée, reprise. Le flux est coupé dès que le composant est démonté
 * (validation de la photo, reset, retour arrière). Jamais d'audio.
 */
export function CameraCapture({ config, capturedImage, onCapture, onRetake, onConfirm, devTools, onDevImage }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const [stage, setStage] = useState<Size>({ w: 0, h: 0 });
  const [videoSize, setVideoSize] = useState<Size>({ w: 16, h: 9 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  // --- Ouverture du flux --------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function open() {
      setCamState("starting");
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamState(window.isSecureContext ? "notFound" : "insecure");
        return;
      }
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        };
        let stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Sélection d'une caméra précise par son nom (CAMERA_DEVICE_LABEL), si configuré.
        if (config.deviceLabel) {
          const wanted = config.deviceLabel.toLowerCase();
          const current = stream.getVideoTracks()[0]?.label.toLowerCase() ?? "";
          if (!current.includes(wanted)) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const match = devices.find((d) => d.kind === "videoinput" && d.label.toLowerCase().includes(wanted));
            if (match) {
              stopStream(stream);
              stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { deviceId: { exact: match.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
              });
            }
          }
        }
        if (cancelled) return stopStream(stream);
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
      } catch (err) {
        if (!cancelled) setCamState(errorState(err));
      }
    }
    void open();
    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [attempt, config.deviceLabel]);

  // --- Géométrie : taille de la scène et de la vidéo ------------------------------------
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setStage({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onVideoReady = () => {
    const v = videoRef.current;
    if (v?.videoWidth) {
      setVideoSize({ w: v.videoWidth, h: v.videoHeight });
      setCamState("live");
    }
  };

  const rot = rotatedSize(videoSize, config.rotation);
  const box: Rect = fitAspect(rot.w / rot.h, stage);
  const guide = fitAspect(config.aspect, { w: box.w, h: box.h }, GUIDE_SCALE);
  const sideways = config.rotation === 90 || config.rotation === 270;
  const videoStyle: CSSProperties = {
    width: sideways ? box.h : box.w,
    height: sideways ? box.w : box.h,
    transform: `translate(-50%, -50%) rotate(${config.rotation}deg)${config.mirror ? " scaleX(-1)" : ""}`,
  };

  // --- Capture ---------------------------------------------------------------------------
  const doCapture = useCallback(() => {
    const v = videoRef.current;
    try {
      if (!v) throw new Error("no video");
      const image = captureFrame(v, { rotation: config.rotation, aspect: config.aspect, maxSize: config.maxSize });
      sound().play("shutter");
      setFlash(true);
      window.setTimeout(() => setFlash(false), 350);
      setCaptureError(false);
      onCapture(image);
    } catch {
      setCaptureError(true);
    }
  }, [config.rotation, config.aspect, config.maxSize, onCapture]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      doCapture();
      return;
    }
    sound().play("beep");
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 800);
    return () => window.clearTimeout(t);
  }, [countdown, doCapture]);

  const startCapture = () => {
    if (countdown !== null || camState !== "live") return;
    if (config.countdown > 0) setCountdown(config.countdown);
    else doCapture();
  };

  const loadDevFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      onDevImage(await imageUrlToCapture(url, { aspect: config.aspect, maxSize: config.maxSize }));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const failed = camState !== "starting" && camState !== "live";
  const previewing = !!capturedImage;

  return (
    <section className={`camera${previewing ? " is-preview" : ""}`}>
      <div className="camera-stage" ref={stageRef}>
        <video
          ref={videoRef}
          className="camera-video"
          style={videoStyle}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={onVideoReady}
          onPlaying={onVideoReady}
        />
        {camState === "live" && !previewing && (
          <div
            className="camera-guide"
            style={{ left: box.x + guide.x, top: box.y + guide.y, width: guide.w, height: guide.h }}
            aria-hidden
          >
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <span className="camera-hint">{texts.camera.hint}</span>
          </div>
        )}
        {previewing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="camera-frozen" src={capturedImage} alt="Ta photo" />
        )}
        {countdown !== null && countdown > 0 && (
          <div className="countdown" key={countdown} aria-live="assertive">
            {countdown}
          </div>
        )}
        {flash && <div className="camera-flash" aria-hidden />}
        {camState === "starting" && <p className="camera-status">{texts.camera.starting}</p>}
        {failed && (
          <div className="camera-error" role="alert">
            <span className="camera-error-icon" aria-hidden>📷</span>
            <p>{texts.camera.errors[camState]}</p>
            <PrimaryButton size="lg" onPress={() => setAttempt((a) => a + 1)}>
              {texts.camera.retry}
            </PrimaryButton>
          </div>
        )}
        {captureError && !failed && (
          <p className="camera-status" role="alert">
            {texts.camera.errors.capture}
          </p>
        )}
      </div>

      <div className="camera-actions">
        {previewing ? (
          <>
            <PrimaryButton variant="secondary" size="lg" onPress={onRetake}>
              {texts.camera.retake}
            </PrimaryButton>
            <PrimaryButton size="lg" onPress={onConfirm} className="pulse" cooldownMs={3000}>
              {texts.camera.confirm}
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton onPress={startCapture} disabled={camState !== "live" || countdown !== null}>
            {texts.camera.capture}
          </PrimaryButton>
        )}
        {devTools && !previewing && (
          <label className="dev-file">
            🛠 image locale
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void loadDevFile(e.target.files[0])} />
          </label>
        )}
      </div>
    </section>
  );
}
