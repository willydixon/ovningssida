// AI-motspelarens instruktioner byggs här på servern, från sidans egna scener och
// improvisationer (public/scenes.js och public/content.js) med samma funktion som sidan
// använder (buildAiSetup i public/ai-partner.js). Webbläsaren skickar bara vilken scen,
// vilken roll och vilket språk. Då kan ingen byta ut instruktionerna i sitt samtal.

import { SCENES_BY_LANG } from '../../public/scenes.js';
import { CONTENT, improvScene } from '../../public/content.js';
import { buildAiSetup } from '../../public/ai-partner.js';
import { t } from '../../public/texts.js';

export const SETUP_LANGS = ['sv', 'en'];

// En scen eller en improvisation på språket, eller null om den inte finns.
function sceneFor(id, lang) {
  const scene = SCENES_BY_LANG[lang].find((s) => s.id === id);
  if (scene) return scene;
  const improv = CONTENT[lang].improvs.find((s) => s.id === id);
  return improv ? improvScene(improv, { you: t('daily_you', {}, lang) }) : null;
}

// Det AI-motspelaren behöver för scenen när användaren spelar rollen userRole:
// { sceneId, aiRole, prompt, language, firstMessage }, eller null om något inte stämmer.
export function setupFor(sceneId, userRole, lang) {
  if (!SETUP_LANGS.includes(lang) || typeof sceneId !== 'string' || typeof userRole !== 'string') return null;
  const scene = sceneFor(sceneId, lang);
  if (!scene || !Array.isArray(scene.roller) || scene.roller.length !== 2) return null;
  if (scene.typ === 'improv' && userRole !== scene.roller[0].id) return null; // i improvisationen spelar du alltid dig själv
  const aiRole = scene.roller.find((r) => r.id !== userRole);
  if (!aiRole || !scene.roller.some((r) => r.id === userRole)) return null;
  const { prompt, language, firstMessage } = buildAiSetup(scene, userRole, lang);
  return { sceneId: scene.id, aiRole: aiRole.id, prompt, language, firstMessage };
}
