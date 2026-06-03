type Messages = Record<string, string>;
type Translations = Record<string, Messages>;

let _locale = "en";
const _translations: Translations = {};

export function setupI18n(locale: string, translations: Translations) {
  _locale = locale;
  Object.assign(_translations, translations);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const lang =
    _translations[_locale] ??
    _translations[_locale.split("-")[0]] ??
    _translations["en"] ??
    {};

  let message = lang[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replaceAll(`{{${k}}}`, String(v));
    }
  }

  return message;
}

export const translations: Translations = {
  en: {
    "raffle.title": "Raffle Configurator",
    "raffle.already_raffled": "Already Raffled",
    "raffle.ready": "Ready to raffle from {{count}} name",
    "raffle.ready_plural": "Ready to raffle from {{count}} names",
    "raffle.no_eligible": "No eligible names to raffle!",

    "action.start": "Start",
    "action.raffle": "Raffle",
    "action.reset": "Reset",
    "action.exit": "Exit",
    "action.save": "Save",
    "action.choose": "Choose",

    "list.section": "List",
    "list.placeholder": "Create list...",
    "list.no_list": "No list",
    "list.create": "+ Create list",
    "list.name_placeholder": "List name...",
    "list.none_selected": "None selected",

    "settings.appearance": "Appearance",
    "settings.font": "Font",
    "settings.font_size": "Font Size",
    "settings.animation": "Animation",
    "settings.font_default": "System default",
    "settings.font_not_found": "No fonts found",

    "settings.anim.slots": "Slots",
    "settings.anim.wheel": "Wheel",
    "settings.anim.picker": "Picker",

    "settings.background": "Background",
    "settings.bg.type": "Type",
    "settings.bg.default": "Default (theme)",
    "settings.bg.transparent": "Transparent",
    "settings.bg.card": "Card",
    "settings.bg.media": "Image / Video",

    "participants.label": "Participants (one per line)",
    "participants.placeholder": "One name per line...",
    "participants.hint": "Paste or type names. Duplicates and repeats will be handled by the settings above.",
    "participants.remove_duplicates": "Remove duplicate names",
    "participants.no_repeat": "Do not repeat names",

    "screen.current_raffle": "Current Raffle",
    "screen.congratulations": "🎉 Congratulations!",
    "screen.winner_congratulations": "🎉 {{name}} — Congratulations!",
  },

  "pt-BR": {
    "raffle.title": "Configurador de Sorteio",
    "raffle.already_raffled": "Já Sorteados",
    "raffle.ready": "Pronto para sortear entre {{count}} nome",
    "raffle.ready_plural": "Pronto para sortear entre {{count}} nomes",
    "raffle.no_eligible": "Nenhum nome elegível para sortear!",

    "action.start": "Iniciar",
    "action.raffle": "Sortear",
    "action.reset": "Reiniciar",
    "action.exit": "Sair",
    "action.save": "Salvar",
    "action.choose": "Escolher",

    "list.section": "Lista",
    "list.placeholder": "Criar lista...",
    "list.no_list": "Sem lista",
    "list.create": "+ Criar lista",
    "list.name_placeholder": "Nome da lista...",
    "list.none_selected": "Nenhum selecionado",

    "settings.appearance": "Aparência",
    "settings.font": "Fonte",
    "settings.font_size": "Tamanho",
    "settings.animation": "Animação",
    "settings.font_default": "Padrão do sistema",
    "settings.font_not_found": "Nenhuma fonte encontrada",

    "settings.anim.slots": "Slots",
    "settings.anim.wheel": "Roda",
    "settings.anim.picker": "Seletor",

    "settings.background": "Fundo",
    "settings.bg.type": "Tipo",
    "settings.bg.default": "Padrão (tema)",
    "settings.bg.transparent": "Transparente",
    "settings.bg.card": "Card",
    "settings.bg.media": "Imagem / Vídeo",

    "participants.label": "Participantes (um por linha)",
    "participants.placeholder": "Um nome por linha...",
    "participants.hint": "Cole ou digite os nomes. Duplicatas e repetições serão tratadas pelas configurações acima.",
    "participants.remove_duplicates": "Remover nomes duplicados",
    "participants.no_repeat": "Não repetir nomes",

    "screen.current_raffle": "Sorteio Atual",
    "screen.congratulations": "🎉 Parabéns!",
    "screen.winner_congratulations": "🎉 {{name}} — Parabéns!",
  },
};
