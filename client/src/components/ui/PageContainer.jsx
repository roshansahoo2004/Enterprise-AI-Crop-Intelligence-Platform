import { motion } from 'framer-motion';

/**
 * Phase 12 - Step 2: PageContainer Component
 * Reusable Framer Motion wrapper for page entrance animations and consistent spacing.
 */
export const PageContainer = ({ children, className = '' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`space-y-8 pb-12 animate-fade-in ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageContainer;
