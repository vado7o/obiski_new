import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './AboutModal.css'

export default function AboutModal({ open, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="about-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="about-modal"
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 28 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="about-body">
              <div className="about-icon">❤️</div>
              <h2 className="about-title">Забавное слово с большой историей ❤️</h2>
              <div className="about-text">
                <p>
                  Когда мой сын был совсем маленьким и я предлагал ему позаниматься, он никак не мог выговорить сложное слово «английский». Вместо этого он с улыбкой выдавал: «Давай учить Абиски!»
                </p>
                <p>
                  Тогда же я пытался найти приложение, по которому малыш мог бы учить язык без умения читать — просто на слух и по картинкам. Но ничего удобного не было. Поэтому я решил создать такое приложение сам!
                </p>
                <p>
                  Слово «Абиски» так приросло к нашему дому, что сомнений не было — проект должен называться именно так. Создано с родительской любовью. Пусть и для вашего малыша английский станет простой и любимой игрой!
                </p>
              </div>
            </div>
            <div className="about-footer">
              <button className="about-ok-btn" onClick={onClose}>
                Понятно ✨
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
