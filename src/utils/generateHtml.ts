import { EventConfig, Guest } from '../types';
import { getWeddingTitleClasses } from './weddingFonts';

export function generateStandaloneHtml(config: EventConfig, guests: Guest[]): string {
  const timelineJson = JSON.stringify(config.timeline, null, 2);
  const guestsJson = JSON.stringify(guests, null, 2);
  const titleClasses = getWeddingTitleClasses({
    font: config.titleFont,
    weight: config.titleWeight,
    italic: config.titleItalic,
    transform: config.titleTransform,
    tracking: config.titleTracking,
    size: config.titleSize
  });

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(config.title)} - Invitation & RSVP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,600&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Italianno&family=Montserrat:wght@300;400;500;600;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #f4f8fb;
            background-image: url('${config.bgImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            font-family: 'Cormorant Garamond', Georgia, serif;
            color: #18232c;
        }
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-script { font-family: 'Alex Brush', cursive; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-wedding-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-wedding-great-vibes { font-family: 'Great Vibes', cursive; }
        .font-wedding-pinyon { font-family: 'Pinyon Script', cursive; }
        .font-wedding-alex-brush { font-family: 'Alex Brush', cursive; }
        .font-wedding-parisienne { font-family: 'Parisienne', cursive; }
        .font-wedding-italianno { font-family: 'Italianno', cursive; }
        .font-wedding-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-wedding-cinzel { font-family: 'Cinzel', Georgia, serif; }
        .font-wedding-bodoni { font-family: 'Bodoni Moda', Georgia, serif; }
        .font-wedding-montserrat { font-family: 'Montserrat', sans-serif; }
        .romantic-stationery-card {
            background: #ffffff;
            border: 1px solid #c8d7e3;
            box-shadow: 0 15px 35px rgba(58, 90, 116, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .wax-seal {
            background: radial-gradient(circle at 35% 35%, #4D708E, #274155);
            border: 2px solid #1c2e3d;
            box-shadow: 0 4px 10px rgba(39, 65, 85, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-[#3A5A74] selection:text-white">

    <div class="fixed inset-0 bg-[#f4f8fb]/85 pointer-events-none z-0"></div>

    <audio id="bgAudio" src="${config.audioUrl}" loop preload="auto" autoplay></audio>

    <header class="sticky top-0 z-40 bg-[#ffffff]/95 backdrop-blur-md border-b border-[#c8d7e3] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm relative">
        <div class="flex items-center space-x-3">
            <span class="w-8 h-8 rounded-full wax-seal flex items-center justify-center text-xs text-sky-100 font-serif italic">❦</span>
            <span class="font-cinzel font-semibold text-base sm:text-lg tracking-widest text-[#18232c]">${escapeHtml(config.logoText)}</span>
        </div>
        <nav class="hidden md:flex items-center space-x-5 text-xs font-serif font-bold uppercase tracking-[0.18em] text-[#475569]">
            <a href="#hero" class="hover:text-[#3A5A74] transition">Home</a>
            <a href="#rsvp" class="hover:text-[#3A5A74] transition">RSVP</a>
            ${config.invitationEnabled !== false ? `<a href="#hero" class="hover:text-[#3A5A74] transition">Invitation</a>` : ''}
            <a href="#seating" class="hover:text-[#3A5A74] transition">Find Seat</a>
            ${config.churchEnabled !== false ? `<a href="#church" class="hover:text-[#3A5A74] transition">Church</a>` : ''}
            ${config.venueEnabled !== false ? `<a href="#venue" class="hover:text-[#3A5A74] transition">Venue</a>` : ''}
            <a href="#schedule" class="hover:text-[#3A5A74] transition">Schedule</a>
            ${config.guestbookEnabled !== false ? `<a href="#guestbook" class="hover:text-[#3A5A74] transition">Guestbook</a>` : ''}
            ${config.giftEnabled !== false ? `<a href="#rsvp" class="hover:text-[#3A5A74] transition">Gift</a>` : ''}
        </nav>
        <div class="flex items-center space-x-2.5">
            <a href="#guestbook" class="px-3.5 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold tracking-wider transition border border-[#4D708E] flex items-center space-x-1.5 shadow-xs">
                <i class="fa-solid fa-heart text-rose-300 text-xs"></i>
                <span>Guestbook</span>
            </a>
            <button onclick="toggleAudio()" class="w-9 h-9 rounded-full bg-[#ebf2f7] text-[#3A5A74] hover:bg-[#dbe7f0] flex items-center justify-center transition border border-[#c8d7e3]">
                <i id="audioIcon" class="fa-solid fa-music text-sm"></i>
            </button>
            <a href="#rsvp" class="px-4 py-2 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#3A5A74] rounded-xl text-xs font-serif font-semibold tracking-wider transition border border-[#c8d7e3]">
                Respond ❦
            </a>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12 relative z-10">
        <!-- Hero Section -->
        <section id="hero" class="romantic-stationery-card rounded-3xl p-6 sm:p-14 text-center relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-5 border border-[#c5a059]/40 rounded-2xl pointer-events-none"></div>

            <div class="relative z-10 mb-5 flex justify-center">
                <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 border-2 border-[#c5a059]/60 shadow-md bg-[#ffffff] overflow-hidden mx-auto">
                    <img src="${escapeHtml(config.heroImage || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80')}" alt="${escapeHtml(config.title)}" class="w-full h-full object-cover rounded-full" onerror="this.src='https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80';" />
                </div>
            </div>

            ${config.subHeaderEnabled !== false && (config.subHeader || '').trim() !== '' ? `
            <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.3em] mb-2">
                <span>❦</span>
                <span>${escapeHtml(config.subHeader)}</span>
                <span>❦</span>
            </div>` : ''}

            ${(config.invitationLine !== undefined ? config.invitationLine : 'Request the honour of your presence at the marriage of').trim() !== '' ? `
            <div class="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#506173] font-serif mb-2">
                ${escapeHtml(config.invitationLine !== undefined ? config.invitationLine : 'Request the honour of your presence at the marriage of')}
            </div>` : ''}

            <h1 class="${titleClasses} text-[#18232c] my-2">${escapeHtml(config.title)}</h1>

            ${(config.description || '').trim() !== '' ? `
            <p class="mt-4 text-[#475569] text-base sm:text-xl max-w-xl mx-auto leading-relaxed font-serif italic">
                "${escapeHtml(config.description)}"
            </p>` : ''}

            <div class="mt-8 inline-flex flex-wrap items-center justify-center gap-4 bg-[#ffffff] p-3 sm:p-4 rounded-2xl border border-[#c8d7e3] text-xs sm:text-sm font-serif shadow-sm">
                <div class="flex items-center space-x-2 px-2 text-[#18232c]">
                    <i class="fa-regular fa-calendar text-[#3A5A74]"></i>
                    <span class="font-semibold">${escapeHtml(config.date)}</span>
                </div>
                <div class="h-4 w-px bg-[#c5a059]/40 hidden sm:block"></div>
                <div class="flex items-center space-x-2 px-2 text-[#18232c]">
                    <i class="fa-regular fa-clock text-[#3A5A74]"></i>
                    <span class="font-semibold">${escapeHtml(config.time)}</span>
                </div>
                <div class="h-4 w-px bg-[#c5a059]/40 hidden sm:block"></div>
                <div class="flex items-center space-x-2 px-2 text-[#18232c]">
                    <i class="fa-solid fa-church text-[#3A5A74]"></i>
                    <span class="font-semibold">${escapeHtml(config.churchName || 'Holy Cross Parish Church')}</span>
                </div>
            </div>

            <!-- Countdown -->
            <div class="mt-10">
                <div class="text-xs font-serif uppercase tracking-[0.25em] text-[#3A5A74] font-semibold mb-3">✦ ${escapeHtml(config.countdownTitle || 'Counting the Moments')} ✦</div>
                <div class="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
                    <div class="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                        <span id="cdDays" class="block text-2xl sm:text-3xl font-serif text-[#18232c]">00</span>
                        <span class="text-[10px] font-serif uppercase tracking-widest text-[#506173] font-bold">Days</span>
                    </div>
                    <div class="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                        <span id="cdHours" class="block text-2xl sm:text-3xl font-serif text-[#18232c]">00</span>
                        <span class="text-[10px] font-serif uppercase tracking-widest text-[#506173] font-bold">Hours</span>
                    </div>
                    <div class="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                        <span id="cdMins" class="block text-2xl sm:text-3xl font-serif text-[#18232c]">00</span>
                        <span class="text-[10px] font-serif uppercase tracking-widest text-[#506173] font-bold">Minutes</span>
                    </div>
                    <div class="p-3.5 bg-[#ebf2f7] rounded-2xl border border-[#c8d7e3] text-center">
                        <span id="cdSecs" class="block text-2xl sm:text-3xl font-serif text-[#18232c]">00</span>
                        <span class="text-[10px] font-serif uppercase tracking-widest text-[#506173] font-bold">Seconds</span>
                    </div>
                </div>
            </div>

            <div class="mt-9 flex flex-wrap items-center justify-center gap-3">
                <a href="#rsvp" class="px-7 py-3.5 bg-[#3A5A74] hover:bg-[#274155] text-white font-serif font-semibold tracking-wider rounded-2xl shadow-md transition text-xs uppercase flex items-center space-x-2 border border-[#4D708E]">
                    <i class="fa-solid fa-feather-pointed text-xs"></i>
                    <span>Kindly Respond</span>
                </a>
            </div>
        </section>

        <!-- Seating Section -->
        <section id="seating" class="romantic-stationery-card rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

            <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-2 relative z-10">
                <span>❦</span><span>Reception Placements</span><span>❦</span>
            </div>
            <h2 class="text-3xl font-serif text-[#18232c] tracking-wide relative z-10">Place Setting Directory</h2>
            <p class="text-[#475569] font-serif italic text-sm mt-1 max-w-md mx-auto relative z-10">
                "Enter your honoured surname or given name to view your assigned table."
            </p>

            <div class="max-w-md mx-auto mt-6 relative z-10">
                <div class="relative flex items-center shadow-sm rounded-2xl overflow-hidden border border-[#c8d7e3] bg-[#ffffff]">
                    <input type="text" id="seatSearch" placeholder="Search your full name (e.g. Emily Watson)..." class="w-full py-3.5 pl-4 pr-24 text-xs sm:text-sm outline-none text-[#18232c] font-serif placeholder-slate-400">
                    <button onclick="findSeat()" class="absolute right-2 px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold tracking-wider border border-[#4D708E]">
                        Find Seat
                    </button>
                </div>
                <div id="seatResult" class="hidden mt-4 p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] text-sm text-[#18232c] shadow-sm font-serif"></div>
            </div>
        </section>

        ${config.churchEnabled !== false ? `
        <!-- Church Ceremony Section -->
        <section id="church" class="romantic-stationery-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

            <div class="text-center max-w-xl mx-auto mb-8 relative z-10">
                <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1">
                    <span>❦</span><span>${escapeHtml(config.churchEyebrow || 'The Holy Matrimony')}</span><span>❦</span>
                </div>
                <h2 class="text-3xl font-serif text-[#18232c]">${escapeHtml(config.churchTitle || 'The Church Ceremony')}</h2>
                ${config.churchSubtitle ? `<p class="text-[#475569] font-serif italic text-sm mt-1">"${escapeHtml(config.churchSubtitle)}"</p>` : ''}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
                <div class="lg:col-span-7 overflow-hidden rounded-2xl shadow-md border border-[#c8d7e3] relative min-h-[340px] sm:min-h-[440px] flex flex-col justify-end bg-slate-900 group">
                    <img src="${escapeHtml(config.churchImg || 'https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80')}" alt="${escapeHtml(config.churchName || "St. Mary's Church")}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" onerror="this.src='https://images.unsplash.com/photo-1548625361-195fe578ded7?auto=format&fit=crop&w=1200&q=80';">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#152330]/95 via-[#152330]/35 to-transparent pointer-events-none"></div>
                    <div class="relative z-10 p-5 text-white">
                        <span class="text-xs text-sky-200 font-serif tracking-wider uppercase font-semibold block mb-1">Sanctuary & Ceremony</span>
                        <span class="font-serif text-xl sm:text-2xl">${escapeHtml(config.churchName || "St. Mary's Church")}</span>
                    </div>
                </div>
                <div class="lg:col-span-5 space-y-4 flex flex-col justify-between">
                    <div class="p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-[#c8d7e3] pb-2">
                            <span class="text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74]">Holy Matrimony Sanctuary</span>
                            <span class="text-xs font-serif font-semibold text-[#18232c] bg-[#ebf2f7] px-2.5 py-1 rounded-lg border border-[#c8d7e3]">${escapeHtml(config.churchTime || '2:00 PM PST')}</span>
                        </div>
                        <h3 class="font-serif text-[#18232c] text-xl font-bold">${escapeHtml(config.churchName || "St. Mary's Catholic Church & Sanctuary")}</h3>
                        <p class="text-[#475569] font-serif text-sm leading-relaxed">${escapeHtml(config.churchAddress || '14 Spring Street, Newport, Rhode Island 02840')}</p>
                        ${config.churchNotes ? `
                        <div class="p-3 bg-[#ebf2f7] rounded-xl border border-[#c8d7e3] text-xs font-serif text-[#475569] leading-relaxed">
                            <i class="fa-solid fa-circle-info text-[#3A5A74] mr-1.5"></i>
                            ${escapeHtml(config.churchNotes)}
                        </div>` : ''}
                    </div>
                    <a href="${escapeHtml(config.churchMapLink || 'https://maps.google.com/?q=St+Mary+Church+Newport+RI')}" target="_blank" rel="noopener noreferrer" class="block text-center py-3.5 px-4 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-2xl text-xs font-serif font-semibold tracking-wider border border-[#4D708E] shadow-sm">
                        View Church Directions on Google Maps
                    </a>
                </div>
            </div>
        </section>
        ` : ''}

        ${config.venueEnabled !== false ? `
        <!-- Venue Section -->
        <section id="venue" class="romantic-stationery-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

            <div class="text-center max-w-xl mx-auto mb-8 relative z-10">
                <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1">
                    <span>❦</span><span>${escapeHtml(config.venueEyebrow || 'The Celebration Grounds')}</span><span>❦</span>
                </div>
                <h2 class="text-3xl font-serif text-[#18232c]">${escapeHtml(config.venueTitle || 'The Estate & Glasshouse')}</h2>
                ${config.venueSubtitle ? `<p class="text-[#475569] font-serif italic text-sm mt-1">"${escapeHtml(config.venueSubtitle)}"</p>` : ''}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
                <div class="lg:col-span-7 overflow-hidden rounded-2xl shadow-md border border-[#c8d7e3] relative min-h-[340px] sm:min-h-[440px] flex flex-col justify-end bg-slate-900 group">
                    <img src="${config.venueImg}" alt="${escapeHtml(config.venue)}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#152330]/95 via-[#152330]/35 to-transparent pointer-events-none"></div>
                    <div class="relative z-10 p-5 text-white">
                        <span class="text-xs text-sky-200 font-serif tracking-wider uppercase font-semibold block mb-1">Reception & Celebration Grounds</span>
                        <span class="font-serif text-xl sm:text-2xl">${escapeHtml(config.venue)}</span>
                    </div>
                </div>
                <div class="lg:col-span-5 space-y-4 flex flex-col justify-between">
                    <div class="p-5 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] shadow-sm">
                        <div class="flex items-center justify-between border-b border-[#c8d7e3] pb-2 mb-2">
                            <span class="text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74]">Estate Location</span>
                        </div>
                        <h3 class="font-serif text-[#18232c] text-xl font-normal">${escapeHtml(config.venue)}</h3>
                        <p class="text-[#475569] font-serif text-sm leading-relaxed mt-2">${escapeHtml(config.address)}</p>
                        ${(config.venueNotes || 'Valet and guest parking are available on-site at the estate entrance. Shuttle vans operate continuously between the sanctuary and celebration grounds.') ? `
                        <div class="pt-3 border-t border-[#e2ecf4] flex items-start space-x-2 text-xs text-[#506173] font-serif leading-relaxed mt-3">
                            <i class="fa-solid fa-circle-info text-[#3A5A74] mt-0.5 shrink-0"></i>
                            <span>${escapeHtml(config.venueNotes || 'Valet and guest parking are available on-site at the estate entrance. Shuttle vans operate continuously between the sanctuary and celebration grounds.')}</span>
                        </div>` : ''}
                    </div>
                    <a href="${config.mapLink}" target="_blank" rel="noopener noreferrer" class="block text-center py-3.5 px-4 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-2xl text-xs font-serif font-semibold tracking-wider border border-[#4D708E] shadow-sm">
                        View Directions on Google Maps
                    </a>
                </div>
            </div>
        </section>
        ` : ''}

        <!-- Keepsake Guestbook Section -->
        <section id="guestbook" class="romantic-stationery-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

            <div class="text-center max-w-xl mx-auto mb-8 relative z-10">
                <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1">
                    <span>❦</span><span>Keepsake Guestbook</span><span>❦</span>
                </div>
                <h2 class="text-3xl font-serif text-[#18232c]">Wishes & Love</h2>
                <p class="text-[#475569] font-serif italic text-sm mt-2">Leave your blessings, fond memories, and heartfelt congratulations for the newlyweds.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
                <form onsubmit="handleGuestbook(event)" class="lg:col-span-5 bg-[#fbfdfd] p-5 rounded-2xl border border-[#c8d7e3] space-y-3">
                    <span class="text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] block border-b border-[#e2ecf4] pb-2">Sign Guestbook</span>
                    <div>
                        <label class="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">Full Name *</label>
                        <input type="text" id="gbName" required placeholder="e.g. Eleanor & William" class="w-full px-3 py-2 rounded-xl border border-[#c8d7e3] text-sm outline-none font-serif text-[#18232c]">
                    </div>
                    <div>
                        <label class="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">Connection / From (Optional)</label>
                        <input type="text" id="gbRelation" placeholder="e.g. Family, Newport" class="w-full px-3 py-2 rounded-xl border border-[#c8d7e3] text-sm outline-none font-serif text-[#18232c]">
                    </div>
                    <div>
                        <label class="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">Wishes & Love *</label>
                        <textarea id="gbMessage" required rows="3" placeholder="Write your heartfelt blessing or words of love..." class="w-full px-3 py-2 rounded-xl border border-[#c8d7e3] text-sm outline-none font-serif text-[#18232c] resize-none"></textarea>
                    </div>
                    <button type="submit" class="w-full py-3 bg-[#3A5A74] hover:bg-[#274155] text-white font-serif font-semibold text-xs tracking-wider uppercase rounded-xl transition border border-[#4D708E] shadow-sm">
                        Post Wishes & Love ❦
                    </button>
                </form>

                <div class="lg:col-span-7 space-y-3" id="guestbookFeed">
                    <div class="p-4 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-serif font-bold text-[#18232c]">Clara & David Thornton <span class="text-[10px] text-[#3A5A74] bg-[#ebf2f7] px-2 py-0.5 rounded-full ml-1">Family Friends</span></span>
                            <span class="text-slate-400">Keepsake</span>
                        </div>
                        <p class="font-serif italic text-xs text-[#334155]">"May your marriage be filled with all the right ingredients: a heap of love, a dash of humor, a touch of romance, and a spoonful of understanding. So overjoyed for you both!"</p>
                    </div>
                    <div class="p-4 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-serif font-bold text-[#18232c]">Julian Vance <span class="text-[10px] text-[#3A5A74] bg-[#ebf2f7] px-2 py-0.5 rounded-full ml-1">Best Man</span></span>
                            <span class="text-slate-400">Keepsake</span>
                        </div>
                        <p class="font-serif italic text-xs text-[#334155]">"Wishing you a lifetime of quiet mornings, spontaneous adventures, and dancing in the kitchen together. You two are truly made for each other!"</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- RSVP Form Section -->
        <section id="rsvp" class="romantic-stationery-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div class="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

            <div class="text-center max-w-xl mx-auto mb-8 relative z-10">
                <div class="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1">
                    <span>❦</span><span>The Favor of Your Reply</span><span>❦</span>
                </div>
                <h2 class="text-3xl font-serif text-[#18232c]">Formal Reply Card</h2>
                <p class="text-[#475569] font-serif italic text-sm mt-2">Kindly respond on or before <span class="font-semibold text-[#3A5A74] underline decoration-[#c5a059]">${escapeHtml(config.deadline)}</span>.</p>
            </div>
            <form onsubmit="handleRSVP(event)" class="max-w-xl mx-auto space-y-4 relative z-10">
                <div>
                    <label class="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">Full Name *</label>
                    <input type="text" id="rsvpName" required class="w-full px-4 py-3 rounded-xl border border-[#c8d7e3] bg-[#ffffff] text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-serif placeholder-slate-400">
                </div>
                <div>
                    <label class="block text-xs font-serif font-bold uppercase tracking-wider text-[#18232c] mb-1">Email Address *</label>
                    <input type="email" id="rsvpEmail" required class="w-full px-4 py-3 rounded-xl border border-[#c8d7e3] bg-[#ffffff] text-sm outline-none focus:ring-2 focus:ring-[#3A5A74]/20 text-[#18232c] font-serif placeholder-slate-400">
                </div>
                <button type="submit" class="w-full py-4 bg-[#3A5A74] hover:bg-[#274155] text-white font-serif font-semibold text-sm tracking-widest uppercase rounded-2xl transition border border-[#4D708E] shadow-md">
                    Send Formal Response
                </button>
            </form>
        </section>
    </main>

    <footer class="py-8 text-center text-xs font-serif text-[#475569] border-t border-[#c8d7e3] bg-[#ffffff]/90 relative z-10">
        <div class="flex items-center justify-center space-x-2 text-[#3A5A74] mb-1">
            <span>❦</span>
            <span class="italic font-serif">Forever & Always</span>
            <span>❦</span>
        </div>
        <p>© ${escapeHtml(config.title)}. With deepest love and gratitude.</p>
    </footer>

    <script>
        const EVENT_CONFIG = ${JSON.stringify(config, null, 2)};
        let guestsList = ${guestsJson};

        function toggleAudio() {
            const audio = document.getElementById('bgAudio');
            if (audio.paused) {
                audio.play().then(() => {
                    const icon = document.getElementById('audioIcon');
                    if (icon) icon.className = 'fa-solid fa-volume-high text-sm text-[#3A5A74]';
                }).catch(() => console.log('Click to play audio'));
            } else {
                audio.pause();
                const icon = document.getElementById('audioIcon');
                if (icon) icon.className = 'fa-solid fa-music text-sm';
            }
        }

        // Automatic audio autoplay on load with interaction fallback
        function initAutoplay() {
            const audio = document.getElementById('bgAudio');
            if (!audio) return;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    const icon = document.getElementById('audioIcon');
                    if (icon) icon.className = 'fa-solid fa-volume-high text-sm text-[#3A5A74]';
                    cleanupAutoplay();
                }).catch(() => {
                    // Browser requires interaction first
                });
            }
        }

        function cleanupAutoplay() {
            window.removeEventListener('click', initAutoplay);
            window.removeEventListener('touchstart', initAutoplay);
            window.removeEventListener('pointerdown', initAutoplay);
            window.removeEventListener('scroll', initAutoplay);
        }

        window.addEventListener('DOMContentLoaded', initAutoplay);
        window.addEventListener('click', initAutoplay, { passive: true });
        window.addEventListener('touchstart', initAutoplay, { passive: true });
        window.addEventListener('pointerdown', initAutoplay, { passive: true });
        window.addEventListener('scroll', initAutoplay, { passive: true });

        function findSeat() {
            const q = document.getElementById('seatSearch').value.trim().toLowerCase();
            const res = document.getElementById('seatResult');
            if (!q) return;
            const found = guestsList.find(g => g.name.toLowerCase().includes(q));
            res.classList.remove('hidden');
            if (found && found.attending === 'yes') {
                res.innerHTML = '<div class="text-stone-900 font-bold">' + found.name + '</div><div class="text-rose-900 mt-1">' + (found.table || 'Table 1') + ' • ' + (found.seat || 'Seat 1') + '</div>';
            } else {
                res.innerHTML = '<div class="text-stone-500">No confirmed reservation found under that name.</div>';
            }
        }

        function handleRSVP(e) {
            e.preventDefault();
            const name = document.getElementById('rsvpName').value.trim();
            alert('Thank you, ' + name + '! Your RSVP has been received.');
        }

        function handleGuestbook(e) {
            e.preventDefault();
            const name = document.getElementById('gbName').value.trim();
            const relation = document.getElementById('gbRelation').value.trim();
            const message = document.getElementById('gbMessage').value.trim();
            if (!name || !message) return;

            const feed = document.getElementById('guestbookFeed');
            const card = document.createElement('div');
            card.className = 'p-4 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-1';
            card.innerHTML = '<div class="flex items-center justify-between text-xs">' +
                '<span class="font-serif font-bold text-[#18232c]">' + name + (relation ? ' <span class="text-[10px] text-[#3A5A74] bg-[#ebf2f7] px-2 py-0.5 rounded-full ml-1">' + relation + '</span>' : '') + '</span>' +
                '<span class="text-slate-400">Just now</span>' +
                '</div>' +
                '<p class="font-serif italic text-xs text-[#334155]">"' + message + '"</p>';
            feed.prepend(card);
            document.getElementById('gbName').value = '';
            document.getElementById('gbRelation').value = '';
            document.getElementById('gbMessage').value = '';
            alert('Thank you, ' + name + '! Your heartfelt wish has been posted to the guestbook ❦');
        }

        // Countdown timer
        function updateCountdown() {
            const target = new Date('${config.targetDate}').getTime();
            const now = new Date().getTime();
            const diff = target - now;
            if (diff <= 0) return;
            document.getElementById('cdDays').innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
            document.getElementById('cdHours').innerText = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            document.getElementById('cdMins').innerText = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('cdSecs').innerText = Math.floor((diff % (1000 * 60)) / 1000);
        }
        setInterval(updateCountdown, 1000);
        updateCountdown();
    </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
