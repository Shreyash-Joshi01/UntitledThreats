import React, { createContext, useContext, useState } from 'react';

// ─── All UI strings in 3 languages ───────────────────────────────────────────
export const STRINGS = {
  en: {
    code: 'en',
    label: 'EN',
    flag: '🇬🇧',

    // Header
    welcomeBack: 'Welcome back,',

    // WhatsApp
    waAlerts: 'WhatsApp Alerts',
    waSubtitle: 'Income Protection Alerts',
    waMonitoring: 'Monitoring',
    waAlertActive: 'Alert Active',
    waFooter: 'Automated alerts only — no replies needed',
    waViewJourney: 'View Full Claim Journey',
    waCollapse: 'Collapse',

    // WA Messages — shield active
    waMsgShield: (city, intensity, zone) =>
      `🛡️ *Shield Active — ${city}*\n\nCurrent rainfall: ${intensity} mm/hr in Zone ${zone}.\n\nNo disruption detected. You're covered. We're watching. 👀`,

    // WA Messages — triggered
    waMsgAlert: (city, zone, intensity) =>
      `⚠️ *Weather Alert — Your Zone*\n\nHeavy rainfall detected in ${city}.\n📍 Zone: ${zone}\n🌧️ Intensity: ${intensity} mm/hr\n\nYour Shield is active. Monitoring started.`,
    waMsgPayout: (claimId) =>
      `✅ *Payout Triggered*\n\nHeavy rain sustained for 60 minutes in your zone.\n\n💸 *₹200 is being credited* to your UPI ID.\n\nExpected in: 10 minutes\n📋 Claim ID: ${claimId}`,
    waMsgSuccess:
      `🎉 *Payment Successful!*\n\n₹200 has been credited to your UPI.\n\nStay safe. Your shield remains active. 🛡️`,

    // WA How it works
    waHowItWorks:
      `👋 *Welcome to Income Shield!*\n\nHere's how your protection works:\n\n🌧️ If rain hits 35+ mm/hr in your zone, we detect it automatically.\n⏱️ After 60 min sustained rain → ₹200 credited to your UPI.\n⏱️ After 90 min → ₹350 total.\n\nNo claims to file. No forms. Just protection. 🛡️`,

    // Activity tab
    recentIncidents: 'Recent Incidents',
    noIncidents: 'No coverage incidents yet',
    noIncidentsHint: 'When rain triggers a payout, it\'ll appear here',
    appealDecision: 'Appeal Decision',

    // Coverage status labels
    covered: 'YES — Shield Active',
    notCovered: 'Not triggered yet',
    claimEligible: 'Claim Eligible — Heavy Rain',
  },

  ta: {
    code: 'ta',
    label: 'தமிழ்',
    flag: '🇮🇳',

    welcomeBack: 'மீண்டும் வரவேற்கிறோம்,',

    waAlerts: 'WhatsApp அறிவிப்புகள்',
    waSubtitle: 'வருமான பாதுகாப்பு அறிவிப்புகள்',
    waMonitoring: 'கண்காணிக்கிறோம்',
    waAlertActive: 'எச்சரிக்கை செயலில் உள்ளது',
    waFooter: 'தானியங்கி அறிவிப்புகள் மட்டுமே — பதில் தேவையில்லை',
    waViewJourney: 'கோரல் பயணத்தை பாருங்கள்',
    waCollapse: 'மூடு',

    waMsgShield: (city, intensity, zone) =>
      `🛡️ *கவசம் செயலில் — ${city}*\n\nதற்போதைய மழை: ${intensity} மி.மீ/மணி, மண்டலம் ${zone}.\n\nகுறைப்பு இல்லை. நீங்கள் பாதுகாக்கப்பட்டுள்ளீர்கள். 👀`,

    waMsgAlert: (city, zone, intensity) =>
      `⚠️ *வானிலை எச்சரிக்கை — உங்கள் மண்டலம்*\n\n${city}-ல் கடுமையான மழை.\n📍 மண்டலம்: ${zone}\n🌧️ தீவிரம்: ${intensity} மி.மீ/மணி\n\nகவசம் செயலில் உள்ளது. கண்காணிப்பு தொடங்கியது.`,
    waMsgPayout: (claimId) =>
      `✅ *பணம் தூண்டப்பட்டது*\n\n60 நிமிடம் கடுமையான மழை.\n\n💸 *₹200 உங்கள் UPI-க்கு* அனுப்பப்படுகிறது.\n\nமதிப்பிடப்பட்டது: 10 நிமிடங்கள்\n📋 கோரல் ID: ${claimId}`,
    waMsgSuccess:
      `🎉 *பணம் வெற்றிகரமாக!*\n\n₹200 உங்கள் UPI-ல் வரவு வைக்கப்பட்டது.\n\nபாதுகாப்பாக இருங்கள். கவசம் தொடர்கிறது. 🛡️`,

    waHowItWorks:
      `👋 *வருமான கவசத்திற்கு வரவேற்கிறோம்!*\n\nநீங்கள் எப்படி பாதுகாக்கப்படுகிறீர்கள்:\n\n🌧️ மழை 35+ மி.மீ/மணி அடைந்தால், தானாகவே கண்டறிகிறோம்.\n⏱️ 60 நிமிடம் மழை → ₹200 UPI-ல் வரவு.\n⏱️ 90 நிமிடம் → மொத்தம் ₹350.\n\nகோரல் இல்லை. படிவம் இல்லை. பாதுகாப்பு மட்டும். 🛡️`,

    recentIncidents: 'சமீபத்திய சம்பவங்கள்',
    noIncidents: 'இதுவரை கவரேஜ் சம்பவங்கள் இல்லை',
    noIncidentsHint: 'மழை பணம் தூண்டும்போது இங்கே தோன்றும்',
    appealDecision: 'முடிவை மேல்முறையீடு செய்',

    covered: 'ஆம் — கவசம் செயலில்',
    notCovered: 'இன்னும் தூண்டப்படவில்லை',
    claimEligible: 'கோரல் தகுதி — கடுமையான மழை',
  },

  hi: {
    code: 'hi',
    label: 'हिंदी',
    flag: '🇮🇳',

    welcomeBack: 'वापस स्वागत है,',

    waAlerts: 'WhatsApp अलर्ट',
    waSubtitle: 'आय सुरक्षा अलर्ट',
    waMonitoring: 'निगरानी',
    waAlertActive: 'अलर्ट सक्रिय',
    waFooter: 'केवल स्वचालित अलर्ट — कोई जवाब जरूरी नहीं',
    waViewJourney: 'पूरी क्लेम यात्रा देखें',
    waCollapse: 'बंद करें',

    waMsgShield: (city, intensity, zone) =>
      `🛡️ *शील्ड सक्रिय — ${city}*\n\nवर्तमान वर्षा: ${intensity} मिमी/घंटा, ज़ोन ${zone}.\n\nकोई व्यवधान नहीं। आप सुरक्षित हैं। 👀`,

    waMsgAlert: (city, zone, intensity) =>
      `⚠️ *मौसम चेतावनी — आपका ज़ोन*\n\n${city} में भारी बारिश।\n📍 ज़ोन: ${zone}\n🌧️ तीव्रता: ${intensity} मिमी/घंटा\n\nशील्ड सक्रिय है। निगरानी शुरू हो गई।`,
    waMsgPayout: (claimId) =>
      `✅ *भुगतान शुरू हुआ*\n\n60 मिनट भारी बारिश।\n\n💸 *₹200 आपके UPI में* भेजा जा रहा है।\n\nअनुमानित: 10 मिनट\n📋 क्लेम ID: ${claimId}`,
    waMsgSuccess:
      `🎉 *भुगतान सफल!*\n\n₹200 आपके UPI में जमा हो गया।\n\nसुरक्षित रहें। शील्ड जारी है। 🛡️`,

    waHowItWorks:
      `👋 *इनकम शील्ड में स्वागत है!*\n\nआपकी सुरक्षा कैसे काम करती है:\n\n🌧️ अगर बारिश 35+ मिमी/घंटा हो, तो हम खुद पता लगाते हैं।\n⏱️ 60 मिनट बारिश → ₹200 UPI में।\n⏱️ 90 मिनट → कुल ₹350।\n\nकोई क्लेम नहीं। कोई फॉर्म नहीं। बस सुरक्षा। 🛡️`,

    recentIncidents: 'हाल की घटनाएं',
    noIncidents: 'अभी तक कोई कवरेज घटना नहीं',
    noIncidentsHint: 'जब बारिश भुगतान शुरू करेगी, यहाँ दिखेगा',
    appealDecision: 'निर्णय की अपील करें',

    covered: 'हाँ — शील्ड सक्रिय',
    notCovered: 'अभी शुरू नहीं हुआ',
    claimEligible: 'क्लेम योग्य — भारी बारिश',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = STRINGS[lang];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// ─── Toggle Button Component ──────────────────────────────────────────────────
export function LangToggle() {
  const { lang, setLang } = useLang();
  const langs = ['en', 'ta', 'hi'];

  return (
    <div className="flex items-center gap-1 bg-surface border border-outline-variant/40 rounded-full p-0.5 shadow-sm">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 ${
            lang === l
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {STRINGS[l].label}
        </button>
      ))}
    </div>
  );
}