import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch, scrollToId } from "@/lib/home-helpers";
import { EditableStaticText } from "@/components/admin-tools";
import { PosterBannerStrip } from "@/components/sections/poster-strip";
import { ArrowDown, ChevronRight, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canAutoplay, setCanAutoplay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: heroVideoData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_url"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_url"),
  });
  const DEFAULT_VIDEO = "/hero-drone.mp4";
  const [videoSrcOverride, setVideoSrcOverride] = useState<string | null>(null);
  const heroVideoSrc = videoSrcOverride || heroVideoData?.value || DEFAULT_VIDEO;

  const { data: heroSpeedData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_speed"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_speed"),
  });
  const heroSpeed = parseFloat(heroSpeedData?.value || "1");

  const { data: heroLoopData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_loop"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_loop"),
  });
  const heroLoop = heroLoopData?.value !== "false";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = heroSpeed;
  }, [heroSpeed, heroVideoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.loop = heroLoop;
  }, [heroLoop, heroVideoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let retries = 0;
    const MAX_RETRIES = 5;
    const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

    const tryPlay = async () => {
      try {
        const p = v.play();
        if (p) await p;
        setCanAutoplay(true);
        setIsPlaying(true);
      } catch {
        retries++;
        if (retries < MAX_RETRIES) {
          pendingTimeouts.push(setTimeout(tryPlay, 1000));
        } else {
          setCanAutoplay(false);
          setIsPlaying(false);
        }
      }
    };

    const onCanPlay = () => tryPlay();
    const onStalled = () => {
      if (retries < MAX_RETRIES) {
        pendingTimeouts.push(setTimeout(tryPlay, 2000));
      }
    };
    const onError = () => {
      setCanAutoplay(false);
      setIsPlaying(false);
      if (heroVideoSrc !== DEFAULT_VIDEO) {
        setVideoSrcOverride(DEFAULT_VIDEO);
      }
    };

    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("error", onError);

    const sourceEl = v.querySelector("source");
    if (sourceEl) sourceEl.addEventListener("error", onError);

    if (v.readyState >= 3) tryPlay();

    return () => {
      pendingTimeouts.forEach(clearTimeout);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("error", onError);
      if (sourceEl) sourceEl.removeEventListener("error", onError);
    };
  }, [heroVideoSrc]);

  const onPlayClick = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
      setIsPlaying(true);
      setCanAutoplay(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("POST", "/api/upload-video");
        xhr.withCredentials = true;
        xhr.send(fd);
      });
      qc.invalidateQueries({ queryKey: ["admin-setting", "hero_video_url"] });
    } finally {
      setVideoUploading(false);
      setUploadProgress(0);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  };

  const saveVideoSetting = async (key: string, value: string) => {
    await fetch(`/api/admin/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    qc.invalidateQueries({ queryKey: ["admin-setting", key] });
  };

  const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden bg-[hsl(224_32%_7%)]"
      aria-label="Sekcja startowa"
      data-testid="section-hero"
    >
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          key={heroVideoSrc}
          className="h-full w-full object-cover will-change-transform"
          autoPlay
          muted
          loop={heroLoop}
          playsInline
          preload="auto"
          poster="/hero-poster.png"
          data-testid="video-hero"
        >
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-64 sm:px-8 pt-20 md:pt-56">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
          className="noise relative"
        >
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-white/90 glass-dark">
            <span className="text-sm tracking-wide" data-testid="text-hero-pill">
              <EditableStaticText textKey="hero_pill" defaultValue="Wisła Jawornik · jawornik.eu" />
            </span>
          </div>

          <h1
            className="mt-6 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-white sm:text-6xl"
            data-testid="text-hero-title"
          >
            <EditableStaticText textKey="hero_title" defaultValue="Parafia Ewangelicka w Wiśle Jaworniku" />
          </h1>
          <p
            className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-white/85 sm:text-lg"
            data-testid="text-hero-subtitle"
          >
            <EditableStaticText textKey="hero_subtitle" defaultValue="Aktualności, kalendarz wydarzeń, grupy parafialne, nagrania i galeria — wszystko w jednym miejscu." multiline />
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => scrollToId("aktualnosci")}
              data-testid="button-hero-start"
            >
              <EditableStaticText textKey="hero_btn_start" defaultValue="Zobacz aktualności" />
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
              data-testid="button-hero-guesthouse"
            >
              <EditableStaticText textKey="hero_btn_guesthouse" defaultValue="Dom Gościnny" />
            </Button>

            {!canAutoplay && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/15"
                onClick={onPlayClick}
                data-testid="button-hero-play"
              >
                <Play className="mr-2 h-4 w-4" />
                <EditableStaticText textKey="hero_btn_play" defaultValue="Odtwórz" />
              </Button>
            )}

            {canAutoplay && !isPlaying && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/15"
                onClick={onPlayClick}
                data-testid="button-hero-play-fallback"
              >
                <Play className="mr-2 h-4 w-4" />
                <EditableStaticText textKey="hero_btn_play" defaultValue="Odtwórz" />
              </Button>
            )}
          </div>
        </motion.div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => scrollToId("aktualnosci")}
            className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-white/80 transition hover:text-white"
            data-testid="button-scroll"
            aria-label="Przewiń do kolejnej sekcji"
          >
            <span className="text-sm" data-testid="text-scroll"><EditableStaticText textKey="hero_scroll" defaultValue="Przewiń" /></span>
            <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>

      <PosterBannerStrip />

      {isEditMode && (
        <div className="absolute bottom-72 right-6 z-20 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
            <span className="text-white/70">Pętla:</span>
            <button
              onClick={() => saveVideoSetting("hero_video_loop", heroLoop ? "false" : "true")}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${heroLoop ? "bg-green-500/80 text-white" : "bg-white/20 text-white/70 hover:bg-white/30"}`}
              data-testid="button-toggle-loop"
            >
              {heroLoop ? "WŁ" : "WYŁ"}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
            <span className="text-white/70">Prędkość:</span>
            <div className="flex gap-1" data-testid="controls-speed">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => saveVideoSetting("hero_video_speed", String(s))}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${Math.abs(heroSpeed - s) < 0.01 ? "bg-white text-black" : "bg-white/20 text-white/70 hover:bg-white/30"}`}
                  data-testid={`button-speed-${s}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => videoFileRef.current?.click()}
            className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur transition hover:bg-black/90"
            disabled={videoUploading}
            data-testid="button-upload-hero-video"
          >
            <Video className="h-4 w-4" />
            {videoUploading ? `Wysyłanie… ${uploadProgress}%` : "Zmień wideo"}
          </button>
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
            data-testid="input-hero-video"
          />
        </div>
      )}
    </section>
  );
}
