"""
Multilingual Translation Service for Indian Languages.
Supports English, Hindi, Malayalam, Tamil, Telugu, and Kannada.
Combines offline phrase matching with online translation API integration and fallbacks.
"""

import requests
import re

SUPPORTED_LANGUAGES = {
    'en': {'name': 'English', 'native': 'English'},
    'hi': {'name': 'Hindi', 'native': 'हिन्दी'},
    'ml': {'name': 'Malayalam', 'native': 'മലയാളം'},
    'ta': {'name': 'Tamil', 'native': 'தமிழ்'},
    'te': {'name': 'Telugu', 'native': 'తెలుగు'},
    'kn': {'name': 'Kannada', 'native': 'ಕನ್ನಡ'}
}

# Offline multilingual lexicon for core ISL vocabulary and common conversational turns
OFFLINE_DICTIONARY = {
    "hello": {
        "en": "Hello",
        "hi": "नमस्ते (Namaste)",
        "ml": "നമസ്കാരം (Namaskaram)",
        "ta": "வணக்கம் (Vanakkam)",
        "te": "నమస్కారం (Namaskaram)",
        "kn": "ನಮಸ್ಕಾರ (Namaskara)"
    },
    "thank you": {
        "en": "Thank you",
        "hi": "धन्यवाद (Dhanyawad)",
        "ml": "നന്ദി (Nandi)",
        "ta": "நன்றி (Nandri)",
        "te": "ధన్యవాదాలు (Dhanyavadalu)",
        "kn": "ಧನ್ಯವಾದಗಳು (Dhanyavadagalu)"
    },
    "how are you": {
        "en": "How are you?",
        "hi": "आप कैसे हैं? (Aap kaise hain?)",
        "ml": "സുഖമാണോ? (Sukhamano?)",
        "ta": "நீங்கள் எப்படி இருக்கிறீர்கள்? (Neengal eppadi irukkeergal?)",
        "te": "మీరు ఎలా ఉన్నారు? (Meeru ela unnaru?)",
        "kn": "ನೀವು ಹೇಗಿದ್ದೀರಿ? (Neevu hegiddiri?)"
    },
    "yes": {
        "en": "Yes",
        "hi": "हाँ (Haan)",
        "ml": "അതെ (Athe)",
        "ta": "ஆம் (Aam)",
        "te": "అవును (Avunu)",
        "kn": "ಹೌದು (Haudu)"
    },
    "no": {
        "en": "No",
        "hi": "नहीं (Nahi)",
        "ml": "ഇല്ല (Illa)",
        "ta": "இல்லை (Illai)",
        "te": "లేదు (Ledu)",
        "kn": "ಇಲ್ಲ (Illa)"
    },
    "please": {
        "en": "Please",
        "hi": "कृपया (Kripaya)",
        "ml": "ദയവായി (Dayavayi)",
        "ta": "தயவுசெய்து (Thayavuseidhu)",
        "te": "దయచేసి (Dayachesi)",
        "kn": "ದಯವಿಟ್ಟು (Dayavittu)"
    },
    "help": {
        "en": "Help",
        "hi": "मदद (Madad)",
        "ml": "സഹായം (Sahayam)",
        "ta": "உதவி (Udhavi)",
        "te": "సహాయం (Sahayam)",
        "kn": "ಸಹಾಯ (Sahaya)"
    },
    "goodbye": {
        "en": "Goodbye",
        "hi": "अलविदा (Alvida)",
        "ml": "വിട (Vida)",
        "ta": "பிரியாவிடை (Priyavidai)",
        "te": "వీడ్కోలు (Veedkolu)",
        "kn": "ವಿದಾಯ (Vidaya)"
    },
    "i am fine": {
        "en": "I am fine.",
        "hi": "मैं ठीक हूँ (Main theek hoon)",
        "ml": "എനിക്ക് സുഖമാണ് (Enikku sukhamanu)",
        "ta": "நான் நன்றாக இருக்கிறேன் (Naan nandraga irukkiren)",
        "te": "నేను బాగున్నాను (Nenu bagunnanu)",
        "kn": "ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ (Naanu aaramagiddene)"
    },
    "what is your name": {
        "en": "What is your name?",
        "hi": "आपका नाम क्या है? (Aapka naam kya hai?)",
        "ml": "നിങ്ങളുടെ പേരെന്താണ്? (Ningalude perenthanu?)",
        "ta": "உங்கள் பெயர் என்ன? (Ungal peyar enna?)",
        "te": "మీ పేరు ఏమిటి? (Mee peru emiti?)",
        "kn": "ನಿಮ್ಮ ಹೆಸರೇನು? (Nimma hesarenu?)"
    },
    "welcome": {
        "en": "Welcome",
        "hi": "स्वागत है (Swagat hai)",
        "ml": "സ്വാഗതം (Swagatham)",
        "ta": "வரவேற்பு (Varaverpu)",
        "te": "స్వాగతం (Swagatham)",
        "kn": "ಸ್ವಾಗತ (Swagata)"
    },
    "sorry": {
        "en": "Sorry",
        "hi": "माफ़ कीजिये (Maaf kijiye)",
        "ml": "ക്ഷമിക്കണം (Kshamikkanam)",
        "ta": "மன்னிக்கவும் (Mannikkavum)",
        "te": "క్షమించండి (Kshaminchandi)",
        "kn": "ಕ್ಷಮಿಸಿ (Kshamisi)"
    },
    "water": {
        "en": "Water",
        "hi": "पानी (Paani)",
        "ml": "വെള്ളം (Vellam)",
        "ta": "தண்ணீர் (Thanneer)",
        "te": "నీరు (Neeru)",
        "kn": "ನೀರು (Neeru)"
    },
    "food": {
        "en": "Food",
        "hi": "खाना (Khaana)",
        "ml": "ഭക്ഷണം (Bhakshanam)",
        "ta": "உணவு (Unavu)",
        "te": "ఆహారం (Aahaaram)",
        "kn": "ಆಹಾರ (Aahara)"
    },
    "emergency": {
        "en": "Emergency",
        "hi": "आपातकाल (Aapaatkaal)",
        "ml": "അടിയന്തരാവസ്ഥ (Adiyantharavastha)",
        "ta": "அவசரம் (Avasaram)",
        "te": "అత్యవసరం (Athyavasaram)",
        "kn": "ತುರ್ತು (Thurthu)"
    },
    "name": {
        "en": "Name",
        "hi": "नाम (Naam)",
        "ml": "പേര് (Peru)",
        "ta": "பெயர் (Peyar)",
        "te": "పేరు (Peru)",
        "kn": "ಹೆಸರು (Hesaru)"
    },
    "where": {
        "en": "Where?",
        "hi": "कहाँ? (Kahan?)",
        "ml": "എവിടെ? (Evide?)",
        "ta": "எங்கே? (Enge?)",
        "te": "ఎక్కడ? (Ekkada?)",
        "kn": "ಎಲ್ಲಿ? (Elli?)"
    }
}


class TranslationService:
    """
    Handles translation between English and Indian regional languages.
    """

    @classmethod
    def get_supported_languages(cls):
        return [
            {
                "code": code,
                "name": info["name"],
                "native": info["native"]
            }
            for code, info in SUPPORTED_LANGUAGES.items()
        ]

    @classmethod
    def translate(cls, text, source_language='en', target_language='hi'):
        if not text or not text.strip():
            return {
                "original_text": text,
                "translated_text": "",
                "source_language": source_language,
                "target_language": target_language,
                "engine": "none"
            }

        text = text.strip()

        # If source and target are the same, return as is
        if source_language.lower() == target_language.lower():
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "engine": "identity"
            }

        # 1. Check offline dictionary for exact or fuzzy match
        clean_text = re.sub(r'[^\w\s]', '', text).lower().strip()
        if clean_text in OFFLINE_DICTIONARY:
            target_entry = OFFLINE_DICTIONARY[clean_text].get(target_language)
            if target_entry:
                return {
                    "original_text": text,
                    "translated_text": target_entry,
                    "source_language": source_language,
                    "target_language": target_language,
                    "engine": "lexicon_exact"
                }

        # Check if individual words or known phrases can be translated
        # 2. Try online MyMemory free public API with 1.5s timeout
        try:
            lang_pair = f"{source_language}|{target_language}"
            url = f"https://api.mymemory.translated.net/get?q={requests.utils.quote(text)}&langpair={lang_pair}"
            resp = requests.get(url, timeout=2.5)
            if resp.status_code == 200:
                res_json = resp.json()
                translated = res_json.get("responseData", {}).get("translatedText")
                if translated and not translated.startswith("MYMEMORY WARNING"):
                    return {
                        "original_text": text,
                        "translated_text": translated,
                        "source_language": source_language,
                        "target_language": target_language,
                        "engine": "mymemory_api"
                    }
        except Exception:
            pass  # Fallback to local synthesis

        # 3. Fallback: Word by word replacement or formatted display
        words = clean_text.split()
        translated_tokens = []
        found_any = False
        for word in words:
            if word in OFFLINE_DICTIONARY and target_language in OFFLINE_DICTIONARY[word]:
                translated_tokens.append(OFFLINE_DICTIONARY[word][target_language])
                found_any = True
            else:
                translated_tokens.append(word)

        if found_any:
            translated_result = " ".join(translated_tokens)
        else:
            lang_name = SUPPORTED_LANGUAGES.get(target_language, {}).get("name", target_language)
            translated_result = f"[{lang_name}] {text}"

        return {
            "original_text": text,
            "translated_text": translated_result,
            "source_language": source_language,
            "target_language": target_language,
            "engine": "lexicon_fallback"
        }
