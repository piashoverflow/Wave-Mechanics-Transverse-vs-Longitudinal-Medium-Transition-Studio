import { Language, MediumPresetId } from '../types/simulation';

export const MEDIUM_PRESETS: Record<
  Exclude<MediumPresetId, 'custom'>,
  { speed: number; bn: string; en: string; tint: string }
> = {
  air: { speed: 340, bn: 'বায়ু (৩৪০ m/s)', en: 'Air (340 m/s)', tint: '#e0f2fe' },
  water: { speed: 1480, bn: 'পানি (১৪৮০ m/s)', en: 'Water (1480 m/s)', tint: '#bae6fd' },
  steel: { speed: 5000, bn: 'কাচ / ইস্পাত (৫০০০ m/s)', en: 'Glass / Steel (5000 m/s)', tint: '#d1fae5' },
  light_cord: { speed: 600, bn: 'হালকা দড়ি (৬০০ m/s)', en: 'Light Cord (600 m/s)', tint: '#f0f9ff' },
  heavy_cord: { speed: 240, bn: 'ভারী দড়ি (২৪০ m/s)', en: 'Heavy Cord (240 m/s)', tint: '#ecfdf5' },
};

export interface TranslationSchema {
  studioTitle: string;
  tabs: {
    m1Short: string;
    m2Short: string;
    m3Short: string;
    m4Short: string;
  };
  actions: {
    reset: string;
    play: string;
    pause: string;
    step: string;
    speed: string;
    launchPulse: string;
    launchFullWave: string;
    launchCrestPulse: string;
    zoomIn: string;
    zoomOut: string;
    resetCamera: string;
    baselineReset: string;
  };
  common: {
    controlsTitle: string;
    telemetryTitle: string;
    playbackTitle: string;
    frequency: string;
    wavelength: string;
    amplitude: string;
    waveSpeed: string;
    timePeriod: string;
    angularFreq: string;
    waveNumber: string;
    hz: string;
    m: string;
    ms: string;
    s: string;
    rads: string;
    radm: string;
    propagationDir: string;
    rightward: string;
  };
  m1: {
    laneTransverse: string;
    laneLongitudinal: string;
    crest: string;
    trough: string;
    compression: string;
    rarefaction: string;
    sourceMode: string;
    continuous: string;
    singlePulse: string;
    viewMode: string;
    dualView: string;
    transverseOnly: string;
    longitudinalOnly: string;
    visualAids: string;
    highlightMarkers: string;
    showVectors: string;
    showRuler: string;
    pluckerHint: string;
    dragPiston: string;
    particleProofTitle: string;
    netMatterTransport: string;
    particleDisplacementY: string;
    particleVelocityVy: string;
    particleDisplacementX: string;
    particleVelocityVx: string;
    energyVsMatterNote: string;
  };
  m2: {
    modeSwitcher: string;
    energyMode: string;
    emMode: string;
    mediumCondition: string;
    mediumPresent: string;
    vacuumMode: string;
    quickScalingTitle: string;
    presetBase: string;
    preset2A: string;
    preset2F: string;
    preset2Both: string;
    energyFluxMeter: string;
    relativeEnergyIndex: string;
    ampFactor: string;
    freqFactor: string;
    emVisualOptions: string;
    showEPlane: string;
    showBPlane: string;
    emDragHint: string;
    emElectricField: string;
    emMagneticField: string;
    emSpeedLabel: string;
    mechHaltedTitle: string;
    mechHaltedDesc: string;
    emVacuumActive: string;
    mediumRequired: string;
    noMediumNeeded: string;
    mechanicalWave: string;
    emWave: string;
    formulaCardTitle: string;
  };
  m3: {
    medium1Title: string;
    medium2Title: string;
    medium1Speed: string;
    medium2Speed: string;
    sourceFreqLocked: string;
    boundaryOptions: string;
    showReflection: string;
    showComponents: string;
    boundaryLabel: string;
    crestsCrossed: string;
    invariantBadge: string;
    comparisonTitle: string;
    parameter: string;
    medium1Col: string;
    medium2Col: string;
    freqRow: string;
    speedRow: string;
    wavelengthRow: string;
    ratiosTitle: string;
    speedRatio: string;
    wavelengthRatio: string;
    phaseShiftTitle: string;
    phaseInversionPi: string;
    phaseZero: string;
    phaseMatched: string;
    incidentLabel: string;
    reflectedLabel: string;
    transmittedLabel: string;
    fasterHint: string;
    slowerHint: string;
    equalHint: string;
    customPreset: string;
  };
  m4: {
    sourceType: string;
    manual: string;
    oscillate: string;
    pulse: string;
    endCondition: string;
    fixedEnd: string;
    looseEnd: string;
    noEnd: string;
    amplitudeCm: string;
    pulseWidth: string;
    damping: string;
    tension: string;
    tensionLow: string;
    tensionMedium: string;
    tensionHigh: string;
    toolsTitle: string;
    showRulers: string;
    showTimer: string;
    showRefLine: string;
    sendPulse: string;
    resetString: string;
    wrenchHint: string;
    oscillateHint: string;
    pulseHint: string;
    dragRulerHint: string;
    stringKinematicsTitle: string;
    sourcePos: string;
    midBeadPos: string;
    endBeadPos: string;
    endBehaviorTitle: string;
    fixedRule: string;
    looseRule: string;
    noEndRule: string;
    stopwatchTitle: string;
    cm: string;
    cms: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  bn: {
    studioTitle: 'যান্ত্রিক তরঙ্গ, অনুপ্রস্থ-অনুদৈর্ঘ্য ও মাধ্যম পরিবর্তন ল্যাব',
    tabs: {
      m1Short: 'মডিউল ১: অনুপ্রস্থ ও অনুদৈর্ঘ্য',
      m2Short: 'মডিউল ২: শক্তি ও তাড়িতচৌম্বক',
      m3Short: 'মডিউল ৩: মাধ্যম পরিবর্তন',
      m4Short: 'মডিউল ৪: দড়িতে তরঙ্গ',
    },
    actions: {
      reset: 'রিসেট',
      play: 'চালু করুন',
      pause: 'বিরতি',
      step: '১ ধাপ',
      speed: 'গতি',
      launchPulse: 'একক স্পন্দন পাঠান',
      launchFullWave: 'পূর্ণ তরঙ্গ (১ চক্র)',
      launchCrestPulse: 'শীর্ষ স্পন্দন',
      zoomIn: 'জুম ইন',
      zoomOut: 'জুম আউট',
      resetCamera: 'ভিউ রিসেট',
      baselineReset: 'বেসলাইন (১×)',
    },
    common: {
      controlsTitle: 'প্যারামিটার নিয়ন্ত্রণ',
      telemetryTitle: 'লাইভ টেলিমেট্রি ও সূত্র',
      playbackTitle: 'সিমুলেশন প্লেব্যাক',
      frequency: 'কম্পাঙ্ক (f)',
      wavelength: 'তরঙ্গদৈর্ঘ্য (λ)',
      amplitude: 'বিস্তার (A)',
      waveSpeed: 'তরঙ্গ বেগ (v)',
      timePeriod: 'পর্যায়কাল (T)',
      angularFreq: 'কৌণিক কম্পাঙ্ক (ω)',
      waveNumber: 'তরঙ্গ সংখ্যা (k)',
      hz: 'Hz',
      m: 'm',
      ms: 'm/s',
      s: 's',
      rads: 'rad/s',
      radm: 'rad/m',
      propagationDir: 'তরঙ্গ প্রবাহের দিক',
      rightward: '+x (ডানদিকে)',
    },
    m1: {
      laneTransverse: 'অনুপ্রস্থ তরঙ্গ (Transverse) — কণা লম্বভাবে কাঁপে',
      laneLongitudinal: 'অনুদৈর্ঘ্য তরঙ্গ (Longitudinal) — কণা সমান্তরালে কাঁপে',
      crest: 'তরঙ্গশীর্ষ',
      trough: 'তরঙ্গপাদ',
      compression: 'সংকোচন',
      rarefaction: 'প্রসারণ',
      sourceMode: 'উৎসের ধরন',
      continuous: 'নিরবচ্ছিন্ন তরঙ্গ',
      singlePulse: 'একক স্পন্দন (প্লাকার)',
      viewMode: 'প্রদর্শন মোড',
      dualView: 'উভয় তরঙ্গ একসাথে',
      transverseOnly: 'শুধু অনুপ্রস্থ',
      longitudinalOnly: 'শুধু অনুদৈর্ঘ্য',
      visualAids: 'ভিজ্যুয়াল সহায়তা',
      highlightMarkers: 'লাল চিহ্নিত কণা দেখান',
      showVectors: 'সরণ ভেক্টর (y ও x) দেখান',
      showRuler: 'তরঙ্গদৈর্ঘ্য স্কেল (λ) দেখান',
      pluckerHint: 'বাম পাশের অসিলেটর পিস্টন টেনে বা বাটনে ক্লিক করে একক স্পন্দন পাঠান',
      dragPiston: 'টানুন / প্লাক',
      particleProofTitle: 'চিহ্নিত কণার লাইভ গতি',
      netMatterTransport: 'কণার গড় স্থানান্তর',
      particleDisplacementY: 'উল্লম্ব সরণ (y)',
      particleVelocityVy: 'কণার বেগ (vᵧ)',
      particleDisplacementX: 'অনুভূমিক সরণ (Δx)',
      particleVelocityVx: 'কণার বেগ (vₓ)',
      energyVsMatterNote: 'তরঙ্গ শক্তি সামনের দিকে এগিয়ে যায়, কিন্তু মাধ্যমের কণা নিজ সাম্যাবস্থানের চারপাশেই স্পন্দিত হয়।',
    },
    m2: {
      modeSwitcher: 'বিশ্লেষণ মোড',
      energyMode: 'শক্তি ও রাশিমালা',
      emMode: '৩ডি তাড়িতচৌম্বক তরঙ্গ',
      mediumCondition: 'মাধ্যমের অবস্থা',
      mediumPresent: 'মাধ্যম উপস্থিত',
      vacuumMode: 'শূন্যস্থান (Vacuum)',
      quickScalingTitle: 'শক্তির বর্গীয় সূত্র পরীক্ষা (E ∝ A²f²)',
      presetBase: 'বেসলাইন (১×)',
      preset2A: '২× বিস্তার (৪× শক্তি)',
      preset2F: '২× কম্পাঙ্ক (৪× শক্তি)',
      preset2Both: '২× উভয় (১৬× শক্তি)',
      energyFluxMeter: 'লাইভ শক্তি প্রবাহ মিটার (P ∝ ρvω²A²)',
      relativeEnergyIndex: 'আপেক্ষিক শক্তি ঘনত্ব (E / E₀)',
      ampFactor: 'বিস্তারের গুণক (A/A₀)²',
      freqFactor: 'কম্পাঙ্কের গুণক (f/f₀)²',
      emVisualOptions: '৩ডি ক্ষেত্র প্রদর্শন',
      showEPlane: 'তড়িৎ ক্ষেত্র তল (E)',
      showBPlane: 'চৌম্বক ক্ষেত্র তল (B)',
      emDragHint: 'মাউস বা টাচ দিয়ে টেনে ৩ডি দৃষ্টিকোণ ঘুরিয়ে দেখুন',
      emElectricField: 'তড়িৎ ক্ষেত্র (E)',
      emMagneticField: 'চৌম্বক ক্ষেত্র (B)',
      emSpeedLabel: 'শূন্যস্থানে বেগ c = 3.00 × 10⁸ m/s',
      mechHaltedTitle: 'মাধ্যম অনুপস্থিত — যান্ত্রিক তরঙ্গ থেমে গেছে',
      mechHaltedDesc: 'শূন্যস্থানে কণা না থাকায় যান্ত্রিক তরঙ্গ প্রবাহিত হতে পারে না, কিন্তু তাড়িতচৌম্বক তরঙ্গ অনায়াসে চলে।',
      emVacuumActive: 'শূন্যস্থানেও তাড়িতচৌম্বক তরঙ্গ c বেগে প্রবাহিত হচ্ছে',
      mediumRequired: 'মাধ্যম প্রয়োজন',
      noMediumNeeded: 'মাধ্যম ছাড়াই চলে',
      mechanicalWave: 'যান্ত্রিক তরঙ্গ',
      emWave: 'তাড়িতচৌম্বক তরঙ্গ',
      formulaCardTitle: 'তাৎক্ষণিক তরঙ্গ রাশিমালা',
    },
    m3: {
      medium1Title: 'মাধ্যম ১ (বাম অঞ্চল)',
      medium2Title: 'মাধ্যম ২ (ডান অঞ্চল)',
      medium1Speed: 'মাধ্যম ১-এ বেগ (v₁)',
      medium2Speed: 'মাধ্যম ২-এ বেগ (v₂)',
      sourceFreqLocked: 'উৎসের কম্পাঙ্ক (f — উভয় মাধ্যমে স্থির)',
      boundaryOptions: 'সীমানা আচরণ',
      showReflection: 'আংশিক প্রতিফলন ও দশা পরিবর্তন দেখান',
      showComponents: 'আপতিত ও প্রতিফলিত উপাংশ আলাদা দেখান',
      boundaryLabel: 'বিভেদ তল (Boundary)',
      crestsCrossed: 'সীমানা অতিক্রান্ত শীর্ষ',
      invariantBadge: 'অপরিবর্তিত',
      comparisonTitle: 'সীমানা সংরক্ষণ যাচাই সারণি',
      parameter: 'রাশি',
      medium1Col: 'মাধ্যম ১',
      medium2Col: 'মাধ্যম ২',
      freqRow: 'কম্পাঙ্ক (f)',
      speedRow: 'তরঙ্গ বেগ (v)',
      wavelengthRow: 'তরঙ্গদৈর্ঘ্য (λ)',
      ratiosTitle: 'সমানুপাতিক সম্পর্ক (v₁/λ₁ = v₂/λ₂)',
      speedRatio: 'বেগের অনুপাত (v₁ / v₂)',
      wavelengthRatio: 'তরঙ্গদৈর্ঘ্যের অনুপাত (λ₁ / λ₂)',
      phaseShiftTitle: 'প্রতিফলিত তরঙ্গের দশা আচরণ',
      phaseInversionPi: 'π (১৮০°) দশা উল্টানো — ঘন/ধীর মাধ্যম সীমানা',
      phaseZero: '০° দশা অপরিবর্তিত — হালকা/দ্রুত মাধ্যম সীমানা',
      phaseMatched: 'সমমাধ্যম — কোনো প্রতিফলন নেই',
      incidentLabel: 'আপতিত তরঙ্গ',
      reflectedLabel: 'প্রতিফলিত তরঙ্গ',
      transmittedLabel: 'প্রতিসরিত তরঙ্গ',
      fasterHint: 'মাধ্যম ২ দ্রুততর (v₂ > v₁) → তরঙ্গদৈর্ঘ্য প্রসারিত (λ₂ > λ₁)',
      slowerHint: 'মাধ্যম ২ ধীরতর (v₂ < v₁) → তরঙ্গদৈর্ঘ্য সংকুচিত (λ₂ < λ₁)',
      equalHint: 'উভয় মাধ্যমে বেগ সমান (v₁ = v₂) → তরঙ্গদৈর্ঘ্য অপরিবর্তিত',
      customPreset: 'কাস্টম মান',
    },
    m4: {
      sourceType: 'উৎসের ধরন',
      manual: 'হাতে নাড়া (রেঞ্চ)',
      oscillate: 'দোলক (Oscillate)',
      pulse: 'স্পন্দন (Pulse)',
      endCondition: 'ডান প্রান্তের অবস্থা',
      fixedEnd: 'বদ্ধ প্রান্ত',
      looseEnd: 'মুক্ত প্রান্ত',
      noEnd: 'অসীম প্রান্ত (খোলা)',
      amplitudeCm: 'বিস্তার (A)',
      pulseWidth: 'স্পন্দন প্রস্থ',
      damping: 'অবমন্দন (Damping)',
      tension: 'দড়ির টান (Tension)',
      tensionLow: 'কম',
      tensionMedium: 'মাঝারি',
      tensionHigh: 'বেশি',
      toolsTitle: 'পরিমাপক যন্ত্র',
      showRulers: 'স্কেল দেখান (cm)',
      showTimer: 'স্টপওয়াচ দেখান',
      showRefLine: 'নির্দেশক রেখা দেখান',
      sendPulse: 'স্পন্দন পাঠান',
      resetString: 'দড়ি স্থির করুন',
      wrenchHint: 'বাম পাশের সবুজ রেঞ্চটি ধরে উপরে-নিচে টেনে নিজের মতো তরঙ্গ তৈরি করুন',
      oscillateHint: 'মোটরচালিত দোলক নিয়মিত কম্পাঙ্কে দড়িতে সাইন তরঙ্গ সৃষ্টি করছে',
      pulseHint: 'একক স্পন্দন পাঠাতে "স্পন্দন পাঠান" বাটনে ক্লিক করুন ও প্রতিফলন পর্যবেক্ষণ করুন',
      dragRulerHint: 'স্কেল বা নির্দেশক রেখা টেনে যেকোনো অবস্থানে সরানো যাবে',
      stringKinematicsTitle: 'দড়ির পুঁতির তাৎক্ষণিক সরণ',
      sourcePos: 'উৎস প্রান্ত (x = 0 cm)',
      midBeadPos: 'মাঝের পুঁতি (x = 3.8 cm)',
      endBeadPos: 'শেষ প্রান্ত (x = 7.5 cm)',
      endBehaviorTitle: 'সীমানা প্রতিফলন নিয়ম',
      fixedRule: 'বদ্ধ প্রান্তে তরঙ্গ π (১৮০°) দশা উল্টে বিপরীত দিকে ফিরে আসে (শীর্ষ → পাদ)।',
      looseRule: 'মুক্ত প্রান্তে আংটা অবাধে ওঠানামা করে এবং তরঙ্গ সোজাভাবে (০° দশায়) প্রতিফলিত হয়।',
      noEndRule: 'খোলা প্রান্ত দিয়ে তরঙ্গ কোনো প্রতিফলন ছাড়াই বাইরে বেরিয়ে যায়।',
      stopwatchTitle: 'স্টপওয়াচ',
      cm: 'cm',
      cms: 'cm/s',
    },
  },
  en: {
    studioTitle: 'Wave Mechanics, Transverse vs Longitudinal & Medium Transition Studio',
    tabs: {
      m1Short: 'Module 1: Particle Motion',
      m2Short: 'Module 2: Energy & EM',
      m3Short: 'Module 3: Medium Boundary',
      m4Short: 'Module 4: Wave on a String',
    },
    actions: {
      reset: 'Reset',
      play: 'Play',
      pause: 'Pause',
      step: 'Step',
      speed: 'Speed',
      launchPulse: 'Launch Single Pulse',
      launchFullWave: 'Full Wave (1 Cycle)',
      launchCrestPulse: 'Crest Pulse',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetCamera: 'Reset View',
      baselineReset: 'Baseline (1×)',
    },
    common: {
      controlsTitle: 'Parameter Controls',
      telemetryTitle: 'Live Telemetry & Formulas',
      playbackTitle: 'Simulation Playback',
      frequency: 'Frequency (f)',
      wavelength: 'Wavelength (λ)',
      amplitude: 'Amplitude (A)',
      waveSpeed: 'Wave Speed (v)',
      timePeriod: 'Time Period (T)',
      angularFreq: 'Angular Freq (ω)',
      waveNumber: 'Wave Number (k)',
      hz: 'Hz',
      m: 'm',
      ms: 'm/s',
      s: 's',
      rads: 'rad/s',
      radm: 'rad/m',
      propagationDir: 'Wave Propagation',
      rightward: '+x (Rightward)',
    },
    m1: {
      laneTransverse: 'Transverse Wave — Particles oscillate perpendicular to wave travel',
      laneLongitudinal: 'Longitudinal Wave — Particles oscillate parallel to wave travel',
      crest: 'Crest',
      trough: 'Trough',
      compression: 'Compression',
      rarefaction: 'Rarefaction',
      sourceMode: 'Wave Source Mode',
      continuous: 'Continuous Wave',
      singlePulse: 'Single Pulse Plucker',
      viewMode: 'Lane View Mode',
      dualView: 'Dual Simultaneous',
      transverseOnly: 'Transverse Only',
      longitudinalOnly: 'Longitudinal Only',
      visualAids: 'Visual Aids',
      highlightMarkers: 'Highlight Marker Particles',
      showVectors: 'Show Displacement Vectors (y & x)',
      showRuler: 'Show Wavelength Ruler (λ)',
      pluckerHint: 'Drag the left oscillator piston up/down or click Launch Pulse to send a single energy packet',
      dragPiston: 'Drag / Pluck',
      particleProofTitle: 'Marker Particle Kinematics',
      netMatterTransport: 'Net Matter Transport',
      particleDisplacementY: 'Vertical Offset (y)',
      particleVelocityVy: 'Particle Velocity (vᵧ)',
      particleDisplacementX: 'Horizontal Offset (Δx)',
      particleVelocityVx: 'Particle Velocity (vₓ)',
      energyVsMatterNote: 'Energy propagates across the medium while individual particles oscillate strictly around fixed equilibrium positions.',
    },
    m2: {
      modeSwitcher: 'Visualization Mode',
      energyMode: 'Wave Energy Explorer',
      emMode: '3D EM Wave Visualizer',
      mediumCondition: 'Medium Environment',
      mediumPresent: 'Medium Present',
      vacuumMode: 'Vacuum (No Medium)',
      quickScalingTitle: 'Quadratic Energy Scaling (E ∝ A²f²)',
      presetBase: 'Baseline (1×)',
      preset2A: '2× Amplitude (4× E)',
      preset2F: '2× Frequency (4× E)',
      preset2Both: '2× Both (16× E)',
      energyFluxMeter: 'Live Energy Transfer Flux (P ∝ ρvω²A²)',
      relativeEnergyIndex: 'Relative Energy Index (E / E₀)',
      ampFactor: 'Amplitude Factor (A/A₀)²',
      freqFactor: 'Frequency Factor (f/f₀)²',
      emVisualOptions: '3D Field Layers',
      showEPlane: 'Electric Field Plane (E)',
      showBPlane: 'Magnetic Field Plane (B)',
      emDragHint: 'Drag across the canvas to orbit the 3D electromagnetic projection',
      emElectricField: 'Electric Field (E)',
      emMagneticField: 'Magnetic Field (B)',
      emSpeedLabel: 'Speed in Vacuum c = 3.00 × 10⁸ m/s',
      mechHaltedTitle: 'No Medium — Mechanical Wave Halted',
      mechHaltedDesc: 'Mechanical waves require elastic matter to propagate, whereas Electromagnetic waves travel freely through vacuum at speed c.',
      emVacuumActive: 'Electromagnetic wave propagates unimpeded through vacuum at c',
      mediumRequired: 'Medium Required',
      noMediumNeeded: 'No Medium Needed',
      mechanicalWave: 'Mechanical Wave',
      emWave: 'Electromagnetic Wave',
      formulaCardTitle: 'Real-Time Wave Evaluators',
    },
    m3: {
      medium1Title: 'Medium 1 (Left Zone)',
      medium2Title: 'Medium 2 (Right Zone)',
      medium1Speed: 'Medium 1 Speed (v₁)',
      medium2Speed: 'Medium 2 Speed (v₂)',
      sourceFreqLocked: 'Source Frequency (f — Locked across boundary)',
      boundaryOptions: 'Boundary Behavior',
      showReflection: 'Show Partial Reflection & Phase Shift',
      showComponents: 'Show Incident & Reflected Components',
      boundaryLabel: 'Interface Boundary',
      crestsCrossed: 'Crests Crossed',
      invariantBadge: 'Invariant',
      comparisonTitle: 'Boundary Conservation Verifier',
      parameter: 'Parameter',
      medium1Col: 'Medium 1',
      medium2Col: 'Medium 2',
      freqRow: 'Frequency (f)',
      speedRow: 'Wave Speed (v)',
      wavelengthRow: 'Wavelength (λ)',
      ratiosTitle: 'Proportional Law (v₁/λ₁ = v₂/λ₂)',
      speedRatio: 'Speed Ratio (v₁ / v₂)',
      wavelengthRatio: 'Wavelength Ratio (λ₁ / λ₂)',
      phaseShiftTitle: 'Reflected Wave Phase Shift',
      phaseInversionPi: 'π (180°) Phase Inversion — Entering slower/denser medium',
      phaseZero: '0° No Inversion — Entering faster/rarer medium',
      phaseMatched: 'Matched Media — Zero boundary reflection',
      incidentLabel: 'Incident',
      reflectedLabel: 'Reflected',
      transmittedLabel: 'Transmitted',
      fasterHint: 'Medium 2 is faster (v₂ > v₁) → Wavelength stretches (λ₂ > λ₁)',
      slowerHint: 'Medium 2 is slower (v₂ < v₁) → Wavelength compresses (λ₂ < λ₁)',
      equalHint: 'Equal wave speeds (v₁ = v₂) → Wavelength unchanged',
      customPreset: 'Custom Speed',
    },
    m4: {
      sourceType: 'Source Driver',
      manual: 'Manual (Wrench)',
      oscillate: 'Oscillate',
      pulse: 'Pulse',
      endCondition: 'Right End Boundary',
      fixedEnd: 'Fixed End',
      looseEnd: 'Loose End',
      noEnd: 'No End (Window)',
      amplitudeCm: 'Amplitude (A)',
      pulseWidth: 'Pulse Width',
      damping: 'Damping',
      tension: 'String Tension',
      tensionLow: 'Low',
      tensionMedium: 'Medium',
      tensionHigh: 'High',
      toolsTitle: 'Measurement Tools',
      showRulers: 'Show Rulers (cm)',
      showTimer: 'Show Stopwatch',
      showRefLine: 'Show Reference Line',
      sendPulse: 'Send Pulse',
      resetString: 'Calm String',
      wrenchHint: 'Grab and drag the green wrench up and down to launch waves manually along the string',
      oscillateHint: 'Motorized harmonic oscillator driving continuous sinusoidal waves',
      pulseHint: 'Click Send Pulse to launch a single wave packet and observe boundary reflection',
      dragRulerHint: 'Drag rulers or reference line directly on the canvas to measure wavelength & amplitude',
      stringKinematicsTitle: 'String Bead Positions',
      sourcePos: 'Source End (x = 0 cm)',
      midBeadPos: 'Middle Bead (x = 3.8 cm)',
      endBeadPos: 'Right End (x = 7.5 cm)',
      endBehaviorTitle: 'End Reflection Behavior',
      fixedRule: 'Fixed End reflects waves with π (180°) phase inversion (crest returns as trough).',
      looseRule: 'Loose End slides freely on a vertical pole and reflects waves upright (0° phase shift).',
      noEndRule: 'Open Window absorbs outgoing waves cleanly with zero boundary reflection.',
      stopwatchTitle: 'Stopwatch',
      cm: 'cm',
      cms: 'cm/s',
    },
  },
};
