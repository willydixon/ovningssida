// Anmälan: läser ?fran= i adressen, till exempel ?fran=tiktok från länken i profilen,
// och lägger den i ett dolt fält. Inget sparas i webbläsaren och inget skickas av
// skriptet. Det är formuläret som skickas när personen själv trycker på knappen.

const fran = new URLSearchParams(location.search).get('fran') || '';
const clean = /^[a-z0-9-]{1,20}$/.test(fran) ? fran : '';
document.getElementById('fran').value = clean;

// Om länken kom från en kanal i listan väljs den i förväg. Personen kan ändra den.
const source = document.querySelector('select[name="kalla"]');
if (clean && [...source.options].some((o) => o.value === clean)) source.value = clean;
