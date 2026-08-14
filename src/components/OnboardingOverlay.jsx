import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import './OnboardingOverlay.css'

export default function OnboardingOverlay({ onDone, onDismiss }) {
  return createPortal(
    <div className="onb-backdrop" onClick={onDismiss}>
      <motion.div
        className="onb-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <div className="onb-icon">🎤</div>
        <p className="onb-text">
          Запишите свой голос, чтобы подбадривать малыша!<br/>
          Вашему малышу ооочень это понравится!
        </p>
        <button className="onb-btn-primary" onClick={onDone}>
          Записать сейчас →
        </button>
        <button className="onb-btn-later" onClick={onDismiss}>
          Записать позже
        </button>
      </motion.div>
    </div>,
    document.body
  )
}
