import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import logoSrc from "../assets/MediVision Logo.png";

const faqItems = [
  {
    question: "What is MediVision?",
    answer: (
      <>
        <strong>MediVision</strong> is a <strong>Hospital Visual Analytics Dashboard</strong> designed to support{" "}
        <strong>Real-Time Patient Flow &amp; Emergency Care Management</strong>. It provides{" "}
        <strong>Healthcare Staff</strong> with <strong>Immediate Access</strong> to{" "}
        <strong>Patient Status, Vital Signs, Triage Priority</strong>, and{" "}
        <strong>Treatment Journey</strong>, helping improve <strong>Decision-Making</strong>,{" "}
        <strong>Reduce Waiting Times</strong>, and enhance <strong>Overall Hospital Efficiency</strong>.
      </>
    ),
  },
  {
    question: "What Information does MediVision Display?",
    answer: (
      <>
        The <strong>Dashboard</strong> shows <strong>Patient Status, Vital Signs, Triage Priority,
        Treatment Progress</strong>, and <strong>Bed Availability</strong> in <strong>Real-Time</strong>.
      </>
    ),
  },
  {
    question: "How does MediVision Support Emergency Care?",
    answer: (
      <>
        By providing <strong>Real-Time Visibility</strong> of{" "}
        <strong>Patient Conditions &amp; Hospital Flow</strong>, <strong>MediVision</strong> helps{" "}
        <strong>Staff</strong> prioritise <strong>Urgent Cases &amp; Reduce Treatment Delays</strong>.
      </>
    ),
  },
  {
    question: "What Type of Patients Are Shown?",
    answer: (
      <>
        The <strong>Dashboard Displays Patients</strong> currently in the{" "}
        <strong>Emergency Department</strong> or under <strong>Active Hospital Care</strong>.
      </>
    ),
  },
  {
    question: "How Often is the Data Updated?",
    answer: (
      <>
        <strong>Patient Data</strong> is <strong>Updated</strong> in <strong>Real Time</strong> or
        whenever <strong>New Information</strong> is <strong>Entered</strong> by <strong>Staff</strong>.
      </>
    ),
  },
];

export default function FAQOverlay({ isOpen, onClose }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!isOpen) return null;

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4 py-6"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-3 mb-4 pb-2">
          <img src={logoSrc} alt="MediVision" className="w-10 h-10 object-contain" />
          <div className="w-px h-8 bg-gray-300" />
          <h2 className="font-semibold text-[#224e8d]" style={{ fontSize: "26px" }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqItems.map((item, index) => {
            const isExpanded = openIndex === index;

            return (
              <div key={item.question} className="rounded-xl bg-gray-200 shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => toggleItem(index)}
                >
                  <span className="font-semibold text-gray-900" style={{ fontSize: "16px" }}>
                    {item.question}
                  </span>
                  <span className="ml-4 rounded-full bg-[#214f8f] p-1 text-white">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 text-gray-800 text-justify" style={{ fontSize: "14px", lineHeight: "1.55" }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#214f8f] px-12 py-2 text-white hover:bg-[#1b4278] transition-colors"
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
