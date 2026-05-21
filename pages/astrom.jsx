import { useEffect, useRef, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedVideo } from '@cloudinary/react';
import Hover from "react-3d-hover";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
});

const HoverOverlay = ({ title, subtitle }) => (
  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
    <div className="p-2 sm:p-3 md:p-4 h-full flex flex-col justify-center">
      <h3 className="uppercase text-white text-lg sm:tracking-normal lg:tracking-[4px] sm:text-[12px] md:text-[16px] font-medium mb-0.5 sm:mb-1 font-omiofont3 line-clamp-1">
        {title}
      </h3>
      <p className="text-gray-300 uppercase lg:tracking-[2px] sm:tracking-normal text-[10px] sm:text-[8px] md:text-[10px] font-omiofont3 line-clamp-1">
        {subtitle}
      </p>
    </div>
  </div>
);

const ProjectCard = ({ project, onClick }) => {
  const thumbnail = project.thumbnail || project.poster || project.media?.[0] || "/assets/works/web/webi.webp";

  return (
    <motion.div
      className="group cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, y: "100vh" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100vh" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <Hover scale={1.03} perspective={1000} speed={500}>
        <div className="relative overflow-hidden opacity-100 group-hover:opacity-90 transition-all duration-300 ease-in-out">
          <Image
            src={thumbnail}
            alt={project.title}
            placeholder="blur"
            width={800}
            height={600}
            className="w-full object-cover"
            quality={100}
          />
          <HoverOverlay title={project.title} subtitle={project.subtitle} />
        </div>
      </Hover>
    </motion.div>
  );
};

const AstromLayout = ({ project, otherProjects = [], onProjectSelect, onBack }) => {
  const videoRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProjects = otherProjects.slice(startIndex, endIndex);

  const handleCardClick = (otherProject) => {
    onProjectSelect?.(otherProject.id);
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * itemsPerPage < otherProjects.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (project?.id) {
      window.scrollTo(0, 0);
    }
  }, [project?.id]);

  useEffect(() => {
    if (videoRef.current && project?.video?.publicId) {
      videoRef.current.videoRef.current.play();
    }
  }, [project]);

  useEffect(() => {
    const videoElement = videoRef.current?.videoRef.current;

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
      }
    };
  }, []);

  const ANIMATION_CONFIG = useMemo(
    () => ({
      fadeUp: {
        "data-aos": "fade-in",
        "data-aos-easing": "ease-in-out",
        "data-aos-offset": "0",
        "data-aos-duration": "1000",
        "data-aos-delay": "0",
      },
    }),
    []
  );

  if (!project || !project.video?.publicId) {
    return null;
  }

  return (
    <motion.main
      key={project.id}
      className="min-h-screen text-amiya relative"
      initial={{ opacity: 0, y: "100vh" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "-100vh" }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      <div className="lg:mx-10 max-w-screen px-4 sm:mx-4 sm:px-6 lg:px-4">
        <section className="mb-18">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 py-16 text-center flex-1 justify-center">
              <p className="uppercase font-omiofont3 mb-4 text-[12px] tracking-[0.3em] text-amiya sm:text-[18px]">
                {project.subtitle}
              </p>
              <h1 className="uppercase font-omiofont3 text-2xl font-bold tracking-[8px] sm:text-xl md:text-2xl lg:text-4xl">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <AdvancedVideo
                ref={videoRef}
                cldVid={cld.video(project.video.publicId).delivery('f_auto,q_auto:best').format('auto')}
                autoPlay
                muted
                loop
                controls
                className="h-full w-full object-cover aspect-video"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        </section>

        <section className="mb-16 mt-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-start-2 lg:col-span-10 space-y-12 text-center">
              <div className="space-y-4">
                <p className="text-gray-400 font-omiofont3" {...ANIMATION_CONFIG.fadeUp}>
                  CLIENT: {project.client}
                </p>
                <p className="text-gray-400" {...ANIMATION_CONFIG.fadeUp}>
                  ROLE: {project.role}
                </p>
              </div>

              <div className="space-y-8">
                <p className="text-[2.5rem] font-bold leading-tight sm:text-5xl md:text-6xl" {...ANIMATION_CONFIG.fadeUp}>
                  {project.stats}
                </p>
                <p className="text-lg font-omiofont3 text-amiya" {...ANIMATION_CONFIG.fadeUp}>
                  {project.description}
                </p>
                <p className="text-gray-300 font-omiofont3 leading-relaxed" {...ANIMATION_CONFIG.fadeUp}>
                  {project.quote}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="mb-8 text-center text-sm tracking-[0.3em] text-amiya" {...ANIMATION_CONFIG.fadeUp}>
                [ SELECTED FRAMES | CONCEPT ART | MEDIA ]
              </h2>
              <div className="relative w-full overflow-hidden grid gap-y-12">
                {(project.media || []).map((media, index) => (
                  <Image
                    key={index}
                    src={media}
                    alt={`Media ${index + 1}`}
                    width={1920}
                    height={1080}
                    className="object-cover"
                    {...ANIMATION_CONFIG.fadeUp}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="mb-8 text-center text-sm tracking-[0.3em] text-amiya" {...ANIMATION_CONFIG.fadeUp}>
                [ OTHER WORKS ]
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-8">
                {displayedProjects.map((otherProject) => (
                  <ProjectCard
                    key={otherProject.id}
                    project={otherProject}
                    onClick={() => handleCardClick(otherProject)}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-8">
                <button
                  className="uppercase text-sm tracking-[0.3em] hover:text-gray-400 transition-colors flex items-center gap-2 mr-4"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <FaArrowLeft />
                  PREV
                </button>
                <button
                  className="uppercase text-sm tracking-[0.3em] hover:text-gray-400 transition-colors flex items-center gap-2"
                  onClick={handleNextPage}
                  disabled={(currentPage + 1) * itemsPerPage >= otherProjects.length}
                >
                  NEXT
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-0">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 p-2">
              <div className="flex justify-center items-center text-amiya">
                <button
                  className="uppercase text-sm tracking-[0.3em] hover:text-gray-400 transition-colors flex items-center gap-2"
                  onClick={onBack}
                >
                  BACK TO WORK
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.main>
  );
};

export default AstromLayout;
