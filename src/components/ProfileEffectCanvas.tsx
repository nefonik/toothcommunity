import React, { useEffect, useRef } from "react";
import { Sparkles, Ghost, Bird, Flame, Zap, Compass, Moon, Coins, Waves, Leaf } from "lucide-react";

export interface ProfileEffectDef {
  id: string;
  name: string;
  category: "Spooky" | "Nature" | "Cyber" | "Fantasy" | "Cosmic" | "Luxury";
  description: string;
  icon: string;
  tag: string;
  price: number;
  themeColor: string;
  previewBg: string;
}

export const PROFILE_EFFECTS: ProfileEffectDef[] = [
  {
    id: "ghosts_haunted",
    name: "Nawiedzone Duchy",
    category: "Spooky",
    description: "Eteryczne lewitujące duchy, nocna mgła i nietoperze przelatujące przez Twój profil.",
    icon: "👻",
    tag: "NOWOŚĆ",
    price: 350,
    themeColor: "#8a2be2",
    previewBg: "from-[#2e0854] to-[#120324]",
  },
  {
    id: "birds_flight",
    name: "Przelot Ptaków",
    category: "Nature",
    description: "Klucz wędrownych ptaków szybujących po niebie oraz delikatnie spadające pióra.",
    icon: "🦅",
    tag: "DISCORD",
    price: 300,
    themeColor: "#38bdf8",
    previewBg: "from-[#0c4a6e] to-[#082f49]",
  },
  {
    id: "sakura_petals",
    name: "Deszcz Wiśni Sakura",
    category: "Nature",
    description: "Spadające płatki japońskiej wiśni, różowe magiczne iskry i wiosenny powiew wiatru.",
    icon: "🌸",
    tag: "POPULARNE",
    price: 320,
    themeColor: "#f472b6",
    previewBg: "from-[#831843] to-[#500724]",
  },
  {
    id: "dragon_flame",
    name: "Smoczy Płomień",
    category: "Fantasy",
    description: "Gorące wulkaniczne płomienie, unoszący się żar i iskry smoczego oddechu.",
    icon: "🔥",
    tag: "EPICKI",
    price: 400,
    themeColor: "#f97316",
    previewBg: "from-[#7c2d12] to-[#431407]",
  },
  {
    id: "cyber_matrix",
    name: "Cyberpunk Matrix",
    category: "Cyber",
    description: "Kaskada cyfrowego kodu binarnego, neonowe linie skanujące i hologramowe zakłócenia.",
    icon: "⚡",
    tag: "LEGENDARNY",
    price: 450,
    themeColor: "#22c55e",
    previewBg: "from-[#052e16] to-[#021a0d]",
  },
  {
    id: "cosmic_galaxy",
    name: "Kosmiczna Mgławica",
    category: "Cosmic",
    description: "Spadające gwiazdy z błyszczącymi ogonami, konstelacje gwiezdne i wirująca mgławica.",
    icon: "🌌",
    tag: "MISTYCZNY",
    price: 500,
    themeColor: "#a855f7",
    previewBg: "from-[#3b0764] to-[#1e053a]",
  },
  {
    id: "gold_rain",
    name: "Złoty Deszcz CFX",
    category: "Luxury",
    description: "Wirujące złote monety z zębem ToothChat 🦷, lśniące diamenty i złoty blask.",
    icon: "💰",
    tag: "VIP CFX",
    price: 600,
    themeColor: "#eab308",
    previewBg: "from-[#713f12] to-[#3a2006]",
  },
  {
    id: "ocean_jellyfish",
    name: "Głębinowa Meduza",
    category: "Nature",
    description: "Bioluminescencyjne meduzy unoszące się w morskiej toni z unoszącymi się bąbelkami.",
    icon: "🪼",
    tag: "RELAKS",
    price: 340,
    themeColor: "#06b6d4",
    previewBg: "from-[#164e63] to-[#082f49]",
  },
  {
    id: "electric_storm",
    name: "Burza Piorunów",
    category: "Cyber",
    description: "Wyładowania atmosferyczne, błyskawice plazmowe i iskrzące łuki elektryczne.",
    icon: "🌩️",
    tag: "NOWOŚĆ",
    price: 420,
    themeColor: "#6366f1",
    previewBg: "from-[#1e1b4b] to-[#0f0e28]",
  },
  {
    id: "autumn_leaves",
    name: "Złota Jesień",
    category: "Nature",
    description: "Wirujące klonowe liście w barwach złota i karminu niesione jesiennym wiatrem.",
    icon: "🍂",
    tag: "KLASYK",
    price: 280,
    themeColor: "#d97706",
    previewBg: "from-[#78350f] to-[#451a03]",
  },
];

interface ProfileEffectCanvasProps {
  effectId?: string | null;
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

export const ProfileEffectCanvas: React.FC<ProfileEffectCanvasProps> = ({
  effectId,
  className = "",
  intensity = 1,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!effectId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle engines depending on effect
    let particles: any[] = [];
    let secondaryParticles: any[] = [];
    let time = 0;

    // 1. Ghosts Haunted
    if (effectId === "ghosts_haunted") {
      const ghostCount = Math.floor(5 * intensity);
      for (let i = 0; i < ghostCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: height + Math.random() * 80,
          speedY: 0.6 + Math.random() * 0.8,
          speedX: (Math.random() - 0.5) * 0.4,
          size: 24 + Math.random() * 20,
          opacity: 0.15 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.03 + Math.random() * 0.03,
          glowColor: Math.random() > 0.5 ? "rgba(168, 85, 247, " : "rgba(56, 189, 248, ",
          type: "ghost",
        });
      }
      // Spooky mist & will-o-wisps
      for (let i = 0; i < 15; i++) {
        secondaryParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 2 + Math.random() * 4,
          alpha: Math.random() * 0.8,
          speedY: -0.3 - Math.random() * 0.4,
          speedX: (Math.random() - 0.5) * 0.5,
          color: "rgba(192, 132, 252, ",
        });
      }
    }

    // 2. Birds Flight
    else if (effectId === "birds_flight") {
      const birdCount = Math.floor(6 * intensity);
      for (let i = 0; i < birdCount; i++) {
        particles.push({
          x: -50 - Math.random() * 150,
          y: 20 + Math.random() * (height * 0.6),
          speedX: 1.4 + Math.random() * 1.6,
          speedY: (Math.random() - 0.5) * 0.3,
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 0.18 + Math.random() * 0.1,
          size: 14 + Math.random() * 10,
          color: Math.random() > 0.3 ? "rgba(224, 242, 254, 0.9)" : "rgba(56, 189, 248, 0.8)",
          type: "bird",
        });
      }
      // Floating feathers
      for (let i = 0; i < 8; i++) {
        secondaryParticles.push({
          x: Math.random() * width,
          y: -20 - Math.random() * 100,
          speedY: 0.5 + Math.random() * 0.6,
          speedX: Math.sin(i) * 0.4 + 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 0.02,
          size: 10 + Math.random() * 8,
          color: "rgba(255, 255, 255, 0.6)",
        });
      }
    }

    // 3. Sakura Petals
    else if (effectId === "sakura_petals") {
      const count = Math.floor(25 * intensity);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          speedY: 0.8 + Math.random() * 1.2,
          speedX: 0.6 + Math.random() * 0.8,
          size: 6 + Math.random() * 7,
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          rotZ: Math.random() * Math.PI,
          rotSpeedX: 0.02 + Math.random() * 0.03,
          rotSpeedY: 0.03 + Math.random() * 0.04,
          opacity: 0.5 + Math.random() * 0.5,
          color: Math.random() > 0.3 ? "#f472b6" : "#fbcfe8",
        });
      }
    }

    // 4. Dragon Flame
    else if (effectId === "dragon_flame") {
      const count = Math.floor(35 * intensity);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: height + Math.random() * 20,
          speedY: -(1.5 + Math.random() * 2.5),
          speedX: (Math.random() - 0.5) * 1.2,
          size: 4 + Math.random() * 8,
          life: 1,
          decay: 0.01 + Math.random() * 0.02,
          color: ["#ff4500", "#ff8c00", "#ffd700", "#ff1493"][Math.floor(Math.random() * 4)],
        });
      }
    }

    // 5. Cyber Matrix
    else if (effectId === "cyber_matrix") {
      const columns = Math.floor(width / 16);
      for (let i = 0; i < columns; i++) {
        particles.push({
          x: i * 16 + 8,
          y: Math.random() * height,
          speed: 1.5 + Math.random() * 3,
          chars: ["0", "1", "T", "O", "O", "T", "H", "C", "F", "X", "7", "λ", "Ω", "§"],
          activeChar: "0",
          charTimer: 0,
          length: 5 + Math.floor(Math.random() * 8),
        });
      }
    }

    // 6. Cosmic Galaxy
    else if (effectId === "cosmic_galaxy") {
      // Shooting stars
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: Math.random() * width * 1.5 - width * 0.5,
          y: -50 - Math.random() * 100,
          speedX: 3 + Math.random() * 3,
          speedY: 2 + Math.random() * 2,
          length: 40 + Math.random() * 60,
          opacity: 0.8,
          color: "#c084fc",
        });
      }
      // Starfield dots
      for (let i = 0; i < 35; i++) {
        secondaryParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1 + Math.random() * 2,
          alpha: Math.random(),
          twinkleSpeed: 0.02 + Math.random() * 0.04,
          color: Math.random() > 0.5 ? "#e9d5ff" : "#93c5fd",
        });
      }
    }

    // 7. Gold Rain CFX
    else if (effectId === "gold_rain") {
      const count = Math.floor(18 * intensity);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: -20 - Math.random() * height,
          speedY: 1.2 + Math.random() * 2,
          speedX: (Math.random() - 0.5) * 0.6,
          radius: 8 + Math.random() * 6,
          rotation: Math.random() * Math.PI,
          rotSpeed: 0.04 + Math.random() * 0.04,
          isDiamond: Math.random() > 0.7,
          sparklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // 8. Ocean Jellyfish
    else if (effectId === "ocean_jellyfish") {
      const count = Math.floor(4 * intensity);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: 40 + Math.random() * (width - 80),
          y: height + 50 + Math.random() * 100,
          speedY: 0.4 + Math.random() * 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          size: 20 + Math.random() * 16,
          pulsePhase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.5 ? "rgba(34, 211, 238, " : "rgba(168, 85, 247, ",
        });
      }
      // Rising bubbles
      for (let i = 0; i < 20; i++) {
        secondaryParticles.push({
          x: Math.random() * width,
          y: height + Math.random() * height,
          radius: 2 + Math.random() * 4,
          speedY: 0.8 + Math.random() * 1.2,
          wobble: Math.random() * Math.PI * 2,
          alpha: 0.3 + Math.random() * 0.5,
        });
      }
    }

    // 9. Electric Storm
    else if (effectId === "electric_storm") {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          size: 2 + Math.random() * 3,
          color: "#818cf8",
        });
      }
    }

    // 10. Autumn Leaves
    else if (effectId === "autumn_leaves") {
      const count = Math.floor(20 * intensity);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: -20 - Math.random() * height,
          speedY: 0.9 + Math.random() * 1.3,
          speedX: 0.8 + Math.random() * 1,
          size: 10 + Math.random() * 8,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 0.03 + Math.random() * 0.03,
          color: ["#d97706", "#dc2626", "#ea580c", "#b45309"][Math.floor(Math.random() * 4)],
        });
      }
    }

    // --- ANIMATION RENDER LOOP ---
    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // 1. Ghost Render Loop
      if (effectId === "ghosts_haunted") {
        // Render will-o-wisps
        secondaryParticles.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < -10) p.y = height + 10;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (0.3 + 0.3 * Math.sin(time * 3 + p.x)) + ")";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 8;
          ctx.fill();
        });

        // Render Ghosts
        particles.forEach((g) => {
          g.y -= g.speedY;
          g.x += Math.sin(time * 2 + g.phase) * 0.8;
          if (g.y < -g.size * 2) {
            g.y = height + g.size * 2;
            g.x = Math.random() * width;
          }

          const curAlpha = g.opacity * (0.8 + 0.2 * Math.sin(time * 2 + g.phase));

          ctx.save();
          ctx.translate(g.x, g.y);

          // Ethereal outer glow
          const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, g.size * 1.2);
          grad.addColorStop(0, g.glowColor + curAlpha + ")");
          grad.addColorStop(0.6, g.glowColor + curAlpha * 0.4 + ")");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, g.size * 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Ghost Shape Body
          ctx.beginPath();
          ctx.moveTo(-g.size * 0.5, g.size * 0.4);
          ctx.bezierCurveTo(
            -g.size * 0.6,
            -g.size * 0.7,
            g.size * 0.6,
            -g.size * 0.7,
            g.size * 0.5,
            g.size * 0.4
          );
          // Ruffled wavy skirt
          ctx.quadraticCurveTo(g.size * 0.25, g.size * 0.1, 0, g.size * 0.45);
          ctx.quadraticCurveTo(-g.size * 0.25, g.size * 0.1, -g.size * 0.5, g.size * 0.4);
          ctx.fillStyle = "rgba(255, 255, 255, " + curAlpha * 0.85 + ")";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 12;
          ctx.fill();

          // Cute Spooky Ghost Eyes
          ctx.fillStyle = "rgba(18, 24, 38, 0.9)";
          ctx.beginPath();
          ctx.arc(-g.size * 0.18, -g.size * 0.2, g.size * 0.1, 0, Math.PI * 2);
          ctx.arc(g.size * 0.18, -g.size * 0.2, g.size * 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Tiny mouth
          ctx.beginPath();
          ctx.arc(0, -g.size * 0.05, g.size * 0.08, 0, Math.PI);
          ctx.strokeStyle = "rgba(18, 24, 38, 0.9)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        });
      }

      // 2. Birds Flight Loop
      else if (effectId === "birds_flight") {
        // Feathers
        secondaryParticles.forEach((f) => {
          f.y += f.speedY;
          f.x += Math.sin(time + f.y * 0.05) * f.speedX;
          f.rotation += f.rotSpeed;
          if (f.y > height + 20) {
            f.y = -20;
            f.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, f.size * 0.25, f.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Birds
        particles.forEach((b) => {
          b.x += b.speedX;
          b.y += b.speedY;
          b.wingPhase += b.wingSpeed;

          if (b.x > width + 50) {
            b.x = -50;
            b.y = 20 + Math.random() * (height * 0.6);
          }

          ctx.save();
          ctx.translate(b.x, b.y);

          // Calculate wing flap flapping animation
          const wingAngle = Math.sin(b.wingPhase) * (b.size * 0.7);

          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;

          ctx.beginPath();
          // Left wing
          ctx.moveTo(-b.size, wingAngle);
          ctx.quadraticCurveTo(-b.size * 0.5, -b.size * 0.3, 0, 0);
          // Right wing
          ctx.quadraticCurveTo(b.size * 0.5, -b.size * 0.3, b.size, wingAngle);
          ctx.stroke();

          // Bird small beak dot
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // 3. Sakura Petals Loop
      else if (effectId === "sakura_petals") {
        particles.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(time + p.y * 0.02) * 0.5;
          p.rotX += p.rotSpeedX;
          p.rotY += p.rotSpeedY;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) p.x = -20;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotX);
          ctx.scale(Math.cos(p.rotY), 1);

          ctx.fillStyle = p.color;
          ctx.shadowColor = "#f472b6";
          ctx.shadowBlur = 4;
          ctx.globalAlpha = p.opacity;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-p.size, -p.size * 0.5, -p.size * 0.5, -p.size * 1.5, 0, -p.size * 2);
          ctx.bezierCurveTo(p.size * 0.5, -p.size * 1.5, p.size, -p.size * 0.5, 0, 0);
          ctx.fill();

          ctx.restore();
        });
      }

      // 4. Dragon Flame Loop
      else if (effectId === "dragon_flame") {
        // Bottom ambient inferno gradient
        const botGrad = ctx.createLinearGradient(0, height - 80, 0, height);
        botGrad.addColorStop(0, "rgba(234, 88, 12, 0)");
        botGrad.addColorStop(1, "rgba(234, 88, 12, 0.25)");
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - 80, width, 80);

        particles.forEach((f) => {
          f.y += f.speedY;
          f.x += f.speedX + Math.sin(time * 3 + f.y * 0.05) * 0.6;
          f.life -= f.decay;

          if (f.life <= 0 || f.y < -20) {
            f.y = height + 10;
            f.x = Math.random() * width;
            f.life = 1;
            f.size = 4 + Math.random() * 8;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, f.life);
          ctx.fillStyle = f.color;
          ctx.shadowColor = "#ff4500";
          ctx.shadowBlur = 10;

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 5. Cyber Matrix Loop
      else if (effectId === "cyber_matrix") {
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 13px monospace";
        ctx.shadowColor = "#4ade80";
        ctx.shadowBlur = 8;

        particles.forEach((col) => {
          col.y += col.speed;
          col.charTimer++;
          if (col.charTimer % 8 === 0) {
            col.activeChar = col.chars[Math.floor(Math.random() * col.chars.length)];
          }

          if (col.y > height + col.length * 16) {
            col.y = -20;
            col.speed = 1.5 + Math.random() * 3;
          }

          for (let k = 0; k < col.length; k++) {
            const charY = col.y - k * 16;
            if (charY > 0 && charY < height) {
              const alpha = Math.max(0.1, 1 - k / col.length);
              ctx.fillStyle = k === 0 ? "rgba(255, 255, 255, 0.95)" : `rgba(34, 197, 94, ${alpha})`;
              ctx.fillText(col.activeChar, col.x, charY);
            }
          }
        });
      }

      // 6. Cosmic Galaxy Loop
      else if (effectId === "cosmic_galaxy") {
        // Twinkling stars
        secondaryParticles.forEach((s) => {
          s.alpha += s.twinkleSpeed;
          const currentAlpha = 0.3 + 0.7 * Math.abs(Math.sin(s.alpha));

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 4;
          ctx.fill();
        });

        // Shooting stars with glowing tails
        particles.forEach((st) => {
          st.x += st.speedX;
          st.y += st.speedY;

          if (st.x > width * 1.5 || st.y > height + 50) {
            st.x = Math.random() * width * 1.2 - width * 0.4;
            st.y = -50;
          }

          ctx.save();
          const grad = ctx.createLinearGradient(st.x, st.y, st.x - st.speedX * 12, st.y - st.speedY * 12);
          grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          grad.addColorStop(0.3, "rgba(192, 132, 252, 0.7)");
          grad.addColorStop(1, "rgba(192, 132, 252, 0)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.shadowColor = "#c084fc";
          ctx.shadowBlur = 10;

          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x - st.speedX * 12, st.y - st.speedY * 12);
          ctx.stroke();

          // Star head spark
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(st.x, st.y, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // 7. Gold Rain Loop
      else if (effectId === "gold_rain") {
        particles.forEach((coin) => {
          coin.y += coin.speedY;
          coin.x += coin.speedX;
          coin.rotation += coin.rotSpeed;

          if (coin.y > height + 30) {
            coin.y = -30;
            coin.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.rotate(coin.rotation);
          ctx.scale(Math.cos(coin.rotation), 1);

          if (coin.isDiamond) {
            // Sparkling diamond gem
            ctx.fillStyle = "#67e8f9";
            ctx.shadowColor = "#a5f3fc";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -coin.radius);
            ctx.lineTo(coin.radius, 0);
            ctx.lineTo(0, coin.radius);
            ctx.lineTo(-coin.radius, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            // Gold Coin with 🦷 Tooth Symbol
            const goldGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, coin.radius);
            goldGrad.addColorStop(0, "#fef08a");
            goldGrad.addColorStop(0.7, "#eab308");
            goldGrad.addColorStop(1, "#ca8a04");

            ctx.fillStyle = goldGrad;
            ctx.shadowColor = "#facc15";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner gold rim
            ctx.strokeStyle = "#fef9c3";
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Tooth Chat 🦷 gold stamp
            ctx.fillStyle = "#713f12";
            ctx.font = `bold ${Math.floor(coin.radius * 1.1)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🦷", 0, 0);
          }

          ctx.restore();
        });
      }

      // 8. Ocean Jellyfish Loop
      else if (effectId === "ocean_jellyfish") {
        // Bubbles
        secondaryParticles.forEach((b) => {
          b.y -= b.speedY;
          b.x += Math.sin(time * 2 + b.wobble) * 0.5;
          if (b.y < -10) b.y = height + 10;

          ctx.save();
          ctx.strokeStyle = `rgba(165, 243, 252, ${b.alpha})`;
          ctx.lineWidth = 1;
          ctx.fillStyle = `rgba(6, 182, 212, ${b.alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Jellyfish
        particles.forEach((j) => {
          j.y -= j.speedY;
          j.pulsePhase += 0.05;
          if (j.y < -j.size * 2) {
            j.y = height + j.size * 2;
            j.x = 40 + Math.random() * (width - 80);
          }

          const pulse = 1 + 0.15 * Math.sin(j.pulsePhase);

          ctx.save();
          ctx.translate(j.x, j.y);
          ctx.scale(pulse, 1 / pulse);

          // Jelly dome
          ctx.fillStyle = j.color + "0.45)";
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, j.size, Math.PI, 0, false);
          ctx.fill();

          // Tentacles wavy strokes
          ctx.strokeStyle = j.color + "0.65)";
          ctx.lineWidth = 1.5;
          for (let t = -j.size * 0.7; t <= j.size * 0.7; t += j.size * 0.35) {
            ctx.beginPath();
            ctx.moveTo(t, 0);
            ctx.quadraticCurveTo(
              t + Math.sin(time * 3 + t) * 6,
              j.size * 0.8,
              t + Math.sin(time * 2 + t) * 8,
              j.size * 1.6
            );
            ctx.stroke();
          }

          ctx.restore();
        });
      }

      // 9. Electric Storm Loop
      else if (effectId === "electric_storm") {
        if (Math.random() > 0.85) {
          // Lightning bolt flash
          ctx.save();
          ctx.strokeStyle = "#a5b4fc";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#818cf8";
          ctx.shadowBlur = 16;

          let lx = Math.random() * width;
          let ly = 0;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          while (ly < height * 0.7) {
            lx += (Math.random() - 0.5) * 30;
            ly += 15 + Math.random() * 25;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // 10. Autumn Leaves Loop
      else if (effectId === "autumn_leaves") {
        particles.forEach((leaf) => {
          leaf.y += leaf.speedY;
          leaf.x += leaf.speedX + Math.sin(time + leaf.y * 0.03) * 1.2;
          leaf.rotation += leaf.rotSpeed;

          if (leaf.y > height + 20) {
            leaf.y = -20;
            leaf.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(leaf.rotation);
          ctx.fillStyle = leaf.color;
          ctx.shadowColor = "#d97706";
          ctx.shadowBlur = 6;

          ctx.beginPath();
          ctx.moveTo(0, -leaf.size);
          ctx.quadraticCurveTo(leaf.size * 0.8, 0, 0, leaf.size);
          ctx.quadraticCurveTo(-leaf.size * 0.8, 0, 0, -leaf.size);
          ctx.fill();
          ctx.restore();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [effectId, intensity]);

  if (!effectId) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[16px] ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.3))" }}
      />
    </div>
  );
};
