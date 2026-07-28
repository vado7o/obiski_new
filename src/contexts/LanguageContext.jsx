import { createContext, useContext } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)

const lang = 'ru'
const t = translations.ru

export function LanguageProvider({ children }) {
  return (
    <LanguageContext.Provider value={{ lang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
