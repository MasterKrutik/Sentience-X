// Script to generate stub locale files for all 26 remaining languages
// Each file extends English with locale-specific metadata

const fs = require('fs');
const path = require('path');

const locales = [
  'en-US', 'bn', 'te', 'mr', 'ta', 'gu', 'ur', 'kn',
  'or', 'ml', 'pa', 'as', 'mai', 'sat', 'ks', 'kok', 'sd', 'dgo',
  'mni', 'brx', 'sa', 'fr', 'de', 'es', 'pt', 'ja'
];

const baseMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/en.json'), 'utf8'));

// Locale-specific taglines and app names
const taglines = {
  'en-US': 'The intelligence that feels what others cannot.',
  'bn': 'সেই বুদ্ধিমত্তা যা অন্যরা অনুভব করতে পারে না।',
  'te': 'ఇతరులు అనుభవించలేని తెలివితేటలు.',
  'mr': 'इतरांना जे जाणवत नाही ते जाणणारी बुद्धिमत्ता.',
  'ta': 'மற்றவர்களால் உணர முடியாத நுண்ணறிவு.',
  'gu': 'જે બुद्धिमत्ता অন্যরা অনুভব করতে পারেনি।',
  'ur': 'وہ ذہانت جو دوسرے محسوس نہیں کر سکتے۔',
  'kn': 'ಇತರರು ಅನುಭವಿಸಲಾಗದ ಬುದ್ಧಿಮತ್ತೆ.',
  'or': 'ବୁଦ୍ଧିମତ୍ତା ଯାହା ଅନ୍ୟ ଲୋକ ଅନୁଭବ କରି ପାରନ୍ତି ନାହିଁ।',
  'ml': 'മറ്റുള്ളവർക്ക് അനുഭവിക്കാൻ കഴിയാത്ത ബുദ്ധി.',
  'pa': 'ਉਹ ਬੁੱਧੀ ਜੋ ਦੂਸਰੇ ਮਹਿਸੂਸ ਨਹੀਂ ਕਰ ਸਕਦੇ।',
  'as': 'সেই বুদ্ধিমত্তা যি আনে অনুভৱ কৰিব নোৱাৰে।',
  'mai': 'ओ बुद्धि जे दोसर अनुभव नै कय सकय छथि।',
  'sat': 'ᱡᱟᱦᱟᱱ ᱵᱷᱟᱵᱷᱱᱟ ᱢᱮᱬᱮᱫ ᱢᱮᱱᱟᱜᱼᱟ',
  'ks': 'اکھ ذہانت جۂ دۄسرن لگٕنٕ محسوس نٕہ ہؠ',
  'kok': 'इतरां लागीं जी न जाणवे ती बुद्धिमत्ता.',
  'sd': 'اها ذهانت جيڪا ٻيا محسوس نٿا ڪري سگهن.',
  'dgo': 'उह् बुद्धिमत्ता जो दुये महसूस नेईं करी सकदे।',
  'mni': 'ꯃꯤꯑꯣꯢꯅꯁꯨ ꯇꯥꯛꯄꯥ ꯅꯠꯇ꯭ꯔꯕ ꯄ꯭ꯔꯦꯛꯇꯤꯇꯨꯗ꯭ꯗ꯭ꯔꯕ।',
  'brx': 'बेसेन्नो मानसिक स्वास्थ्य सेवा।',
  'sa': 'या बुद्धिः यां परे न अनुभवितुं शक्नुवन्ति।',
  'fr': 'L\'intelligence qui ressent ce que les autres ne peuvent pas.',
  'de': 'Die Intelligenz, die fühlt, was andere nicht können.',
  'es': 'La inteligencia que siente lo que otros no pueden.',
  'pt': 'A inteligência que sente o que os outros não conseguem.',
  'ja': '他の人が感じられないことを感じる知能。'
};

const signInTexts = {
  'en-US': 'Sign In',
  'bn': 'সাইন ইন করুন',
  'te': 'సైన్ ఇన్ చేయండి',
  'mr': 'साइन इन करा',
  'ta': 'உள்நுழைக',
  'gu': 'સાઇન ઇન કરો',
  'ur': 'سائن ان کریں',
  'kn': 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
  'or': 'ସାଇନ ଇନ କରନ୍ତୁ',
  'ml': 'സൈൻ ഇൻ ചെയ്യുക',
  'pa': 'ਸਾਈਨ ਇਨ ਕਰੋ',
  'as': 'চাইন ইন কৰক',
  'mai': 'साइन इन करू',
  'sat': 'ᱥᱟᱭᱱ ᱤᱱ',
  'ks': 'سائن ان کریو',
  'kok': 'साइन इन करात',
  'sd': 'سائن ان ڪريو',
  'dgo': 'साइन इन करो',
  'mni': 'ꯁꯥꯏꯟ ꯏꯟ ꯇꯧꯏꯕꯤ',
  'brx': 'साइन इन दा',
  'sa': 'साइन इन करोतु',
  'fr': 'Se connecter',
  'de': 'Anmelden',
  'es': 'Iniciar sesión',
  'pt': 'Entrar',
  'ja': 'サインイン'
};

locales.forEach(locale => {
  const messages = JSON.parse(JSON.stringify(baseMessages)); // deep clone
  messages.common.tagline = taglines[locale] || baseMessages.common.tagline;
  messages.auth.signIn = signInTexts[locale] || baseMessages.auth.signIn;
  
  const filePath = path.join(__dirname, '../messages', `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf8');
  console.log(`Created ${locale}.json`);
});

console.log('All locale files generated!');
