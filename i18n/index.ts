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
  // 只检查 navigator.language（用户的首选语言），不遍历整个 languages 数组
  // 这样可以避免匹配到次要语言（如中文）当主要语言不在支持列表中时
  const primaryLanguage = navigator.language || 'en';
  const primaryLangCode = primaryLanguage.toLowerCase().split('-')[0].trim();
  
  console.log(`[i18n] 检测语言 - navigator.language: "${primaryLanguage}" -> 代码: "${primaryLangCode}"`);
  
  // 只检查主要语言，如果在支持列表中则使用，否则默认英语
  if (primaryLangCode && supportedLanguages.includes(primaryLangCode as Language)) {
    const detectedLang = primaryLangCode as Language;
    console.log(`[i18n] ✓ 检测到支持的语言: ${primaryLanguage} -> ${detectedLang}`);
    return detectedLang;
  }
  
  // 默认英语（如果主要语言不在支持列表中）
  console.log(`[i18n] ✗ 主要语言不在支持列表中，使用默认: en (navigator.language="${primaryLanguage}")`);
  return 'en';
}

