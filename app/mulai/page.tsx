"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import Link from "next/link";

const CONFIG = {
    timestamps: [1.5, 8.5, 14.0],
    duration: 15,
    mp3File: "/lagu.mp3",
};

// Cover Styles - 4 style photobooth dengan label baru
const COVER_STYLES = {
    floral: {
        id: "floral",
        label: "",
        icon: "🌸",
        theme: "Soft",
        background: "style-floral",
        accentColor: "#8f4d62",
    },
    retro: {
        id: "retro",
        label: "",
        icon: "📷",
        theme: "Retro",
        background: "style-retro",
        accentColor: "#252525",
    },
    candy: {
        id: "candy",
        label: "",
        icon: "🍬",
        theme: "Cute",
        background: "style-candy",
        accentColor: "#7f5a94",
    },
    midnight: {
        id: "midnight",
        label: "",
        icon: "🌙",
        theme: "Night",
        background: "style-midnight",
        accentColor: "#ffffff",
    },
};

// Filter presets dengan label baru
const FILTERS = {
    normal: { label: "Apa Adanya", css: "none" },
    warm: { label: "Hangat", css: "sepia(.18) saturate(1.18) contrast(1.02) brightness(1.02)" },
    cool: { label: "Dingin Dikit", css: "saturate(.88) hue-rotate(8deg) contrast(1.04) brightness(1.02)" },
    vintage: { label: "Jadul", css: "sepia(.48) saturate(.82) contrast(.94) brightness(.98)" },
};

// Frame colors
const FRAME_COLORS = [
    { color: "#ffffff", name: "White" },
    { color: "#171717", name: "Black" },
    { color: "#f3c6d3", name: "Blush" },
    { color: "#d9b8a7", name: "Latte" },
    { color: "#e7c76b", name: "Champagne" },
    { color: "#b7a5e6", name: "Lavender" },
    { color: "#9fc7d9", name: "Sky" },
    { color: "#9cc9b0", name: "Sage" },
];

// Caption presets per style
const CAPTION_PRESETS = {
    floral: ["Our Little Moments", "Beautiful Memories", "Bloom Together", "Made With Love", "Sweet Little Things"],
    retro: ["GOOD TIMES", "Keep The Moment", "Photo Booth", "Best Day Ever", "Made To Remember"],
    candy: ["SWEET MOMENTS", "Best Day", "Cutie Energy", "Too Cute", "Just Us"],
    midnight: ["TONIGHT WAS SPECIAL", "After Dark", "One Night Only", "Midnight Memories", "Stay Up Forever"],
};

export default function MulaiPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [blurActive, setBlurActive] = useState(false);
    const [flashActive, setFlashActive] = useState(false);
    const [completedPhotos, setCompletedPhotos] = useState<number[]>([]);

    const [isJogetMode, setIsJogetMode] = useState(true);

    // Editor states
    const [showEditor, setShowEditor] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [selectedLayout, setSelectedLayout] = useState<"classic-strip" | "lshape" | "polaroid" | "editorial">("classic-strip");
    const [selectedCoverStyle, setSelectedCoverStyle] = useState<keyof typeof COVER_STYLES>("floral");
    const [selectedFilter, setSelectedFilter] = useState<keyof typeof FILTERS>("warm");
    const [selectedFrameColor, setSelectedFrameColor] = useState<string>("#ffffff");
    const [caption, setCaption] = useState("Our Little Moments");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const capturedRef = useRef<{ [key: number]: boolean }>({});

    const capturePhoto = (timestamp: number) => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhotos((prev) => [...prev, dataUrl]);
        console.log(`📸 Foto pada ${timestamp.toFixed(1)}s`);
    };

    const startRecording = async () => {
        if (isRecording) return;

        setPhotos([]);
        setProgress(0);
        setCompletedPhotos([]);
        capturedRef.current = {};
        setShowEditor(false);
        setProcessing(false);
        setIsJogetMode(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsCameraReady(true);
            }

            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
            }

            setIsRecording(true);

            const startTime = performance.now();

            const loop = (now: number) => {
                const elapsed = (now - startTime) / 1000;
                const progressPercent = Math.min(100, (elapsed / CONFIG.duration) * 100);
                setProgress(progressPercent);

                CONFIG.timestamps.forEach((t) => {
                    if (!capturedRef.current[t] && elapsed >= t) {
                        capturedRef.current[t] = true;
                        capturePhoto(t);

                        setIsJogetMode(false);
                        setBlurActive(true);
                        setFlashActive(true);

                        setTimeout(() => setFlashActive(false), 200);

                        setTimeout(() => {
                            setBlurActive(false);
                            const photoNumber = CONFIG.timestamps.indexOf(t) + 1;
                            setCompletedPhotos((prev) => {
                                if (prev.includes(photoNumber)) return prev;
                                return [...prev, photoNumber];
                            });
                            setIsJogetMode(true);
                        }, 500);
                    }
                });

                if (elapsed >= CONFIG.duration) {
                    setIsRecording(false);
                    if (audioRef.current) audioRef.current.pause();
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach((track) => track.stop());
                    }

                    setProcessing(true);
                    setTimeout(() => {
                        setProcessing(false);
                        setShowEditor(true);
                    }, 1500);

                    return;
                }

                animationRef.current = requestAnimationFrame(loop);
            };

            animationRef.current = requestAnimationFrame(loop);
        } catch (err) {
            alert("Gagal akses kamera: " + err);
            setIsRecording(false);
        }
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Blur canvas
    useEffect(() => {
        if (blurActive && videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.filter = "blur(20px)";
            ctx.drawImage(video, 0, 0);
            canvas.style.display = "block";
        } else if (canvasRef.current) {
            canvasRef.current.style.display = "none";
        }
    }, [blurActive]);

    // Render Photo Strip
    const renderPhotoStrip = () => {
        const style = COVER_STYLES[selectedCoverStyle];
        const filter = FILTERS[selectedFilter];
        const currentYear = new Date().getFullYear();
        const currentCaption = caption || "Your Moment";

        if (photos.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center text-[#777] text-[22px]">
                    Hasil Foto
                </div>
            );
        }

        const photoElements = photos.slice(0, 3).map((dataUrl, index) => (
            `<div class="photo-area">
                <img class="photo" src="${dataUrl}" alt="Foto ${index + 1}" />
            </div>`
        )).join("");

        let html = "";

        if (selectedLayout === "classic-strip") {
            let header = "";
            let footer = "";
            let decorations = "";

            if (selectedCoverStyle === "floral") {
                header = `<div class="floral-top">✦ ${currentCaption} ✦</div>`;
                footer = `
                    <div class="floral-bottom">
                        <div class="main">${currentCaption}</div>
                        <div class="small">FOTO KITA BLUR • ${currentYear}</div>
                    </div>
                `;
                decorations = `<div class="flower one"></div><div class="flower two"></div>`;
            } else if (selectedCoverStyle === "retro") {
                header = `<div class="retro-header"><span>PHOTO BOOTH</span><span>NO. 003</span></div>`;
                footer = `
                    <div class="retro-footer">
                        <div class="title">${currentCaption}</div>
                        <div class="sub">KEEP THE MOMENT</div>
                    </div>
                `;
            } else if (selectedCoverStyle === "candy") {
                header = `<div class="candy-header">✦ ${currentCaption} ✦</div>`;
                footer = `
                    <div class="candy-footer">
                        <div class="title">${currentCaption}</div>
                        <div class="sub">MADE WITH LOVE</div>
                    </div>
                `;
                decorations = `<span class="sparkle one">✦</span><span class="sparkle two">✦</span>`;
            } else if (selectedCoverStyle === "midnight") {
                header = `<div class="midnight-header">${currentCaption}</div>`;
                footer = `
                    <div class="midnight-footer">
                        <div class="title">${currentCaption}</div>
                        <div class="sub">FOTO KITA BLUR</div>
                    </div>
                `;
                decorations = `<span class="star s1"></span><span class="star s2"></span><span class="star s3"></span><span class="star s4"></span>`;
            }

            html = `
                ${header}
                ${decorations}
                ${photoElements}
                ${footer}
            `;
        } else if (selectedLayout === "lshape") {
            html = `
                <div class="photo-area">
                    <img class="photo" src="${photos[0]}" alt="Foto 1" />
                </div>
                <div class="photo-right-column">
                    <div class="photo-area">
                        <img class="photo" src="${photos[1]}" alt="Foto 2" />
                    </div>
                    <div class="photo-area">
                        <img class="photo" src="${photos[2]}" alt="Foto 3" />
                    </div>
                </div>
                <div class="booth-caption">${currentCaption}</div>
            `;
        } else if (selectedLayout === "polaroid") {
            html = `
                ${photoElements}
                <div class="booth-caption">${currentCaption}</div>
            `;
        } else if (selectedLayout === "editorial") {
            html = `
                <div class="photo-area">
                    <img class="photo" src="${photos[0]}" alt="Foto 1" />
                </div>
                <div class="photo-bottom-row">
                    <div class="photo-area">
                        <img class="photo" src="${photos[1]}" alt="Foto 2" />
                    </div>
                    <div class="photo-area">
                        <img class="photo" src="${photos[2]}" alt="Foto 3" />
                    </div>
                </div>
                <div class="booth-caption">${currentCaption}</div>
            `;
        }

        const stripClasses = `photo-strip style-${selectedCoverStyle} layout-${selectedLayout}`;

        return (
            <div
                id="photoStrip"
                className={stripClasses}
                style={{
                    "--frame-color": selectedFrameColor,
                    "--accent-color": style.accentColor,
                    "--photo-filter": filter.css,
                } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    };

    // Handle Download
    const handleDownload = () => {
        const stripElement = document.getElementById("photoStrip");

        if (!stripElement) {
            alert("Tidak ada foto untuk di-download.");
            return;
        }

        const script = document.createElement("script");
        script.src =
            "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

        script.onload = async () => {
            // @ts-ignore
            const html2canvas = window.html2canvas;

            if (!html2canvas) {
                alert("Gagal memuat library download. Silakan coba lagi.");
                return;
            }

            try {
                const clone = stripElement.cloneNode(true) as HTMLElement;
                clone.id = "photoStripDownload";

                const originalImages = Array.from(
                    stripElement.querySelectorAll("img.photo")
                );
                const clonedImages = Array.from(
                    clone.querySelectorAll("img.photo")
                );
                const filterCss = FILTERS[selectedFilter].css;

                for (let i = 0; i < originalImages.length; i++) {
                    const originalImg = originalImages[i] as HTMLImageElement;
                    const clonedImg = clonedImages[i] as HTMLImageElement;

                    if (!originalImg || !clonedImg) continue;

                    const naturalWidth = originalImg.naturalWidth;
                    const naturalHeight = originalImg.naturalHeight;

                    if (!naturalWidth || !naturalHeight) continue;

                    const canvas = document.createElement("canvas");
                    canvas.width = naturalWidth;
                    canvas.height = naturalHeight;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) continue;

                    ctx.filter = filterCss;
                    ctx.drawImage(originalImg, 0, 0, naturalWidth, naturalHeight);

                    const filteredData = canvas.toDataURL("image/png");
                    clonedImg.src = filteredData;

                    clonedImg.style.width = "100%";
                    clonedImg.style.height = "auto";
                    clonedImg.style.aspectRatio = `${naturalWidth} / ${naturalHeight}`;
                    clonedImg.style.objectFit = "cover";
                    clonedImg.style.display = "block";
                    clonedImg.style.filter = "none";
                }

                clone.style.position = "fixed";
                clone.style.left = "-100000px";
                clone.style.top = "0";
                clone.style.transform = "none";
                clone.style.animation = "none";
                clone.style.transition = "none";

                document.body.appendChild(clone);

                const downloadImages = Array.from(
                    clone.querySelectorAll("img.photo")
                ) as HTMLImageElement[];

                await Promise.all(
                    downloadImages.map(async (img) => {
                        try {
                            await img.decode();
                        } catch {
                            await new Promise((resolve) => {
                                img.onload = () => resolve(null);
                                img.onerror = () => resolve(null);
                            });
                        }
                    })
                );

                const canvas = await html2canvas(clone, {
                    scale: 3,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: null,
                    logging: false,
                    width: clone.scrollWidth,
                    height: clone.scrollHeight,
                    imageTimeout: 15000,
                    ignoreElements: (element: HTMLElement) => {
                        return element.id === "photoStrip";
                    },
                });

                document.body.removeChild(clone);

                const link = document.createElement("a");
                link.download =
                    `photobooth_${selectedCoverStyle}_${selectedLayout}_${selectedFilter}.png`;
                link.href = canvas.toDataURL("image/png", 1.0);
                link.click();

            } catch (err) {
                console.error("Error capturing:", err);
                const clone = document.getElementById("photoStripDownload");
                if (clone) {
                    clone.remove();
                }
                alert("Gagal mendownload foto. Silakan coba lagi.");
            }
        };

        script.onerror = () => {
            alert(
                "Gagal memuat library download. Periksa koneksi internet Anda."
            );
        };

        document.body.appendChild(script);
    };

    return (
        <main className="min-h-screen bg-[#f7f3f0] py-6">
            <div
                className={`
                    transition-all duration-700 ease-out
                    ${showEditor ? "max-w-[1320px] mx-auto px-6" : "max-w-[1100px] mx-auto px-6"}
                `}
            >
                <div className="w-full">
                    {/* HEADER EDITOR - MODE 2 */}
                    {showEditor && (
                        <div className="editor-topbar">
                            <div className="editor-brand">
                                <div className="editor-brand-mark">✦</div>
                                <div>
                                    <div className="editor-brand-name">
                                        Foto Kita
                                    </div>
                                    <div className="editor-brand-sub">
                                        tiga foto, satu cerita kecil 🤍
                                    </div>
                                </div>
                            </div>

                            <div className="editor-actions">
                                <button
                                    onClick={() => {
                                        setShowEditor(false);
                                        setIsRecording(false);
                                        setPhotos([]);
                                        setCompletedPhotos([]);
                                        setIsCameraReady(false);
                                        setProgress(0);
                                        if (streamRef.current) {
                                            streamRef.current.getTracks().forEach((track) => track.stop());
                                        }
                                    }}
                                    className="editor-btn editor-btn-soft"
                                >
                                    ↩ Foto Lagi
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="editor-btn editor-btn-main"
                                >
                                    Download 
                                </button>
                            </div>
                        </div>
                    )}

                    {showEditor ? (
                        // =====================================================
                        // MODE 2: EDITOR
                        // =====================================================
                        <div className="editor">
                            <div className="preview-section">
                                <div className="preview-area">
                                    <div className="editor-welcome">
                                        <div>
                                            <div className="editor-eyebrow">
                                                YOUR LITTLE MOMENT ✦
                                            </div>
                                            <h1>
                                                Tiga foto.<br />
                                                Satu cerita kecil. 🤍
                                            </h1>
                                            <p>
                                                Pilih yang paling kamu suka.
                                                Nggak perlu sempurna, yang penting kamu.
                                            </p>
                                        </div>
                                        <div className="preview-badge">
                                            ✦ hasil foto kamu
                                        </div>
                                    </div>
                                    <div className="preview-main">
                                        {renderPhotoStrip()}
                                    </div>
                                </div>

                                <div className="bottom-tools">
                                    <div className="frame-box">
                                        <h6>🎀 Pilih bingkainya</h6>
                                        <div className="color-list">
                                            {FRAME_COLORS.map(({ color, name }) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedFrameColor(color)}
                                                    className={`color ${selectedFrameColor === color ? "active" : ""}`}
                                                    style={{
                                                        background: color,
                                                        border: color === "#ffffff" ? "1px solid #ddd" : "2px solid transparent"
                                                    }}
                                                    data-name={name}
                                                >
                                                    <span className="sr-only">{name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="caption-box">
                                        <h6>💌 Kasih sedikit cerita</h6>
                                        <textarea
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="misalnya: hari ini lucu banget..."
                                            maxLength={80}
                                        />
                                        <div className="caption-presets">
                                            {CAPTION_PRESETS[selectedCoverStyle as keyof typeof CAPTION_PRESETS].map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => setCaption(preset)}
                                                    className={`caption-preset ${caption === preset ? "active" : ""}`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar">
                                {/* Layout */}
                                <div className="side-card">
                                    <h5>
                                        <span>🖼️</span>
                                        Susunan Foto
                                    </h5>
                                    <p className="side-hint">
                                        Mau fotonya ngobrol seperti apa?
                                    </p>
                                    <div className="option-grid">
                                        {[
                                            { key: "classic-strip", label: "Rapi & klasik" },
                                            { key: "lshape", label: "Samping-samping" },
                                            { key: "polaroid", label: "Kayak dulu" },
                                            { key: "editorial", label: "Agak artsy" },
                                        ].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedLayout(key as "classic-strip" | "lshape" | "polaroid" | "editorial")}
                                                className={`layout-option ${selectedLayout === key ? "active" : ""}`}
                                            >
                                                <div className={`mini-layout ${key}-preview`}>
                                                    {key === "classic-strip" && (
                                                        <>
                                                            <div className="mini-photo-box">1</div>
                                                            <div className="mini-photo-box">2</div>
                                                            <div className="mini-photo-box">3</div>
                                                        </>
                                                    )}
                                                    {key === "lshape" && (
                                                        <>
                                                            <div className="mini-photo-box" style={{ flex: 2 }}>1</div>
                                                            <div className="mini-right-col">
                                                                <div className="mini-photo-box">2</div>
                                                                <div className="mini-photo-box">3</div>
                                                            </div>
                                                        </>
                                                    )}
                                                    {key === "polaroid" && (
                                                        <>
                                                            <div className="mini-photo-box" style={{ transform: 'rotate(-4deg)', marginBottom: '-4px' }}>
                                                                <div className="mini-photo-box-inner">1</div>
                                                            </div>
                                                            <div className="mini-photo-box" style={{ transform: 'rotate(2deg)', marginBottom: '-4px' }}>
                                                                <div className="mini-photo-box-inner">2</div>
                                                            </div>
                                                            <div className="mini-photo-box" style={{ transform: 'rotate(-3deg)' }}>
                                                                <div className="mini-photo-box-inner">3</div>
                                                            </div>
                                                        </>
                                                    )}
                                                    {key === "editorial" && (
                                                        <>
                                                            <div className="mini-photo-box" style={{ flex: 2 }}>1</div>
                                                            <div className="mini-bottom-row">
                                                                <div className="mini-photo-box">2</div>
                                                                <div className="mini-photo-box">3</div>
                                                            </div>
                                                            <div className="mini-text-bar"></div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="option-label">{label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cover Style */}
                                <div className="side-card">
                                    <h5>
                                        <span>🌷</span>
                                        Pilih Suasana
                                    </h5>
                                    <p className="side-hint">
                                        Sesuaikan sama mood kamu hari ini.
                                    </p>
                                    <div className="option-grid">
                                        {Object.entries(COVER_STYLES).map(([key, style]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSelectedCoverStyle(key as keyof typeof COVER_STYLES);
                                                }}
                                                className={`cover-option ${selectedCoverStyle === key ? "active" : ""}`}
                                            >
                                                <div className={`mini-strip mini-${key}`}>
                                                    <div className="mini-title">{style.label}</div>
                                                </div>
                                                <div className="option-label">{style.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Filter */}
                                <div className="side-card">
                                    <h5>
                                        <span>✨</span>
                                        Bikin Mood
                                    </h5>
                                    <p className="side-hint">
                                        Sedikit warna biar makin terasa.
                                    </p>
                                    <div className="option-grid">
                                        {Object.entries(FILTERS).map(([key, filter]) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedFilter(key as keyof typeof FILTERS)}
                                                className={`filter-option ${selectedFilter === key ? "active" : ""}`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // =====================================================
                        // MODE 1: RECORDING
                        // =====================================================
                        <>
                            <section className="recording-page">

                                <div className="mood-row">
                                    <div>
                                        <div className="mood-title">
                                            ✦ Foto Kita
                                        </div>
                                        <div className="mood-subtitle">
                                            jangan terlalu serius, nanti malah bagus 😚
                                        </div>
                                    </div>
                                    <div className="mood-buttons">
                                        <button
                                            disabled
                                            className={`mood-button ${isJogetMode ? "active" : ""}`}
                                        >
                                            <span>🪩</span>
                                            Joget dikit
                                        </button>
                                        <button
                                            disabled
                                            className={`mood-button ${!isJogetMode ? "active" : ""}`}
                                        >
                                            <span>🫶</span>
                                            Bergaya
                                        </button>
                                    </div>
                                </div>

                                <div className="camera-card">
                                    <div className="camera-frame">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted={false}
                                            className="camera-video"
                                            style={{ transform: "scaleX(-1)" }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute top-0 left-0 w-full h-full object-cover"
                                            style={{ display: "none", transform: "scaleX(-1)" }}
                                        />
                                        {flashActive && (
                                            <div className="camera-flash" />
                                        )}

                                        <div className="photo-counter">
                                            {[1, 2, 3].map((number) => {
                                                const isCompleted = completedPhotos.includes(number);
                                                return (
                                                    <div
                                                        key={number}
                                                        className={`photo-counter-item ${isCompleted ? "done" : ""}`}
                                                    >
                                                        {isCompleted ? "✓" : number}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {isRecording && (
                                            <div className="recording-pill">
                                                <span className="recording-dot" />
                                                Enjoyy ajaaaa...
                                            </div>
                                        )}

                                        {!isCameraReady && !isRecording && (
                                            <div className="camera-start">
                                                <div className="camera-start-decoration">
                                                    ✦
                                                </div>
                                                <div className="camera-start-emoji">
                                                    📸
                                                </div>
                                                <h2>
                                                    Siap bikin foto lucu?
                                                </h2>
                                                <p>
                                                    Atur pose sedikit.
                                                    <br />
                                                    Senyum belakangan juga boleh.
                                                </p>
                                                <button
                                                    onClick={startRecording}
                                                    className="start-camera-button"
                                                >
                                                    Mulai Foto
                                                    <span>→</span>
                                                </button>
                                            </div>
                                        )}

                                        {isRecording && (
                                            <div className="camera-progress">
                                                <div
                                                    className="camera-progress-fill"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="camera-helper">
                                        {isRecording
                                            ? "pose dulu... jangan kabur 😭"
                                            : "kamera siap kapan kamu siap"}
                                    </div>
                                </div>

                                <div className="memory-section">
                                    <div className="memory-heading">
                                        <div>
                                            <div className="memory-title">
                                                Sedikit kenangan
                                            </div>
                                            <div className="memory-subtitle">
                                                satu per satu, jangan buru-buru 🤍
                                            </div>
                                        </div>
                                        <div className="memory-count">
                                            {photos.length}/3
                                        </div>
                                    </div>
                                    <div className="memory-grid">
                                        {[0, 1, 2].map((index) => (
                                            <div
                                                key={index}
                                                className={`memory-card ${photos[index] ? "has-photo" : ""}`}
                                            >
                                                {photos[index] ? (
                                                    <>
                                                        <img
                                                            src={photos[index]}
                                                            alt={`Foto ${index + 1}`}
                                                        />
                                                        <div className="memory-number">
                                                            {index + 1}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="memory-empty">
                                                        <span>
                                                            {index === 0
                                                                ? "☁️"
                                                                : index === 1
                                                                ? "♡"
                                                                : "✦"}
                                                        </span>
                                                        <small>
                                                            foto {index + 1}
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="recording-footer">
                                    Dibuat Oleh
                                    <strong> Eko Haryadi</strong>
                                </div>

                                {processing && (
                                    <div className="processing-card">
                                        <div className="processing-heart">
                                            ♡
                                        </div>
                                        <h3>
                                            Sebentar ya...
                                        </h3>
                                        <p>
                                            Lagi nyusun foto-foto lucu kamu 🤍
                                        </p>
                                        <div className="processing-line">
                                            <div />
                                        </div>
                                    </div>
                                )}
                            </section>

                            <audio
                                ref={audioRef}
                                src={CONFIG.mp3File}
                                loop={false}
                            />
                        </>
                    )}

                    {showEditor && (
                        <footer className="text-center mt-[25px] text-[14px] font-medium text-[#8d857e]">
                            Dibuat Oleh <strong className="text-[#4b4b4b] font-semibold">Eko Haryadi</strong>
                        </footer>
                    )}
                </div>
            </div>

            <style jsx global>{`
                /* =====================================================
                   RECORDING MODE — FOTO KITA
                ===================================================== */
                .recording-page {
                    max-width: 1040px;
                    margin: 0 auto;
                    padding-bottom: 30px;
                }

                .recording-intro {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 18px;
                }

                .recording-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .recording-brand-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f5d8df, #eadff4);
                    color: #8f596b;
                    font-size: 19px;
                }

                .recording-brand-name {
                    font-size: 21px;
                    font-weight: 700;
                    color: #292527;
                    letter-spacing: -0.4px;
                }

                .recording-brand-sub {
                    margin-top: 2px;
                    font-size: 12px;
                    color: #9b8f91;
                }

                .recording-note {
                    font-family: Georgia, serif;
                    font-style: italic;
                    font-size: 14px;
                    color: #9b858b;
                }

                /* MOOD */
                .mood-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 18px 20px;
                    background: rgba(255,255,255,.82);
                    border: 1px solid rgba(110,85,90,.07);
                    border-radius: 20px;
                    box-shadow: 0 10px 35px rgba(72,45,50,.045);
                    margin-bottom: 16px;
                }

                .mood-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #302a2c;
                }

                .mood-subtitle {
                    margin-top: 3px;
                    font-size: 12px;
                    color: #a19698;
                }

                .mood-buttons {
                    display: flex;
                    gap: 7px;
                }

                .mood-button {
                    border: 0;
                    padding: 10px 15px;
                    border-radius: 999px;
                    background: #f6f1f1;
                    color: #786d70;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: .25s ease;
                }

                .mood-button:disabled {
                    cursor: default;
                    opacity: 0.7;
                }

                .mood-button:disabled:hover {
                    transform: none;
                    background: #f6f1f1;
                }

                .mood-button:disabled.active {
                    background: #332d2f;
                    color: white;
                    box-shadow: 0 5px 16px rgba(50,40,42,.16);
                }

                .mood-button:disabled.active:hover {
                    transform: none;
                }

                .mood-button span {
                    margin-right: 5px;
                }

                .mood-button:hover {
                    transform: translateY(-1px);
                    background: #f0e8e9;
                }

                .mood-button.active {
                    background: #332d2f;
                    color: white;
                    box-shadow: 0 5px 16px rgba(50,40,42,.16);
                }

                /* CAMERA */
                .camera-card {
                    position: relative;
                }

                .camera-frame {
                    position: relative;
                    width: 100%;
                    height: 570px;
                    overflow: hidden;
                    border-radius: 28px;
                    background: radial-gradient(circle at 20% 20%, rgba(255,255,255,.35), transparent 30%), #ded5d0;
                    box-shadow: 0 25px 70px rgba(70,45,50,.10);
                    border: 7px solid white;
                }

                .camera-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .camera-flash {
                    position: absolute;
                    inset: 0;
                    background: white;
                    z-index: 20;
                }

                .photo-counter {
                    position: absolute;
                    top: 18px;
                    right: 18px;
                    display: flex;
                    gap: 7px;
                    z-index: 10;
                }

                .photo-counter-item {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255,255,255,.82);
                    color: #655d60;
                    font-size: 12px;
                    font-weight: 700;
                    backdrop-filter: blur(10px);
                }

                .photo-counter-item.done {
                    background: #7f9d88;
                    color: white;
                    transform: scale(1.06);
                }

                .recording-pill {
                    position: absolute;
                    top: 18px;
                    left: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 9px 14px;
                    border-radius: 999px;
                    background: rgba(35,27,29,.65);
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    backdrop-filter: blur(12px);
                }

                .recording-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #f08c9d;
                    animation: recordingPulse 1s infinite;
                }

                @keyframes recordingPulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .35; transform: scale(.75); }
                }

                /* START */
                .camera-start {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    background: linear-gradient(180deg, rgba(247,237,238,.92), rgba(237,228,230,.95));
                }

                .camera-start-decoration {
                    font-size: 20px;
                    color: #aa7783;
                    margin-bottom: 7px;
                }

                .camera-start-emoji {
                    font-size: 62px;
                    line-height: 1;
                    margin-bottom: 18px;
                    animation: cameraFloat 3s ease-in-out infinite;
                }

                @keyframes cameraFloat {
                    0%,100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-6px) rotate(2deg); }
                }

                .camera-start h2 {
                    margin: 0;
                    font-family: Georgia, serif;
                    font-size: 30px;
                    font-weight: 600;
                    color: #393134;
                    letter-spacing: -0.6px;
                }

                .camera-start p {
                    margin: 8px 0 22px;
                    color: #95898c;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .start-camera-button {
                    border: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 22px;
                    border-radius: 999px;
                    background: #332d2f;
                    color: white;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(50,40,42,.18);
                    transition: .25s ease;
                }

                .start-camera-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 30px rgba(50,40,42,.22);
                }

                .start-camera-button span {
                    font-size: 17px;
                }

                .camera-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: rgba(255,255,255,.25);
                }

                .camera-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #e49aa9, #b98cae);
                    transition: width .3s ease;
                }

                .camera-helper {
                    text-align: center;
                    margin-top: 10px;
                    font-family: Georgia, serif;
                    font-style: italic;
                    font-size: 13px;
                    color: #9a8d90;
                }

                /* MEMORY */
                .memory-section {
                    margin-top: 18px;
                    padding: 20px;
                    background: rgba(255,255,255,.82);
                    border-radius: 22px;
                    border: 1px solid rgba(100,75,80,.06);
                    box-shadow: 0 10px 35px rgba(72,45,50,.04);
                }

                .memory-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                }

                .memory-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #332d30;
                }

                .memory-subtitle {
                    margin-top: 3px;
                    font-size: 12px;
                    color: #a19698;
                }

                .memory-count {
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: #f5eeee;
                    color: #927d83;
                    font-size: 11px;
                    font-weight: 700;
                }

                .memory-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }

                .memory-card {
                    height: 110px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 16px;
                    background: #f3eeec;
                    border: 1px dashed #d9cdca;
                    transition: .3s ease;
                }

                .memory-card.has-photo {
                    border: 0;
                    box-shadow: 0 6px 18px rgba(70,50,55,.08);
                }

                .memory-card img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .memory-empty {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #b2a5a7;
                }

                .memory-empty span {
                    font-size: 22px;
                    margin-bottom: 4px;
                }

                .memory-empty small {
                    font-size: 10px;
                }

                .memory-number {
                    position: absolute;
                    left: 8px;
                    bottom: 8px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255,255,255,.85);
                    color: #51484b;
                    font-size: 10px;
                    font-weight: 700;
                    backdrop-filter: blur(8px);
                }

                .recording-footer {
                    margin-top: 18px;
                    text-align: center;
                    font-size: 11px;
                    color: #aaa0a1;
                }

                .recording-footer strong {
                    color: #786d70;
                }

                .processing-card {
                    margin-top: 18px;
                    padding: 28px;
                    text-align: center;
                    background: rgba(255,255,255,.9);
                    border-radius: 22px;
                    box-shadow: 0 15px 40px rgba(60,40,45,.08);
                }

                .processing-heart {
                    font-size: 30px;
                    color: #b77f8b;
                    animation: heartBeat 1.2s infinite;
                }

                @keyframes heartBeat {
                    0%,100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }

                .processing-card h3 {
                    margin-top: 8px;
                    font-family: Georgia, serif;
                    font-size: 21px;
                    font-weight: 600;
                    color: #393134;
                }

                .processing-card p {
                    margin-top: 5px;
                    color: #a09597;
                    font-size: 12px;
                }

                .processing-line {
                    width: 160px;
                    height: 4px;
                    margin: 17px auto 0;
                    overflow: hidden;
                    border-radius: 999px;
                    background: #eee5e5;
                }

                .processing-line div {
                    width: 50%;
                    height: 100%;
                    border-radius: inherit;
                    background: #b77f8b;
                    animation: processingMove 1.2s ease-in-out infinite;
                }

                @keyframes processingMove {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }

                /* =====================================================
                   EDITOR — WARM / ROMANTIC
                ===================================================== */
                .editor-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 15px 18px;
                    margin-bottom: 20px;
                    background: rgba(255,255,255,.86);
                    border: 1px solid rgba(90,60,65,.06);
                    border-radius: 22px;
                    box-shadow: 0 10px 35px rgba(70,45,50,.045);
                    backdrop-filter: blur(12px);
                }

                .editor-brand {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                }

                .editor-brand-mark {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 14px;
                    background: #f4e2e6;
                    color: #996475;
                }

                .editor-brand-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #332d30;
                }

                .editor-brand-sub {
                    margin-top: 2px;
                    font-size: 11px;
                    color: #a19698;
                }

                .editor-actions {
                    display: flex;
                    gap: 8px;
                }

                .editor-btn {
                    border: 0;
                    padding: 10px 15px;
                    border-radius: 999px;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: .25s ease;
                }

                .editor-btn:hover {
                    transform: translateY(-1px);
                }

                .editor-btn-soft {
                    background: #f3eeee;
                    color: #6f6266;
                }

                .editor-btn-main {
                    background: #332d2f;
                    color: white;
                    box-shadow: 0 7px 18px rgba(50,40,42,.14);
                }

                .preview-area {
                    position: relative;
                }

                .editor-welcome {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding: 8px 4px 17px;
                }

                .editor-eyebrow {
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 1.8px;
                    color: #b07d89;
                }

                .editor-welcome h1 {
                    margin: 7px 0 7px;
                    font-family: Georgia, serif;
                    font-size: 29px;
                    line-height: 1.05;
                    font-weight: 600;
                    color: #342e31;
                    letter-spacing: -0.8px;
                }

                .editor-welcome p {
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.6;
                    color: #9c9194;
                }

                .preview-badge {
                    padding: 7px 11px;
                    border-radius: 999px;
                    background: #f6eeee;
                    color: #9a7c84;
                    font-size: 10px;
                    font-weight: 700;
                }

                .side-card {
                    border: 1px solid rgba(90,60,65,.055);
                    box-shadow: 0 10px 35px rgba(70,45,50,.045);
                    padding: 7px 20px 15px 15px;
                    border-radius:5%;
                }
                .side-card span{
                    color: #000;}

                .side-card h5 {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    margin-bottom: 5px;
                }

                .side-hint {
                    margin: 0 0 15px;
                    font-size: 11px;
                    line-height: 1.5;
                    color: #a19698;
                }

                /* =====================================================
                   PREVIEW MAIN - FIXED: CENTER CONTENT
                ===================================================== */
                .preview-main {
                    height: 540px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at 20% 15%, rgba(255,255,255,.4), transparent 30%), #e5dcd8;
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,.5);
                    overflow: hidden;
                    padding: 12px;
                    position: relative;
                }

                /* VERTICAL LAYOUT - Rapi & klasik, Kayak dulu, Agak artsy */
                /* Tinggi dibuat hampir memenuhi preview */
                .preview-main .photo-strip:not(.layout-lshape) {
                    transform: scale(0.86);
                    transform-origin: center center;
                }

                /* SAMPING-SAMPING - Tetap seperti sebelumnya, jangan diubah */
                .preview-main .photo-strip.layout-lshape {
                    transform: scale(0.70);
                    transform-origin: center center;
                }

                /* =====================================================
                   HEADER - EXISTING (untuk fallback)
                ===================================================== */
                .header {
                    background: #fff;
                    border-radius: 20px;
                    padding: 18px 28px;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.04);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .sebelah-kiri-ujung {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .logo-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: #d9d0c8;
                }

                .brand-name {
                    font-size: 22px;
                    font-weight: 600;
                }

                .sebelah-kanan-ujung {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .header-button {
                    padding: 10px 20px;
                    border-radius: 999px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .header-button:hover {
                    transform: scale(1.02);
                    opacity: 0.9;
                }

                .restart {
                    background: #e74c3c;
                    color: white;
                }

                .download {
                    background: #222;
                    color: white;
                }

                /* =====================================================
                   EDITOR LAYOUT
                ===================================================== */
                .editor {
                    display: flex;
                    gap: 25px;
                    align-items: flex-start;
                }

                .preview-section {
                    flex: 6;
                    min-width: 0;
                }

                .bottom-tools {
                    display: flex;
                    gap: 18px;
                }

                .frame-box, .caption-box {
                    flex: 1;
                    background: white;
                    border-radius: 18px;
                    padding: 14px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.04);
                    min-width: 0;
                }

                .frame-box h6, .caption-box h6 {
                    margin-bottom: 10px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .color-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .color {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                    position: relative;
                    user-select: none;
                }

                .color:hover {
                    transform: scale(1.1);
                }

                .color.active {
                    border-color: #222;
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #222;
                }

                .caption-box textarea {
                    width: 100%;
                    height: 80px;
                    resize: none;
                    border: none;
                    outline: none;
                    background: #f7f3f0;
                    border-radius: 10px;
                    padding: 10px 12px;
                    font-family: inherit;
                    font-size: 14px;
                    transition: background 0.25s ease, box-shadow 0.25s ease;
                }

                .caption-box textarea:focus {
                    background: #fff;
                    box-shadow: 0 0 0 2px rgba(0,0,0,0.06);
                }

                .caption-presets {
                    display: flex;
                    gap: 7px;
                    flex-wrap: wrap;
                    margin-top: 9px;
                }

                .caption-preset {
                    border: 1px solid #ddd5ce;
                    background: #f8f5f2;
                    color: #555;
                    border-radius: 999px;
                    padding: 6px 10px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    font-family: inherit;
                }

                .caption-preset:hover {
                    transform: translateY(-1px);
                    background: #eee8e2;
                }

                .caption-preset.active {
                    background: #222;
                    color: white;
                    border-color: #222;
                }

                .sidebar {
                    flex: 4;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    min-width: 280px;
                }

                .option-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                /* =====================================================
                   LAYOUT OPTION
                ===================================================== */
                .layout-option {
                    height: 110px;
                    border-radius: 16px;
                    background: #ece6e0;
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.25s ease;
                    border: 2px solid transparent;
                    padding: 6px;
                    user-select: none;
                }

                .layout-option:hover {
                    transform: translateY(-2px);
                    background: #ddd6cf;
                }

                .layout-option.active {
                    border-color: #222;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                    background: #d5cdc5;
                    transform: translateY(-2px);
                }

                .layout-option .mini-layout {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    gap: 3px;
                    padding: 4px;
                    background: white;
                    border-radius: 8px;
                    pointer-events: none;
                }

                .layout-option .mini-layout .mini-photo-box {
                    background: #d9d0c8;
                    border-radius: 3px;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 7px;
                    color: #999;
                    font-weight: 600;
                    min-height: 20px;
                }

                .layout-option .mini-layout.classic-strip-preview {
                    flex-direction: column;
                }

                .layout-option .mini-layout.lshape-preview {
                    flex-direction: row;
                }

                .layout-option .mini-layout.lshape-preview .mini-photo-box:first-child {
                    flex: 2;
                }

                .layout-option .mini-layout.lshape-preview .mini-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    flex: 1;
                }

                .layout-option .mini-layout.lshape-preview .mini-right-col .mini-photo-box {
                    flex: 1;
                }

                .layout-option .mini-layout.polaroid-preview {
                    flex-direction: column;
                    gap: 1px;
                    padding: 8px 4px;
                    background: transparent;
                }

                .layout-option .mini-layout.polaroid-preview .mini-photo-box {
                    height: 20px;
                    transform: rotate(var(--rot, 0deg));
                    margin-bottom: -8px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    background: white;
                    padding: 2px;
                }

                .layout-option .mini-layout.polaroid-preview .mini-photo-box:nth-child(1) { --rot: -4deg; }
                .layout-option .mini-layout.polaroid-preview .mini-photo-box:nth-child(2) { --rot: 2deg; }
                .layout-option .mini-layout.polaroid-preview .mini-photo-box:nth-child(3) { --rot: -3deg; }

                .layout-option .mini-layout.polaroid-preview .mini-photo-box .mini-photo-box-inner {
                    background: #d9d0c8;
                    height: 100%;
                    width: 100%;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 5px;
                    color: #999;
                }

                .layout-option .mini-layout.editorial-preview {
                    flex-direction: column;
                }

                .layout-option .mini-layout.editorial-preview .mini-photo-box:first-child {
                    flex: 2;
                }

                .layout-option .mini-layout.editorial-preview .mini-bottom-row {
                    display: flex;
                    gap: 3px;
                    flex: 1;
                }

                .layout-option .mini-layout.editorial-preview .mini-bottom-row .mini-photo-box {
                    flex: 1;
                }

                .layout-option .mini-layout.editorial-preview .mini-text-bar {
                    height: 6px;
                    background: #ddd;
                    margin-top: 2px;
                    border-radius: 2px;
                    width: 60%;
                    margin-left: auto;
                    margin-right: auto;
                }

                .layout-option .option-label {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 4px;
                    text-align: center;
                    font-size: 9px;
                    font-weight: 600;
                    color: #555;
                    pointer-events: none;
                }

                /* =====================================================
                   COVER OPTION
                ===================================================== */
                .cover-option {
                    height: 130px;
                    border-radius: 16px;
                    background: #ece6e0;
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.25s ease;
                    border: 2px solid transparent;
                    padding: 4px;
                    user-select: none;
                }

                .cover-option:hover {
                    transform: translateY(-2px);
                    background: #ddd6cf;
                }

                .cover-option.active {
                    border-color: #222;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
                    background: #d5cdc5;
                    transform: translateY(-2px);
                }

                .cover-option .mini-strip {
                    width: 82px;
                    height: 108px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    pointer-events: none;
                    border-radius: 8px;
                    padding: 8px;
                    transition: all 0.25s ease;
                }

                .cover-option .mini-title {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    font-size: 9px;
                    line-height: 1.3;
                    text-align: center;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .cover-option .option-label {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 4px;
                    text-align: center;
                    font-size: 9px;
                    font-weight: 600;
                    color: #555;
                    pointer-events: none;
                }

                .mini-floral {
                    background: linear-gradient(180deg, #fff9fa, #fff0f4);
                    border: 2px solid #ffffff;
                    box-shadow: 0 5px 14px rgba(100,50,70,0.12);
                    color: #8f4d62;
                }

                .mini-floral .mini-title {
                    font-family: Georgia, serif;
                    font-style: italic;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                }

                .mini-floral .mini-title::before {
                    content: "🌸";
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .mini-floral .mini-title::after {
                    content: "FOTO KITA BLUR";
                    font-family: Arial, sans-serif;
                    font-size: 5px;
                    letter-spacing: 1px;
                    margin-top: 6px;
                    font-style: normal;
                    opacity: 0.6;
                }

                .mini-retro {
                    background: #f2eadb;
                    border: 2px solid #191919;
                    border-radius: 4px;
                    color: #252525;
                }

                .mini-retro .mini-title {
                    font-family: Georgia, serif;
                    font-size: 11px;
                    letter-spacing: 1px;
                }

                .mini-retro .mini-title::before {
                    content: "📷";
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .mini-retro .mini-title::after {
                    content: "NO. 003";
                    font-family: Arial, sans-serif;
                    font-size: 5px;
                    letter-spacing: 1px;
                    margin-top: 6px;
                }

                .mini-candy {
                    background: linear-gradient(180deg, #fff8fc, #f1ecff);
                    border: 2px solid #ffffff;
                    border-radius: 10px;
                    color: #7f5a94;
                    box-shadow: 0 5px 14px rgba(117,75,130,0.12);
                }

                .mini-candy .mini-title {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                }

                .mini-candy .mini-title::before {
                    content: "🍬";
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .mini-candy .mini-title::after {
                    content: "SWEET MOMENTS";
                    font-size: 5px;
                    letter-spacing: 1px;
                    margin-top: 6px;
                    opacity: 0.7;
                }

                .mini-midnight {
                    background: radial-gradient(circle at 50% 15%, rgba(125,95,255,0.4), transparent 35%),
                                linear-gradient(180deg, #17152d, #07070b);
                    border: 2px solid #302b5c;
                    color: #ffffff;
                    box-shadow: 0 5px 16px rgba(30,20,70,0.25);
                }

                .mini-midnight .mini-title {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .mini-midnight .mini-title::before {
                    content: "🌙";
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .mini-midnight .mini-title::after {
                    content: "PHOTO NIGHT";
                    font-size: 5px;
                    letter-spacing: 2px;
                    margin-top: 6px;
                    opacity: 0.55;
                }

                /* =====================================================
                   FILTER OPTION
                ===================================================== */
                .filter-option {
                    height: 70px;
                    border-radius: 16px;
                    background: #ece6e0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.25s ease;
                    border: 2px solid transparent;
                    color: #555;
                    user-select: none;
                }

                .filter-option:hover {
                    transform: translateY(-2px);
                    background: #ddd6cf;
                }

                .filter-option.active {
                    border-color: #222;
                    background: #d5cdc5;
                    color: #222;
                    transform: translateY(-2px);
                }

                /* =====================================================
                   PHOTO STRIP - BASE (existing)
                ===================================================== */
                .photo-strip {
                    width: 230px;
                    height: 610px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    transition: all 0.4s ease;
                    overflow: hidden;
                    flex-shrink: 0;
                    --frame-color: #ffffff;
                    --accent-color: #8f4d62;
                    --photo-filter: none;
                    animation: boothAppear 0.45s ease;
                }

                @keyframes boothAppear {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .photo-strip .photo {
                    width: 100%;
                    height: 155px;
                    object-fit: cover;
                    display: block;
                    transition: filter 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
                    filter: var(--photo-filter);
                }

                .photo-strip .photo-area {
                    position: relative;
                    z-index: 3;
                    transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
                    border-color: var(--frame-color) !important;
                }

                .photo-strip .photo-area::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 2;
                    background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent 35%, rgba(0,0,0,0.04));
                }

                /* LAYOUT: CLASSIC STRIP */
                .photo-strip.layout-classic-strip .photo {
                    height: 155px;
                }
                .photo-strip.layout-classic-strip .photo-area {
                    margin-bottom: 6px;
                }

                /* LAYOUT: L-SHAPE */
                .photo-strip.layout-lshape {
                    flex-direction: row !important;
                    flex-wrap: wrap !important;
                    width: 460px !important;
                    height: 460px !important;
                    padding: 12px;
                    gap: 6px;
                }
                .photo-strip.layout-lshape .photo-area:first-child {
                    width: 65% !important;
                    height: 100% !important;
                }
                .photo-strip.layout-lshape .photo-area:first-child .photo {
                    height: 100% !important;
                    width: 100% !important;
                }
                .photo-strip.layout-lshape .photo-right-column {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 32% !important;
                    height: 100% !important;
                }
                .photo-strip.layout-lshape .photo-right-column .photo-area {
                    height: 48% !important;
                    width: 100% !important;
                }
                .photo-strip.layout-lshape .photo-right-column .photo-area .photo {
                    height: 100% !important;
                    width: 100% !important;
                }
                .photo-strip.layout-lshape .floral-top,
                .photo-strip.layout-lshape .retro-header,
                .photo-strip.layout-lshape .candy-header,
                .photo-strip.layout-lshape .midnight-header,
                .photo-strip.layout-lshape .floral-bottom,
                .photo-strip.layout-lshape .retro-footer,
                .photo-strip.layout-lshape .candy-footer,
                .photo-strip.layout-lshape .midnight-footer {
                    display: none !important;
                }

                /* LAYOUT: POLAROID */
                .photo-strip.layout-polaroid {
                    padding: 20px 12px;
                    gap: 0px;
                    position: relative;
                }
                .photo-strip.layout-polaroid .photo-area {
                    margin-bottom: -50px;
                    position: relative;
                    padding: 8px 8px 30px 8px;
                    background: white;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    transform-origin: center;
                    width: 85%;
                    margin-left: auto;
                    margin-right: auto;
                    border-color: var(--frame-color) !important;
                }
                .photo-strip.layout-polaroid .photo-area:nth-child(1) {
                    transform: rotate(-6deg) translateY(10px);
                    z-index: 3;
                }
                .photo-strip.layout-polaroid .photo-area:nth-child(2) {
                    transform: rotate(3deg) translateY(-5px);
                    z-index: 4;
                }
                .photo-strip.layout-polaroid .photo-area:nth-child(3) {
                    transform: rotate(-4deg) translateY(-20px);
                    z-index: 5;
                }
                .photo-strip.layout-polaroid .photo-area .photo {
                    height: 120px;
                    width: 100%;
                    margin-bottom: 4px;
                }
                .photo-strip.layout-polaroid .photo-area::after {
                    content: "✦";
                    position: absolute;
                    bottom: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 10px;
                    opacity: 0.4;
                    letter-spacing: 4px;
                }
                .photo-strip.layout-polaroid .floral-top,
                .photo-strip.layout-polaroid .retro-header,
                .photo-strip.layout-polaroid .candy-header,
                .photo-strip.layout-polaroid .midnight-header,
                .photo-strip.layout-polaroid .floral-bottom,
                .photo-strip.layout-polaroid .retro-footer,
                .photo-strip.layout-polaroid .candy-footer,
                .photo-strip.layout-polaroid .midnight-footer {
                    display: none !important;
                }

                /* LAYOUT: EDITORIAL */
                .photo-strip.layout-editorial {
                    gap: 8px;
                    padding: 15px;
                }
                .photo-strip.layout-editorial .photo-area:first-child {
                    height: 55% !important;
                }
                .photo-strip.layout-editorial .photo-area:first-child .photo {
                    height: 100% !important;
                }
                .photo-strip.layout-editorial .photo-bottom-row {
                    display: flex;
                    gap: 6px;
                    width: 100%;
                    flex: 1;
                }
                .photo-strip.layout-editorial .photo-bottom-row .photo-area {
                    height: 100% !important;
                    width: 48% !important;
                }
                .photo-strip.layout-editorial .photo-bottom-row .photo-area .photo {
                    height: 100% !important;
                    width: 100% !important;
                }
                .photo-strip.layout-editorial .floral-top,
                .photo-strip.layout-editorial .retro-header,
                .photo-strip.layout-editorial .candy-header,
                .photo-strip.layout-editorial .midnight-header,
                .photo-strip.layout-editorial .floral-bottom,
                .photo-strip.layout-editorial .retro-footer,
                .photo-strip.layout-editorial .candy-footer,
                .photo-strip.layout-editorial .midnight-footer {
                    display: none !important;
                }

                /* BOOTH CAPTION */
                .photo-strip .booth-caption {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    color: var(--accent-color);
                    padding: 7px 10px 3px;
                    font-size: 15px;
                    letter-spacing: 1.5px;
                    line-height: 1.2;
                    transition: color 0.35s ease, opacity 0.35s ease, transform 0.35s ease;
                }

                .photo-strip .booth-caption.empty {
                    opacity: 0.45;
                }

                .photo-strip.style-midnight .booth-caption {
                    color: var(--frame-color);
                    text-shadow: 0 0 14px rgba(255,255,255,0.3);
                }

                .photo-strip.style-retro .booth-caption {
                    font-family: Arial, sans-serif;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 2px;
                }

                .photo-strip.style-candy .booth-caption {
                    font-family: Arial, sans-serif;
                    font-weight: 800;
                }

                .photo-strip.style-floral .booth-caption {
                    font-style: italic;
                }

                .photo-strip.layout-editorial .booth-caption {
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    margin-top: 5px;
                    border-top: 1px solid rgba(0,0,0,0.1);
                }

                /* COVER STYLES - FLORAL */
                .photo-strip.style-floral {
                    background: radial-gradient(circle at 15% 10%, #ffd6df 0 12px, transparent 13px),
                                radial-gradient(circle at 85% 12%, #f9b8ca 0 10px, transparent 11px),
                                linear-gradient(180deg, #fff9fa, #fff0f4);
                    border: 7px solid var(--frame-color, #fff);
                    box-shadow: 0 20px 45px rgba(100,50,70,0.18);
                    --accent-color: #8f4d62;
                }
                .photo-strip.style-floral .photo-area {
                    border: 4px solid var(--frame-color, #fff);
                    margin-bottom: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                }
                .photo-strip.style-floral .photo {
                    height: 155px;
                }
                .photo-strip.style-floral .floral-top {
                    height: 45px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: Georgia, serif;
                    font-size: 17px;
                    font-style: italic;
                    color: var(--accent-color);
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-floral .floral-bottom {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: var(--accent-color);
                    text-align: center;
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-floral .floral-bottom .main {
                    font-family: Georgia, serif;
                    font-size: 20px;
                    font-style: italic;
                }
                .photo-strip.style-floral .floral-bottom .small {
                    font-size: 8px;
                    letter-spacing: 2px;
                    margin-top: 5px;
                }
                .photo-strip.style-floral .flower {
                    position: absolute;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #f7b6c8 0 7px, transparent 8px),
                                conic-gradient(#f6b3c4 0deg 72deg, transparent 72deg 144deg, #f6b3c4 144deg 216deg, transparent 216deg 288deg, #f6b3c4 288deg);
                    opacity: 0.9;
                }
                .photo-strip.style-floral .flower.one { left: -5px; top: 5px; }
                .photo-strip.style-floral .flower.two { right: -5px; bottom: 10px; transform: scale(0.8); }

                /* COVER STYLES - RETRO */
                .photo-strip.style-retro {
                    background: #f2eadb;
                    border: 8px solid var(--frame-color, #191919);
                    border-radius: 6px;
                    box-shadow: 0 20px 45px rgba(0,0,0,0.25);
                    --accent-color: #252525;
                }
                .photo-strip.style-retro .photo-area {
                    border: 3px solid var(--frame-color, #222);
                    margin-bottom: 6px;
                    position: relative;
                }
                .photo-strip.style-retro .photo {
                    height: 155px;
                }
                .photo-strip.style-retro .retro-header {
                    height: 38px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 4px;
                    font-size: 8px;
                    letter-spacing: 2px;
                    color: #333;
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-retro .retro-footer {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    text-align: center;
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-retro .retro-footer .title {
                    font-family: Georgia, serif;
                    font-size: 18px;
                    letter-spacing: 1px;
                }
                .photo-strip.style-retro .retro-footer .sub {
                    font-size: 7px;
                    letter-spacing: 2px;
                    margin-top: 7px;
                }

                /* COVER STYLES - CANDY */
                .photo-strip.style-candy {
                    background: radial-gradient(circle at 10% 10%, #ffb7d0 0 7px, transparent 8px),
                                radial-gradient(circle at 90% 20%, #c9b6ff 0 8px, transparent 9px),
                                radial-gradient(circle at 15% 85%, #a8e6cf 0 7px, transparent 8px),
                                linear-gradient(180deg, #fff8fc, #f4efff);
                    border: 5px solid var(--frame-color, #fff);
                    box-shadow: 0 20px 45px rgba(117,75,130,0.2);
                    --accent-color: #7f5a94;
                }
                .photo-strip.style-candy .photo-area {
                    border: 5px solid var(--frame-color, #fff);
                    border-radius: 15px;
                    overflow: hidden;
                    margin-bottom: 7px;
                    box-shadow: 0 5px 15px rgba(80,50,90,0.12);
                }
                .photo-strip.style-candy .photo {
                    height: 150px;
                }
                .photo-strip.style-candy .candy-header {
                    height: 50px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 20px;
                    font-weight: 800;
                    color: var(--accent-color);
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-candy .candy-footer {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    z-index: 5;
                    color: #73527f;
                }
                .photo-strip.style-candy .candy-footer .title {
                    font-size: 18px;
                    font-weight: 800;
                }
                .photo-strip.style-candy .candy-footer .sub {
                    font-size: 8px;
                    letter-spacing: 2px;
                    margin-top: 5px;
                }
                .photo-strip.style-candy .sparkle {
                    position: absolute;
                    color: #c99cff;
                    font-size: 22px;
                    z-index: 4;
                }
                .photo-strip.style-candy .sparkle.one { top: 18px; left: 12px; }
                .photo-strip.style-candy .sparkle.two { right: 10px; bottom: 40px; }

                /* COVER STYLES - MIDNIGHT */
                .photo-strip.style-midnight {
                    background: radial-gradient(circle at 50% 10%, rgba(125,95,255,0.45), transparent 35%),
                                linear-gradient(180deg, #141225, #08080d);
                    border: 4px solid var(--frame-color, #28254a);
                    box-shadow: 0 20px 50px rgba(30,20,70,0.4);
                    --accent-color: #ffffff;
                }
                .photo-strip.style-midnight .photo-area {
                    border: 2px solid var(--frame-color, rgba(255,255,255,0.6));
                    margin-bottom: 7px;
                    box-shadow: 0 0 18px rgba(150,120,255,0.15);
                }
                .photo-strip.style-midnight .photo {
                    height: 152px;
                }
                .photo-strip.style-midnight .midnight-header {
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-midnight .midnight-footer {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    text-align: center;
                    position: relative;
                    z-index: 5;
                }
                .photo-strip.style-midnight .midnight-footer .title {
                    font-size: 17px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                .photo-strip.style-midnight .midnight-footer .sub {
                    font-size: 7px;
                    letter-spacing: 3px;
                    opacity: 0.6;
                    margin-top: 7px;
                }
                .photo-strip.style-midnight .star {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 0 10px white;
                    z-index: 2;
                }

                /* Judul section editor — hitam agar lebih terbaca */
                .side-card h5,
                .frame-box h6,
                .caption-box h6 {
                    color: #000000 !important;
                }

                /* Ikon di sebelah judul juga hitam */
                .side-card h5 span {
                    color: #000000 !important;
                }

                /* Label pilihan */
                .option-label {
                    color: #000000 !important;
                }

                /* Kalau ada teks bantuan di bawah judul, tetap dibuat sedikit soft */
                .side-hint {
                    color: #6f6f6f !important;
                }

                .photo-strip.style-midnight .star.s1 { top: 35px; left: 18px; }
                .photo-strip.style-midnight .star.s2 { top: 110px; right: 15px; }
                .photo-strip.style-midnight .star.s3 { bottom: 80px; left: 12px; }
                .photo-strip.style-midnight .star.s4 { bottom: 30px; right: 20px; }

                /* =====================================================
                   RESPONSIVE
                ===================================================== */
                @media (max-width: 992px) {
                    .editor { flex-direction: column; }
                    .preview-section, .sidebar { width: 100%; }
                    .sidebar { min-width: unset; }
                }

                @media (max-width: 768px) {
                    .recording-intro {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                    .recording-note {
                        display: none;
                    }
                    .mood-row {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 13px;
                    }
                    .mood-buttons {
                        width: 100%;
                    }
                    .mood-button {
                        flex: 1;
                    }
                    .camera-frame {
                        height: 520px;
                        border-radius: 22px;
                    }
                    .camera-start h2 {
                        font-size: 25px;
                    }
                    .editor-topbar {
                        align-items: flex-start;
                        gap: 12px;
                        flex-direction: column;
                    }
                    .editor-actions {
                        width: 100%;
                    }
                    .editor-btn {
                        flex: 1;
                    }
                    .editor-welcome {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .preview-main {
                        height: 450px;
                        padding: 15px;
                    }
                    .bottom-tools {
                        flex-direction: column;
                    }
                    
                    /* Mobile scale adjustment */
                    .preview-main .photo-strip:not(.layout-lshape) {
                        transform: scale(0.65);
                    }
                    .preview-main .photo-strip.layout-lshape {
                        transform: scale(0.55);
                    }
                    
                    .option-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 500px) {
                    .preview-main {
                        height: 380px;
                        padding: 10px;
                    }
                    
                    .preview-main .photo-strip:not(.layout-lshape) {
                        transform: scale(0.55);
                    }
                    .preview-main .photo-strip.layout-lshape {
                        transform: scale(0.45);
                    }
                    
                    .option-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                    .layout-option {
                        height: 80px;
                    }
                    .cover-option {
                        height: 100px;
                    }
                    .side-card {
                        padding: 20px;
                    }
                    .camera-frame {
                        height: 400px;
                    }
                    .memory-grid {
                        gap: 8px;
                    }
                    .memory-card {
                        height: 80px;
                    }
                }
            `}</style>
        </main>
    );
}
