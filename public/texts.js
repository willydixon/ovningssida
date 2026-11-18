// Alla texter i övningsappen, samlade på ett ställe.
//
// Sidan visar texterna exakt som de står här. {namn} i en text byts mot ett
// värde när texten visas, till exempel {url} mot sidans adress.
//
// Efter en ändring här: kör `node tools/render-pages.mjs`, som skriver om
// public/index.html och public/manifest.json. Testerna kontrollerar att det är gjort.
//
// Informationssidorna (om.html, ai.html, integritet.html, villkor.html och
// kontakt.html) är egna filer och ligger inte här. Scenerna ligger i scenes.js.
// En engelsk version läggs till som ett eget objekt bredvid sv.

export const sv = {
  // ---- Hela sidan ----
  lang: 'sv',
  page_title: 'Övningssidan, testversion',
  app_name: 'Övningssidan',
  app_description: 'Öva korta svenska scener och spela in dig själv med mobilens kamera. Videon stannar i mobilen.',
  test_band: 'Testversion. Scenerna är utkast och inte granskade än.',

  // ---- 1. Startsida ----
  // Hemskärmen
  greet_morning: 'God morgon.',
  greet_day: 'Hej.',
  greet_evening: 'God kväll.',
  greet_night: 'God natt.',
  home_sub: 'Redo för en tagning?',
  daily_kicker: 'Dagens utmaning',
  daily_button: 'Anta utmaningen',
  daily_time: '2 min',
  daily_you: 'Du',
  tile_scene: 'Spela en scen',
  tile_scene_text: 'Manus och AI-motspelare',
  tile_improv: 'Improvisera med AI',
  tile_improv_text: 'Ingen text. Bara du och en karaktär.',
  tile_fiveways: 'En replik, fem sätt',
  tile_fiveways_text: 'Ironiskt, argt, förälskat …',
  tile_warmup: 'Uppvärmning',
  tile_warmup_text: 'Röst, andning och diktion',
  tile_monologue: 'Monolog',
  tile_monologue_text: 'Din stund i ljuset',
  tile_takes: 'Mina tagningar',
  tile_takes_text: 'Se hur du utvecklas',
  soon: 'Snart',

  // En replik, fem sätt, monologer och improvisation
  fiveways_title: 'En replik, fem sätt',
  fiveways_situation: 'Säg samma replik fem gånger, på ett nytt sätt varje gång. Gör en kort paus mellan gångerna, så markeras nästa sätt. Du kan också trycka på Nästa.',
  monologue_title: 'Monolog',
  monologue_text: 'Välj en monolog. Gör en kort paus mellan styckena, så markeras nästa stycke.',
  improv_title: 'Improvisera med AI',
  improv_text: 'Välj en situation. AI:n spelar den andra personen, och det finns inget manus.',
  improv_unavailable: 'AI-motspelaren är inte igång än. Prova en scen med manus så länge.',
  pick_back: 'Till hem',
  record_goal: 'Du vill: {vill}',
  guided_done: 'Klart. Tryck på Stoppa när du vill.',
  nav_label: 'Huvudmeny',
  nav_home: 'Hem',
  nav_scenes: 'Scener',
  nav_train: 'Träna',

  // Uppvärmningen
  warmup_step: 'Uppvärmning · {n} av {total}',
  warmup_start: 'Starta klockan',
  warmup_next: 'Nästa',
  warmup_finish: 'Klar',
  warmup_new_twister: 'En annan tungvrickare',
  warmup_time_left: '{time} kvar',
  warmup_time_done: 'Klart. Gå vidare när du vill.',
  breath_in: 'Andas in',
  breath_hold: 'Håll',
  breath_out: 'Andas ut',
  warmup_done_title: 'Nu är du varm',
  warmup_done_text: 'Rösten, andningen och munnen är igång. Passa på medan det sitter i.',
  warmup_done_scene: 'Spela en scen',
  warmup_done_daily: 'Dagens utmaning',

  start_promise_1_title: 'Övning, inga betyg.',
  start_promise_1_text: 'Sidan bedömer inte ditt spel eller ditt utseende.',
  start_promise_2_title: 'Videon stannar i din mobil.',
  start_promise_2_text: 'Den skickas aldrig till oss.',
  start_promise_3_title: 'Gratis och utan konto.',
  start_promise_3_text: 'Det här är en testversion.',

  // Visas när sidan öppnas inne i en app, till exempel TikTok eller Instagram.
  inapp_title: 'Öppna gärna sidan i Safari eller Chrome.',
  inapp_text: 'Du verkar ha öppnat länken inne i en app, och där fungerar kameran inte alltid.',
  inapp_how: 'Tryck på menyn med tre prickar i appen och välj att öppna i webbläsaren, eller kopiera länken.',
  inapp_copy_button: 'Kopiera länken',
  inapp_copied: 'Länken är kopierad. Klistra in den i Safari eller Chrome.',
  inapp_copy_manual: 'Kopiera länken här: {url}',

  // ---- 2. Bekräfta 18 år ----
  age_title: 'Tjänsten är för vuxna',
  age_text: 'Du behöver vara 18 år eller äldre för att använda kameran här. Svaret sparas inte, så frågan kommer igen nästa gång.',
  age_checkbox: 'Jag är 18 år eller äldre',
  age_button_back: 'Tillbaka',
  age_button_continue: 'Fortsätt',

  // ---- 3. Välj scen och roll ----
  scenes_title: 'Välj en scen',
  scenes_text: 'Alla scener är för två personer. Välj en scen och den roll du vill spela.',
  scene_draft_badge: 'Utkast',
  scene_meta: 'Cirka {length} · {roles} roller · {approval}',
  scene_approved_by: 'Skriven med AI-stöd, godkänd av {name}',
  scene_not_reviewed: 'Skriven med AI-stöd, inte granskad än',
  length_seconds: '{n} s',
  length_minutes: '{n} min',
  role_title: 'Vilken roll vill du spela?',
  role_button: 'Spela {name}',
  button_other_scene: 'Välj en annan scen',

  // ---- 4. Teknikkoll ----
  check_title: 'Teknikkoll',
  check_text: 'Placera mobilen så att ditt ansikte och dina axlar syns inom ramen. Kontrollen mäter bara ljud, ljus och bildutsnitt.',
  check_prompt_start: 'Tryck på Starta kontrollen. Var först tyst i två sekunder och säg sedan din första replik med vanlig röst.',
  check_prompt_silence: 'Var tyst i två sekunder …',
  check_prompt_speak: 'Säg nu din första replik med vanlig röst …',
  check_prompt_no_audio: 'Ljudet kunde inte mätas i den här webbläsaren. Kontrollera ljuset och bilden själv.',
  check_prompt_done: 'Klart. Rådet gäller bara tekniken, inte ditt spel.',
  check_button_start: 'Starta kontrollen',
  check_button_again: 'Kör kontrollen igen',
  check_button_to_record: 'Till inspelningen',
  check_mirror_note: 'Förhandsbilden visas spegelvänd, som i en spegel. Den sparade videon blir rättvänd.',

  // Rubrikerna i resultatet. Resultatet visas som "Ljud: Bra ljudnivå".
  check_name_speech: 'Ljud',
  check_name_peaks: 'Toppar',
  check_name_noise: 'Bakgrund',
  check_name_light: 'Ljus',
  check_value_db: '{n} dB',
  check_value_light: '{n} av 255',
  check_frame_label: 'Bildutsnitt: kontrollera själv',
  check_frame_advice: 'Ansiktet och axlarna ska vara inom ramen, med lite luft ovanför huvudet.',

  // Bedömning och råd för varje mätning, från check.js.
  speech_bad_label: 'För lågt ljud',
  speech_bad_advice: 'Gå närmare mobilen, tala med vanlig röst och kontrollera att inget täcker mikrofonen.',
  speech_low_label: 'Lite lågt ljud',
  speech_low_advice: 'Gå lite närmare mobilen eller tala lite högre.',
  speech_high_label: 'Högt ljud',
  speech_high_advice: 'Håll mobilen lite längre bort.',
  speech_good_label: 'Bra ljudnivå',
  speech_good_advice: 'Rösten hörs tydligt.',
  peaks_bad_label: 'Ljudet klipper',
  peaks_bad_advice: 'Håll mobilen längre bort eller tala lite lägre.',
  peaks_warn_label: 'Nära gränsen',
  peaks_warn_advice: 'Tala lite lägre eller håll mobilen längre bort.',
  peaks_good_label: 'Inga toppar som klipper',
  peaks_good_advice: 'Starka ljud hörs utan att förvrängas.',
  noise_bad_label: 'Mycket bakgrundsljud',
  noise_bad_advice: 'Byt rum, eller stäng dörrar, fönster och fläktar.',
  noise_warn_label: 'Lite bakgrundsljud',
  noise_warn_advice: 'Stäng av musik och fläktar om det går.',
  noise_good_label: 'Tyst bakgrund',
  noise_good_advice: 'Inget stör rösten.',
  light_none_label: 'Ljuset kunde inte mätas',
  light_none_advice: 'Kontrollera själv att ansiktet syns tydligt.',
  light_backlit_label: 'Motljus eller för starkt ljus',
  light_backlit_advice: 'Ställ dig så att ljuset kommer framifrån, inte bakifrån.',
  light_dark_label: 'För mörkt',
  light_dark_advice: 'Vänd dig mot ett fönster eller tänd en lampa framför dig.',
  light_dim_label: 'Lite mörkt',
  light_dim_advice: 'Mer ljus framifrån gör bilden tydligare.',
  light_bright_label: 'Mycket ljust',
  light_bright_advice: 'Flytta dig lite från det starkaste ljuset.',
  light_good_label: 'Bra ljus',
  light_good_advice: 'Ansiktet syns tydligt.',

  // ---- 5. Spela in ----
  record_title: 'Spela in',
  record_button_start: 'Starta inspelning',
  record_button_stop: 'Stoppa',
  record_script_label: 'Scenens repliker',
  record_you: 'Du, {name}',
  record_max_note: 'En tagning kan vara högst 3 minuter.',

  // Motspelaren: välj AI, mobilens röst eller ingen röst.
  partner_legend: 'Motspelare',
  partner_mode_ai: 'AI som svarar dig (test)',
  partner_mode_none: 'Ingen röst, jag läser själv',
  ai_note: 'Du pratar med en AI, inte en människa. AI:n spelar motspelaren och svarar på det du säger, så du kan följa manuset eller improvisera. Medan scenen pågår skickas ljudet från mikrofonen till ElevenLabs. Videon stannar i mobilen.',
  ai_status_connecting: 'AI-motspelaren startar …',
  ai_status_listening: 'AI:n lyssnar',
  ai_status_speaking: 'AI:n pratar',
  ai_status_error: 'AI-motspelaren kunde inte starta. Inspelningen fortsätter utan den.',
  ai_status_ended: 'AI-motspelaren har lagt på. Tryck på Stoppa när du är klar.',
  ai_log_label: 'Samtalet med AI-motspelaren',
  ai_them: '{name} (AI)',
  ai_you: 'Du, {name}',

  // Mobilens egen röst läser den andra rollens repliker.
  partner_toggle: 'Mobilen läser motspelarens repliker högt',
  partner_note: 'Rösten är mobilens inbyggda uppläsningsröst och kan höras i inspelningen, som en motspelare bakom kameran. Nästa replik kommer när du har sagt din, eller när du trycker på Nästa replik.',
  partner_no_voice: 'Mobilen har ingen svensk uppläsningsröst som sidan kan använda, så motspelarens repliker står bara i texten.',
  partner_next: 'Nästa replik',
  partner_done: 'Scenen är slut. Tryck på Stoppa när du är klar.',

  // ---- 6. Titta ----
  review_title: 'Titta på tagningen',
  review_playback_error: 'Uppspelningen fungerar inte i den här webbläsaren, men du kan ändå spara videon.',
  review_button_retake: 'Ta om',
  review_button_save: 'Spara',
  stopped_hidden: 'Inspelningen stoppades när du lämnade sidan. Du kan titta på det som hann spelas in, eller ta om.',
  stopped_ended: 'Kameran eller mikrofonen stängdes av, till exempel av ett samtal. Du kan titta på det som hann spelas in, eller ta om.',
  stopped_error: 'Något gick fel under inspelningen. Du kan titta på det som hann spelas in, eller ta om.',
  stopped_max: 'Tagningen stoppades efter 3 minuter, som är maxlängden.',

  // ---- 7. Spara eller dela ----
  save_title: 'Spara videon i mobilen',
  save_text: 'Videon finns bara här i webbläsaren och försvinner när du stänger sidan. Spara den innan du går vidare.',
  save_button_share: 'Spara eller dela',
  save_button_download: 'Ladda ned videon',
  save_tip_iphone_title: 'iPhone:',
  save_tip_iphone_text: 'tryck på Spara eller dela och välj Spara video, så hamnar den i Bilder. En nedladdning hamnar i stället i appen Filer.',
  save_tip_android_title: 'Android:',
  save_tip_android_text: 'en nedladdning hamnar i mappen Nedladdningar och syns oftast i Galleri eller Google Foto.',
  save_button_new_take: 'Ny tagning',
  save_shared: 'Klart. Kontrollera att videon finns där du sparade den.',
  save_share_failed: 'Delningen fungerade inte. Tryck på Ladda ned videon i stället.',
  // Början på filnamnet, till exempel tagning-20261113-1430.mp4.
  file_prefix: 'tagning',

  // ---- Hjälp när kameran inte startar ----
  help_button_start: 'Till startsidan',
  help_button_retry: 'Försök igen',
  help_blocked_title: 'Kameran eller mikrofonen är blockerad',
  help_blocked_1: 'Sidan behöver tillåtelse att använda kameran och mikrofonen. Inget spelas in förrän du själv startar.',
  help_blocked_2: 'iPhone med Safari: tryck på aA i adressfältet, välj Webbplatsinställningar och tillåt Kamera och Mikrofon.',
  help_blocked_3: 'Android med Chrome: tryck på ikonen till vänster om adressen, välj Behörigheter och tillåt Kamera och Mikrofon.',
  help_blocked_4: 'Tryck sedan på Försök igen.',
  help_no_camera_title: 'Ingen kamera hittades',
  help_no_camera_1: 'Enheten verkar sakna kamera eller mikrofon. Prova med en mobil.',
  help_busy_title: 'Kameran används av något annat',
  help_busy_1: 'Stäng andra appar som använder kameran, till exempel ett videosamtal, och tryck på Försök igen.',
  help_unsupported_title: 'Webbläsaren kan inte spela in',
  help_unsupported_1: 'Öppna sidan i Safari på iPhone eller i Chrome på Android.',
  help_unsupported_2: 'Inbyggda webbläsare i appar som TikTok och Instagram stöder ofta inte inspelning. Tryck på menyn i appen och välj att öppna i webbläsaren.',
  help_recorder_title: 'Inspelningen kunde inte starta',
  help_recorder_1: 'Webbläsaren stöder inte inspelning av video. Prova Safari på iPhone eller Chrome på Android.',
  help_empty_title: 'Tagningen blev tom',
  help_empty_1: 'Inget hann spelas in. Tryck på Försök igen. Om det händer igen, öppna sidan i Safari eller Chrome.',
  help_default_title: 'Kameran kunde inte starta',
  help_default_1: 'Något stoppade kameran. Stäng andra appar som använder kameran och tryck på Försök igen.',

  // ---- Sidfoten ----
  footer_label: 'Om sidan',
  footer_about: 'Om sidan',
  footer_ai: 'Så används AI',
  footer_privacy: 'Integritet',
  footer_terms: 'Villkor',
  footer_contact: 'Kontakt',
  footer_signup: 'Anmäl dig',

  // ---- Gemensamt för anmälan och frågorna ----
  test_band_pages: 'Testversion. Texterna är utkast.',
  back_to_practice: '← Tillbaka till övningen',
  privacy_link: 'Så hanterar vi dina uppgifter',
  honeypot_label: 'Lämna det här fältet tomt',

  // ---- Anmälan (anmalan.html och tack.html) ----
  signup_page_title: 'Anmälan, Övningssidan',
  signup_title: 'Få ett mejl när något nytt finns',
  signup_lead: 'Vi mejlar när det kommer nya scener och när appen går att ladda ned. Du kan när som helst be oss ta bort din adress.',
  signup_email_label: 'Din e-post',
  signup_source_label: 'Var hörde du om oss?',
  signup_source_choose: 'Välj',
  signup_source_tiktok: 'TikTok',
  signup_source_instagram: 'Instagram',
  signup_source_google: 'Google',
  signup_source_friend: 'Från en vän',
  signup_source_other: 'Annat',
  signup_android_label: 'Jag vill testa appen för Android när den finns',
  signup_consent_label: 'Ja, ni får spara min e-post och mejla mig om övningssidan.',
  signup_button: 'Anmäl mig',
  thanks_page_title: 'Tack, Övningssidan',
  thanks_title: 'Tack, du är anmäld',
  thanks_text: 'Vi mejlar när det finns något nytt. Vill du att vi tar bort din adress kan du mejla oss, så gör vi det.',

  // ---- Frågor till skådespelare (fragor.html och fragor-tack.html) ----
  // Fråga 1 och 2 kommer från intervjuguiden i analysdokumentet. Frågorna om att
  // betala togs bort när appen blev gratis för skådespelare.
  questions_page_title: 'Frågor till skådespelare, Övningssidan',
  questions_title: 'Frågor till skådespelare och lärare',
  questions_lead: 'Hjälp oss bygga rätt sak. Svara på det du vill. Svaren läses av en människa och används bara för att utveckla övningssidan.',
  questions_role_label: 'Jag är',
  questions_role_actor: 'Skådespelare',
  questions_role_teacher: 'Lärare eller kursledare',
  questions_role_other: 'Annat',
  questions_q1: 'När gjorde du senast en self-tape, och hur gick det till?',
  questions_q2: 'Var hittade du text att öva på?',
  questions_q3: 'Vad är svårast när du övar själv?',
  questions_q4: 'Skulle det hjälpa dig att öva mot en AI som spelar motspelaren och svarar dig?',
  questions_q5: 'Vilken sorts feedback efter en tagning skulle hjälpa dig mest?',
  questions_q7_label: 'Ja, ni får mejla mig när det finns något nytt att testa',
  questions_email_label: 'Din e-post, om du vill ha ett mejl',
  questions_consent_label: 'Ja, ni får spara mina svar i högst 12 månader.',
  questions_button: 'Skicka svaren',
  questions_thanks_page_title: 'Tack för svaren, Övningssidan',
  questions_thanks_title: 'Tack för dina svar',
  questions_thanks_text: 'Svaren hjälper oss att göra övningssidan bättre.'
};

// Hämtar en text och fyller i värdena. Okänd nyckel ger ett fel, så att en
// felstavad nyckel upptäcks i testerna i stället för att synas på sidan.
export function t(key, values = {}) {
  const text = sv[key];
  if (typeof text !== 'string') throw new Error(`Texten saknas: ${key}`);
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}
