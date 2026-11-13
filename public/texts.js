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
  start_title: 'Öva scener och spela in dig själv',
  start_lead: 'Välj en kort svensk scen, kontrollera ljud och ljus och gör en tagning med mobilens kamera.',
  start_promise_1_title: 'Övning, inga betyg.',
  start_promise_1_text: 'Sidan bedömer inte ditt spel eller ditt utseende.',
  start_promise_2_title: 'Videon stannar i din mobil.',
  start_promise_2_text: 'Den skickas aldrig till oss.',
  start_promise_3_title: 'Gratis och utan konto.',
  start_promise_3_text: 'Det här är en testversion.',
  start_button: 'Börja öva',

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
  scenes_text: 'Alla scener är för två personer. Du läser din roll, och motspelarens repliker står i texten.',
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

  // Motspelaren: mobilens egen röst läser den andra rollens repliker.
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
  footer_price: 'Scenpaket',
  footer_signup: 'Anmäl dig',

  // ---- Fas 2: gemensamt för de nya sidorna ----
  test_band_pages: 'Testversion. Texterna är utkast.',
  back_to_practice: '← Tillbaka till övningen',
  privacy_link: 'Så hanterar vi dina uppgifter',
  honeypot_label: 'Lämna det här fältet tomt',

  // ---- Fas 2: prissidan (pris.html) ----
  price_page_title: 'Scenpaket, Övningssidan',
  price_title: 'Scenpaket',
  price_lead: 'Ett scenpaket är 10 nya scener på ett tema, med tips till varje scen. Du övar på dem här på sidan, och videon stannar i din mobil.',
  price_amount: '99 kr per paket',
  price_includes_title: 'Det här ingår',
  price_include_1: '10 korta scener för två personer på samma tema',
  price_include_2: 'Tips om situationen och rollerna i varje scen',
  price_include_3: 'Granskade av en person som kan teater och film innan de släpps',
  price_not_yet: 'Det går inte att köpa paketen än. Vill du veta när det går?',
  price_button: 'Meddela mig när jag kan köpa',
  price_counter_note: 'Vi räknar hur många som öppnar den här sidan och trycker på knappen, per dag. Vi sparar inte vem du är och använder inga kakor.',

  // ---- Fas 2: anmälan (anmalan.html och tack.html) ----
  signup_page_title: 'Anmälan, Övningssidan',
  signup_title: 'Få ett mejl när något nytt finns',
  signup_lead: 'Vi mejlar när scenpaketen går att köpa och när det kommer nya scener. Du kan när som helst be oss ta bort din adress.',
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

  // ---- Fas 2: frågor till skådespelare (fragor.html och fragor-tack.html) ----
  // Frågorna kommer från intervjuguiden i analysdokumentet.
  questions_page_title: 'Frågor till skådespelare, Övningssidan',
  questions_title: 'Frågor till skådespelare och lärare',
  questions_lead: 'Hjälp oss bygga rätt sak. Svara på det du vill. Svaren läses av en människa och används bara för att utveckla övningssidan.',
  questions_role_label: 'Jag är',
  questions_role_actor: 'Skådespelare',
  questions_role_teacher: 'Lärare eller kursledare',
  questions_role_other: 'Annat',
  questions_q1: 'När gjorde du senast en self-tape, och hur gick det till?',
  questions_q2: 'Var hittade du text att öva på?',
  questions_q3: 'Vad betalade du senast för att bli bättre, och hur mycket?',
  questions_q4: 'Skulle en inläst motspelare på svenska hjälpa dig?',
  questions_q5: 'Vad måste ett scenpaket innehålla för att du ska betala 99 kr?',
  questions_q6: 'Skulle du betala 300 kr för ett kort videosamtal där en kunnig person ser dig spela och ger råd?',
  questions_q7_label: 'Ja, ni får mejla mig köplänken när den finns',
  questions_email_label: 'Din e-post, om du vill ha köplänken',
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
