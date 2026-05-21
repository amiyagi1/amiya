// pages/work.js  (PortfolioPage)
// Removed the local <Gyroid> instance — the global one in _app.js handles it.
// _app.js automatically calls setPage('work') when this route is active.

import { memo, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Hover from "react-3d-hover";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import AstromLayout from "./astrom";
import projectData from "../public/astrom.json";

import webiImg from "../public/assets/works/web/webi.webp";
import ethpImg from "../public/assets/works/eth/ethp.webp";
import cybrImg from "../public/assets/works/cyber/cyber.webp";
import roomImg from "../public/assets/works/room/room.webp";
import typeImg from "../public/assets/works/type.webp";

const ANIMATION_CONFIG = {
  fadeUp: {
    "data-aos": "fade-up",
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

const portfolioData = [
  { id: 1, title: "3D Illustration", subtitle: "Creative | Visualization | 3D", backgroundImg: webiImg },
  { id: 2, title: "Ether Portal", subtitle: "Digital Experience | NFT | Web3", backgroundImg: ethpImg },
  { id: 3, title: "Cyberpunk", subtitle: "Futuristic Design", backgroundImg: cybrImg },
  { id: 4, title: "Room", subtitle: "Interior Visualization", backgroundImg: roomImg },
  { id: 5, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
  { id: 6, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
  { id: 7, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
  { id: 8, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
  { id: 9, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
  { id: 10, title: "Typo", subtitle: "36 Days of Type", backgroundImg: typeImg },
];

const HoverOverlay = memo(({ title, subtitle }) => (
  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
    <div className="p-2 sm:p-3 md:p-4 h-full flex flex-col justify-center">
      <h3 className="uppercase text-white text-lg sm:tracking-normal lg:tracking-[8px] sm:text-[18px] md:text-xl font-medium mb-0.5 sm:mb-1 font-omiofont3 line-clamp-1">
        {title}
      </h3>
      <p className="text-gray-300 uppercase lg:tracking-[4px] sm:tracking-normal text-[12px] sm:text-[12px] md:text-[12px] font-omiofont3 line-clamp-1">
        {subtitle}
      </p>
    </div>
  </div>
));

const ProjectCard = memo(({ project, onClick }) => (
  <motion.div
    className="group cursor-pointer"
    onClick={() => onClick(project)}
    initial={{ opacity: 0, y: "100vh" }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: "100vh" }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
  >
    <Hover scale={1.03} perspective={1000} speed={500}>
      <div className="relative overflow-hidden opacity-100 group-hover:opacity-90 transition-all duration-300 ease-in-out">
        <Image
          src={project.backgroundImg}
          alt={project.title}
          placeholder="blur"
          width={800}
          height={600}
          className="w-full object-cover"
          quality={100}
          {...ANIMATION_CONFIG.fadeUp}
        />
        <HoverOverlay title={project.title} subtitle={project.subtitle} />
      </div>
    </Hover>
  </motion.div>
));

const TitleSection = memo(() => (
  <motion.div
    className="text-center mb-12 mt-8 sm:mt-10 md:mt-14 lg:mt-16 xl:mt-20 sm:mb-16 md:mb-24 relative"
    initial={{ opacity: 0, y: "100vh" }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: "100vh" }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
  >
    <h1
      className="text-5xl sm:text-7xl md:text-[10vw] font-light tracking-wider text-amiya/30 font-omiofont3"
      {...ANIMATION_CONFIG.zoomIn}
    >
      WORK
    </h1>
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="text-[8px] xs:text-[10px] sm:text-sm tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.5em] md:tracking-[0.75em] text-gray-400 font-omiofont2 px-4 whitespace-nowrap"
        {...ANIMATION_CONFIG.zoomInDelayed}
      >
        PROJECTS | COLLABORATIONS | EXPLORATIONS
      </div>
    </div>
  </motion.div>
));

HoverOverlay.displayName = "HoverOverlay";
ProjectCard.displayName = "ProjectCard";
TitleSection.displayName = "TitleSection";

const PortfolioPage = () => {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState(null);
  

  useEffect(() => {
    const handleResize = () => {
      if (selectedProject && window.innerWidth < 768) window.scrollTo(0, 0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedProject]);

  useEffect(() => {
    if (!router.isReady) return;
    const projectId = Number(router.query.project);
    if (!projectId) { setSelectedProject(null); return; }
    const astromProject = projectData.find((p) => p.id === projectId);
    setSelectedProject(astromProject || null);
  }, [router.isReady, router.query.project]);

  const handleCardClick = (project) => {
    const astromProject = projectData.find((p) => p.id === project.id);
    if (!astromProject) return;
    setSelectedProject(astromProject);
    router.push({ pathname: router.pathname, query: { project: astromProject.id } }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProjectChange = (projectId) => {
    const astromProject = projectData.find((p) => p.id === projectId);
    if (!astromProject) return;
    setSelectedProject(astromProject);
    router.push({ pathname: router.pathname, query: { project: projectId } }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToWork = () => {
    setSelectedProject(null);
    router.push({ pathname: router.pathname }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const otherProjects = selectedProject
    ? portfolioData.filter((p) => p.id !== selectedProject.id).map((p) => ({ ...p, thumbnail: p.backgroundImg }))
    : [];

  return (
    // No <Gyroid> here — the global one in _app.js is already rendering
    <div className="min-h-screen text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <AnimatePresence mode="wait">
          {selectedProject ? (
            <motion.div
              key="project-details"
              initial={{ opacity: 0, y: "-100vh" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-100vh" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <AstromLayout
                key={selectedProject.id}
                project={selectedProject}
                otherProjects={otherProjects}
                onProjectSelect={handleProjectChange}
                onBack={handleBackToWork}
              />
            </motion.div>
          ) : (
            <motion.div
              key="portfolio-cards"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100vh" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <TitleSection />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-14 mx-2 sm:mx-6 md:mx-14">
                {portfolioData.map((project) => (
                  <ProjectCard key={project.id} project={project} onClick={handleCardClick} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

PortfolioPage.displayName = "PortfolioPage";
export default PortfolioPage;