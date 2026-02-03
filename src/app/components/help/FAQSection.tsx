'use client';

import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MdExpandMore, MdCode } from 'react-icons/md';
import type { FAQSection as FAQSectionType } from './FAQData';

interface FAQSectionProps {
  section: FAQSectionType;
  /** Controlled open state (from parent) */
  isOpen?: boolean;
  /** Callback when toggle is clicked (for controlled mode) */
  onToggle?: () => void;
  /** @deprecated Use isOpen instead */
  defaultOpen?: boolean;
}

/**
 * FAQSection Component
 *
 * Accordion-style component for displaying FAQ content.
 * Supports both controlled mode (isOpen + onToggle) and uncontrolled mode (defaultOpen).
 * Shows:
 * - Icon and title (always visible)
 * - Summary (always visible when expanded)
 * - Bullet points (always visible when expanded)
 * - Technical details (collapsed by default, toggle to show)
 */
const FAQSection: FC<FAQSectionProps> = ({
  section,
  isOpen: controlledIsOpen,
  onToggle,
  defaultOpen = false,
}) => {
  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const [showTechnical, setShowTechnical] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
    // Reset technical details when closing
    if (isOpen) {
      setShowTechnical(false);
    }
  };

  return (
    <div className="rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-neutral-750 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`faq-content-${section.id}`}
      >
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          {section.icon}
        </span>
        <h2 className="flex-1 text-lg font-bold text-white">{section.title}</h2>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <MdExpandMore className="w-6 h-6 text-neutral-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-content-${section.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Summary */}
              <p className="text-neutral-300 leading-relaxed">{section.summary}</p>

              {/* Bullet points */}
              {section.points && section.points.length > 0 && (
                <ul className="space-y-2">
                  {section.points.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-neutral-300"
                    >
                      <span className="text-primary-400 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Technical details toggle */}
              {section.technicalDetails && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTechnical(!showTechnical)}
                    className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors"
                  >
                    <MdCode className="w-4 h-4" />
                    <span>
                      {showTechnical
                        ? 'Masquer les détails techniques'
                        : 'Voir les détails techniques'}
                    </span>
                    <motion.div
                      animate={{ rotate: showTechnical ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MdExpandMore className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showTechnical && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <pre className="mt-3 p-4 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-400 font-mono whitespace-pre-wrap overflow-x-auto">
                          {section.technicalDetails}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQSection;
