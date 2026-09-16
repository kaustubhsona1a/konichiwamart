const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const ts = Date.now();
code = code.replace(
  /heroBannerUrl: localStorage.getItem\('km_hero_banner_data'\) \|\| '\/konichiwalaptopbg.png',/,
  `heroBannerUrl: localStorage.getItem('km_hero_banner_data') || '/konichiwalaptopbg.png?v=${ts}',`
);
code = code.replace(
  /mobileHeroBannerUrl: localStorage.getItem\('km_hero_mobile_banner_data'\) \|\| '\/konichiwamobilebg.png',/,
  `mobileHeroBannerUrl: localStorage.getItem('km_hero_mobile_banner_data') || '/konichiwamobilebg.png?v=${ts}',`
);
code = code.replace(
  /backgroundImageUrl: '\/konichiwalaptopbg.png',/,
  `backgroundImageUrl: '/konichiwalaptopbg.png?v=${ts}',`
);
code = code.replace(
  /mobileBackgroundImageUrl: '\/konichiwamobilebg.png',/,
  `mobileBackgroundImageUrl: '/konichiwamobilebg.png?v=${ts}',`
);
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed images cache");
