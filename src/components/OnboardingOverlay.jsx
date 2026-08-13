import { motion } from 'framer-motion'
import './OnboardingOverlay.css'

export default function OnboardingOverlay({ step, onDone, onDismiss }) {
  if (!step) return null
  return (
    <>
      {/* Backdrop покрывает контент под шапкой (z-index 90, ниже app-nav 100) */}
      <div className="onb-backdrop" onClick={onDismiss} />

      {/* Тултип по центру. x/y через framer-motion, чтобы не конфликтовать со scale */}
      <motion.div
        key={step}
        className="onb-tooltip"
        initial={{ opacity: 0, scale: 0.92, x: '-50%', y: '-50%' }}
        animate={{ opacity: 1, scale: 1,   x: '-50%', y: '-50%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <div className="onb-icon">🎤</div>
        <p className="onb-text">
          Запишите свой голос, чтобы подбадривать малыша!
        </p>
        <button className="onb-btn-primary" onClick={onDone}>
          Записать сейчас →
        </button>
        <button className="onb-btn-later" onClick={onDismiss}>
          Записать позже
        </button>
      </motion.div>
    </>
  )
}
