import { type Variants, type Transition, type UseInViewOptions } from "framer-motion";

export const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 350, damping: 25 },
  springSnap: { type: "spring" as const, stiffness: 400, damping: 20 },
  springSoft: { type: "spring" as const, stiffness: 280, damping: 22 },
};

export const durations = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  reveal: 0.7,
  stagger: 0.1,
};

export const viewportOptions: UseInViewOptions = {
  once: true,
  margin: "-80px",
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 60, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easings.out },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easings.out },
  },
  hover: {
    y: -6,
    scale: 1.01,
    borderColor: "rgba(201,162,74,0.35)",
    boxShadow: "0 20px 40px rgba(201,162,74,0.08)",
    transition: { type: "spring", stiffness: 350, damping: 22 },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easings.out },
  },
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easings.out },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easings.out },
  },
};

export const buttonVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -2, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.97, y: 0, transition: { type: "spring", stiffness: 500, damping: 15 } },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const navVariants: Variants = {
  hidden: { y: -80, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.9, ease: easings.out, delay: 0.1 } },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15 } },
};

export const sidebarVariants: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { x: "-100%", transition: { duration: 0.25, ease: "easeIn" } },
};

export const accordionVariants: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded: { height: "auto", opacity: 1, overflow: "hidden", transition: { duration: 0.35, ease: easings.inOut } },
};

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const iconHoverVariants: Variants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 5, scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 12 } },
};

export const imageRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 1.05, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: easings.out },
  },
};

export const linkUnderlineVariants: Variants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

export const counterTransition: Transition = {
  duration: 2,
  ease: easings.out,
};
