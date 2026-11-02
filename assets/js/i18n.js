const I18N_DIR = './assets/data/i18n';
const LANGUAGE_STORAGE_KEY = 'nangman_language';
const SUPPORTED_LANGUAGES = ['ko', 'en'];
const DEFAULT_LANGUAGE = 'ko';

let currentLanguage = DEFAULT_LANGUAGE;
let dictionaries = {};

async function loadDictionaries() {
  const entries = await Promise.all(
    SUPPORTED_LANGUAGES.map(async language => [language, await loadJson(`${I18N_DIR}/${language}.json`)])
  );
  dictionaries = Object.fromEntries(entries);
}

function savedLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
}

function initialLanguage() {
  const saved = savedLanguage();
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => node?.[part], dictionary);
}

function t(key, params = {}) {
  const template = lookup(dictionaries[currentLanguage], key) ?? lookup(dictionaries[DEFAULT_LANGUAGE], key) ?? key;
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => params[name] ?? placeholder);
}

function localized(text) {
  return text[currentLanguage] || text[DEFAULT_LANGUAGE] || '';
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  document.title = t('page.title');
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.innerHTML = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(element => {
    element.alt = t(element.dataset.i18nAlt);
  });
  SUPPORTED_LANGUAGES.forEach(language => {
    const button = document.getElementById('lang-btn-' + language);
    if (button) button.classList.toggle('active', language === currentLanguage);
  });
}
