import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import fr from './locales/fr';
import de from './locales/de';
import es from './locales/es';
import ru from './locales/ru';
import it from './locales/it';
import pt from './locales/pt';

export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'it' | 'pt';

export const languages: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
};

const translations: Record<Language, any> = {
  en,
  zh,
  ja,
  ko,
  fr,
  de,
  es,
  ru,
  it,
  pt
};

// 导出支持的语言列表供外部使用
export const supportedLanguages: Language[] = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'it', 'pt'];

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

export function setLanguage(lang: Language) {
  // 这个方法保留是为了兼容性，但不再执行任何操作
  // 不再保存到localStorage，仅使用自动检测
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // 自动检测浏览器语言
  // 优先检查 navigator.languages 数组（按优先级排序的语言列表）
  // 这个数组通常包含系统语言和浏览器语言设置
  const languages = navigator.languages || [navigator.language];
  
  // 遍历语言列表，找到第一个支持的语言
  for (const lang of languages) {
    const langCode = lang.toLowerCase().split('-')[0];
    // 使用更严格的检查：确保语言代码在支持的语言列表中
    if (supportedLanguages.includes(langCode as Language)) {
      const detectedLang = langCode as Language;
      console.log(`[i18n] 检测到语言: ${lang} -> ${detectedLang}`);
      return detectedLang;
    }
  }
  
  // 如果没有匹配的，尝试 navigator.language
  const browserLang = navigator.language.toLowerCase();
  const langCode = browserLang.split('-')[0];
  
  if (supportedLanguages.includes(langCode as Language)) {
    const detectedLang = langCode as Language;
    console.log(`[i18n] 使用 navigator.language: ${navigator.language} -> ${detectedLang}`);
    return detectedLang;
  }
  
  // 默认英语（如果浏览器语言不在支持列表中）
  console.log(`[i18n] 未检测到支持的语言，使用默认: en (navigator.language=${navigator.language}, navigator.languages=${languages.join(', ')})`);
  return 'en';
}

