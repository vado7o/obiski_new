import { motion } from 'framer-motion'
import './OnboardingOverlay.css'

export default function OnboardingOverlay({ step, onNext, onDismiss }) {
  if (!step) return null
  return (
    <>
      {/* Затемняющий фон — z-index 90, ниже app-nav (100), шапка остаётся видна */}
      <div className="onb-backdrop" onClick={onDismiss} />

      <motion.div
        key={step}
        className={`onb-tooltip onb-tooltip--${step}`}
        initial={{ opacity: 0, y: -6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <div className="onb-arrow" />

        {step === 'step1' && (
          <>
            <div className="onb-icon">🎤</div>
            <p className="onb-text">
              Запишите свой голос, чтобы подбадривать малыша!
            </p>
            <button className="onb-btn-primary" onClick={onNext}>
              Записать сейчас →
            </button>
            <button className="onb-btn-later" onClick={onDismiss}>
              Записать позже
            </button>
          </>
        )}

        {step === 'step2' && (
          <>
            <p className="onb-text-sm">☝️ Нажмите «Записать свои звуки»</p>
            <button className="onb-btn-later" onClick={onDismiss}>
              Записать позже
            </button>
          </>
        )}
      </motion.div>
    </>
  )
}
