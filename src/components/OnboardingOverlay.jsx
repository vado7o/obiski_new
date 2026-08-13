import { useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './OnboardingOverlay.css'

export default function OnboardingOverlay({ step, onNext, onDismiss, menuBtnRef, recordBtnRef }) {
  const [menuPos, setMenuPos] = useState(null)
  const [recordPos, setRecordPos] = useState(null)

  // Измеряем позиции элементов при каждом шаге
  useLayoutEffect(() => {
    if (!step) return
    function measure() {
      if (menuBtnRef?.current) {
        setMenuPos(menuBtnRef.current.getBoundingClientRect())
      }
      if (recordBtnRef?.current) {
        setRecordPos(recordBtnRef.current.getBoundingClientRect())
      }
    }
    measure()
    // Повторяем через короткий таймаут — дропдаун мог ещё не раскрыться
    const t = setTimeout(measure, 80)
    return () => clearTimeout(t)
  }, [step, menuBtnRef, recordBtnRef])

  if (!step) return null

  // --- Шаг 1: тултип под кнопкой «Меню», чуть правее ---
  const step1Style = menuPos
    ? {
        top: menuPos.bottom + 12,
        right: window.innerWidth - menuPos.right,
      }
    : { top: 72, right: 16 }

  // --- Шаг 2: тултип ЛЕВЕЕ дропдауна, на уровне строки «Записать» ---
  const step2Style = recordPos
    ? {
        top: recordPos.top,
        right: window.innerWidth - recordPos.left + 10,
      }
    : { top: 200, right: 260 }

  const tooltipStyle = step === 'step1' ? step1Style : step2Style

  return (
    <>
      {/* Полный backdrop поверх всего */}
      <div className="onb-backdrop" onClick={onDismiss} />

      <motion.div
        key={step}
        className={`onb-tooltip onb-tooltip--${step}`}
        style={tooltipStyle}
        initial={{ opacity: 0, y: -6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        {step === 'step1' && (
          <>
            {/* Стрелка вверх-вправо — к кнопке Меню */}
            <div className="onb-arrow onb-arrow--up-right" />
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
            {/* Стрелка вправо — к строке «Записать свои звуки» */}
            <div className="onb-arrow onb-arrow--right" />
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
