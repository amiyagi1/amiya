import { memo, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import infoImg from "../public/assets/works/About.webp";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaEnvelope,
  FaFacebook,
  FaYoutube,
  FaDiscord,
  FaBehance,
} from "react-icons/fa";

// ← Removed local Gyroid import — global one in _app.js handles it

const ANIMATION_CONFIG = {
  fadeUp: {
    "data-aos": "fade-in",
    "data-aos-easing": "ease-in-out",
    "data-aos-offset": "0",
    "data-aos-duration": "1000",
    "data-aos-delay": "0",
  },
  zoomIn: {
    "data-aos": "zoom-in",
    "data-aos-duration": "1000",
    "data-aos-delay": "200",
  },
  zoomInDelayed: {
    "data-aos": "zoom-in",
    "data-aos-duration": "1000",
    "data-aos-delay": "400",
  },
};

const TitleSection = memo(() => (
  <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20 relative">
    <h1
      className="text-5xl sm:text-7xl md:text-[10vw] font-light tracking-wider text-amiya/30 font-omiofont3"
      {...ANIMATION_CONFIG.zoomIn}
    >
      INFO
    </h1>
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="text-[8px] xs:text-[10px] sm:text-sm tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.5em] md:tracking-[0.75em] text-gray-400 font-omiofont2 px-4 whitespace-nowrap"
        {...ANIMATION_CONFIG.zoomInDelayed}
      >
        BIO | RESUME | AWARDS | CONTACT
      </div>
    </div>
  </div>
));
TitleSection.displayName = "TitleSection";

const ImageSection = memo(() => (
  <div className="mt-8 w-full relative" style={{ paddingTop: "56.25%" }}>
    <div className="absolute inset-0">
      <Image
        src={infoImg}
        alt="Description of the image"
        fill
        className="rounded-lg object-cover"
      />
    </div>
  </div>
));
ImageSection.displayName = "ImageSection";

const Bio = memo(() => (
  <div className="mt-8 text-gray-400">
    <h2
      className="mb-8 text-center text-sm tracking-[0.3em] text-amiya"
      {...ANIMATION_CONFIG.fadeUp}
    >
      [BIO]
    </h2>
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
      {[
        "Amiya is an Award-winning Creative Director...",
        "Amiya has worked with some of the top teams and brands...",
        "His work has been recognized with Webbys, FWAs, Awwwards...",
        "As a developer, Amiya's expertise includes React, Vue, javascript...",
        "For video processing he has scripting in ffMPEG, Blender...",
        "Amiya is also a regular writer for Net Magazine...",
        "'The Art of Shaders', his latest full-length programming book...",
        "Amiya's professional artwork explores a wide range of fractal works...",
        "Contact me for availability for freelance work...",
      ].map((text, index) => (
        <p
          key={index}
          className="text-sm sm:text-base md:text-lg leading-relaxed"
          {...ANIMATION_CONFIG.fadeUp}
        >
          {text}
        </p>
      ))}
    </div>
  </div>
));
Bio.displayName = "Bio";

const AwardsSection = memo(() => {
  const awards = [
    "/assets/works/ai/ai.webp",
    ...Array.from({ length: 16 }, (_, index) => `/assets/works/ai/ai${index + 1}.webp`),
  ];
  return (
    <div className="mt-8">
      <h2 className="mb-8 text-center text-sm tracking-[0.3em] text-amiya">
        [ AWARDS | RECOGNITION ]
      </h2>
   
    </div>
  );
});
AwardsSection.displayName = "AwardsSection";

const Info = memo(() => {
  // ── SET GYROID PRESET ────────────────────────────────────────────────────
  useEffect(() => {
    window.__gyroidPreset = 'info';
    window.__gyroidSetPreset?.('info');
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const socialLinks = [
    { id: 5, name: "Email",     url: "mailto:youremail@example.com",        icon: <FaEnvelope  className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 2, name: "LinkedIn",  url: "https://linkedin.com/in/yourusername", icon: <FaLinkedin  className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 9, name: "Behance",   url: "https://behance.com/yourusername",     icon: <FaBehance   className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 1, name: "GitHub",    url: "https://github.com/yourusername",      icon: <FaGithub    className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 3, name: "Twitter",   url: "https://twitter.com/yourusername",     icon: <FaTwitter   className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 4, name: "Instagram", url: "https://instagram.com/yourusername",   icon: <FaInstagram className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 6, name: "Facebook",  url: "https://facebook.com/yourusername",    icon: <FaFacebook  className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 7, name: "YouTube",   url: "https://youtube.com/yourusername",     icon: <FaYoutube   className="w-6 h-6 sm:w-8 sm:h-8" /> },
    { id: 8, name: "Discord",   url: "https://discord.com/yourusername",     icon: <FaDiscord   className="w-6 h-6 sm:w-8 sm:h-8" /> },
  ];

  return (
    <div className="text-center mb-12 mt-8 sm:mt-10 md:mt-14 lg:mt-16 xl:mt-20 sm:mb-16 md:mb-24 relative">
      {/* ← No <Gyroid> here — removed */}
      <motion.div
        className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16"
        initial={{ opacity: 0, y: "100vh" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100vh" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <TitleSection />
        <ImageSection />
        <Bio />
        <AwardsSection />
        <div className="mt-8 text-center">
          <h2 className="mb-8 text-center text-sm tracking-[0.3em] text-amiya">
            [ BOOKING | CONTACT | CONNECT ]
          </h2>
          <div className="flex flex-wrap justify-center gap-2 lg:gap-16 sm:gap-8 md:gap-8">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-amiya transition-colors duration-300 flex items-center justify-center"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

Info.displayName = "Info";
export default Info;