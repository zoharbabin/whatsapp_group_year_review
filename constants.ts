
export const STOP_WORDS = new Set([
  // English Stop Words
  'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'it', 'on', 'that', 'this', 'with', 'me', 'you', 'are', 'not', 'have', 'be', 'at', 'was', 'my', 'but', 'so', 'he', 'she', 'they', 'we', 'from', 'do', 'can', 'as', 'if', 'will', 'just', 'all', 'there', 'one', 'what', 'out', 'up', 'down', 'or', 'about', 'who', 'get', 'go', 'know', 'like', 'time', 'how', 'when', 'some', 'now', 'see', 'think', 'good', 'more', 'very', 'back', 'no', 'yes', 'did', 'well', 'way', 'your', 'than', 'them', 'then', 'its', 'our', 'us', 'an', 'by', 'has', 'had', 'been', 'would', 'could', 'should', 'too', 'only', 'also', 'most', 'any', 'much', 'these', 'those', 'where', 'why', 'here', 'over', 'into', 'even', 'after', 'before', 'while', 'since', 'until', 'because', 'off', 'through', 'under', 'again', 'never', 'always', 'really', 'too', 'pm', 'am', 'http', 'https', 'www', 'com', 'co', 'il', 'org', 'net', 'hey', 'lol', 'haha', 'hahaha', 'omg', 'wow', 'okay', 'ok', 'yeah', 'yep', 'nope', 'guy', 'guys', 'man', 'bro', 'dude', 'cool', 'great', 'nice', 'bad', 'thanks', 'thank', 'sorry', 'please', 'maybe', 'bit', 'lot',
  
  // WhatsApp System / Export Artifacts (English)
  'image', 'omitted', 'video', 'sticker', 'audio', 'document', 'attached', 'message', 'deleted', 'call', 'missed', 'you', 'added', 'left', 'removed', 'changed', 'security', 'code', 'group', 'icon', 'subject', 'description', 'settings', 'admin', 'created', 'waiting', 'this', 'end-to-end', 'encrypted', 'edited', 'file', 'media', 'jpg', 'png', 'mp4', 'mov', 'webp', 'opus', 'null', 'undefined', 'gif',
  
  // Hebrew Stop Words (Comprehensive - Pronouns & Prepositions)
  'לא', 'את', 'זה', 'אני', 'של', 'על', 'מה', 'כן', 'הוא', 'עם', 'אבל', 'יש', 'גם', 'היה', 'כי', 'אם', 'אתה', 'אנחנו', 'הם', 'רק', 'או', 'כל', 'אז', 'לי', 'לך', 'כזה', 'טוב', 'היא', 'שזה', 'בזה', 'יותר', 'אין', 'כמו', 'איך', 'כבר', 'אחרי', 'עד', 'רגע', 'פה', 'שם', 'הכל', 'ממש', 'הזה', 'אחד', 'עוד', 'מי',
  'ה', 'ו', 'ב', 'ל', 'מ', 'כ', 'ש',
  'לו', 'לה', 'לנו', 'לכם', 'להם',
  'אותי', 'אותך', 'אותו', 'אותה', 'אותנו', 'אותכם', 'אותם', 'אותן',
  'שלי', 'שלך', 'שלו', 'שלה', 'שלנו', 'שלכם', 'שלהם', 'שלהן',
  'בו', 'בה', 'בנו', 'בכם', 'בהם',
  'הייתי', 'היית', 'הייתה', 'היינו', 'הייתם', 'היו',
  'תהיה', 'יהיה', 'תהיו', 'יהיו', 'נהיה',
  'ככה', 'למה', 'מתי', 'איפה', 'לאן', 'מאיפה',
  
  // Common Verbs & Actions
  'פשוט', 'אולי', 'צריך', 'רוצה', 'יכול', 'יודע', 'חושב', 'עושה', 'רואה', 'נראה', 'אומר',
  'צריכה', 'צריכים', 'צריכות', 'רוצים', 'רוצות', 'יודעת', 'יודעים', 'יודעות', 'חושבת', 'חושבים', 'חושבות', 'עושים', 'עושות', 'נראית', 'נראים', 'נראות', 'אומרת', 'אומרים', 'אומרות',
  'לעשות', 'לראות', 'להיות', 'להגיד', 'ללכת', 'לבוא', 'לקחת', 'לתת', 'לקבל', 'להביא', 'לשים', 'להבין', 'לדעת',
  'עשיתי', 'עשית', 'עשה', 'עשתה', 'עשינו', 'עשיתם', 'עשו',
  'אמרתי', 'אמרת', 'אמר', 'אמרה', 'אמרנו', 'אמרתם', 'אמרו',
  'הלכתי', 'הלכת', 'הלך', 'הלכה', 'הלכנו', 'הלכתם', 'הלכו',
  'בא', 'באה', 'באים', 'באות', 'מגיע', 'מגיעה', 'מגיעים', 'מגיעות', 'הולך', 'הולכת', 'הולכים', 'הולכות',
  'מסכים', 'מבין', 'תגיד', 'תגידו',

  // Conversational Fillers & Slang
  'בסדר', 'תודה', 'סבבה', 'יאללה', 'ביי', 'היי', 'אה', 'וואלה', 'וואי', 'חחח', 'חחחח', 'חחחחח', 'חח', 'פחח',
  'אחלה', 'מעולה', 'יופי', 'טוב', 'רע', 'גדול', 'קטן', 'חדש', 'ישן',
  'בטח', 'כמובן', 'לגמרי', 'נראה לי', 'בבקשה', 'סליחה', 'שלום', 'להתראות',
  'סתם', 'כאילו', 'בעצם', 'דווקא', 'ממש', 'מאוד', 'הכי', 'קצת', 'הרבה', 'פחות', 'יותר',
  'נכון', 'וואו', 'מזל', 'טוב', 'מזלט', 'מזל טוב', 'מזל-טוב',
  
  // Time & Frequency
  'היום', 'מחר', 'אתמול', 'שנה', 'יום', 'שבוע', 'חודש', 'בוקר', 'ערב', 'לילה', 'צהריים',
  'עכשיו', 'אח״כ', 'אחכ', 'אחר כך', 'תמיד', 'אף פעם', 'לפעמים', 'מדי פעם', 'זמן', 'שנים', 'פעם',
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',

  // Common Nouns/Objects often irrelevant without context
  'אנשים', 'דברים', 'משהו', 'מישהו', 'בית', 'מקום', 'דרך', 'כסף', 'שקל', 'דולר',
  'עבודה', 'משרד', 'ילד', 'ילדה', 'ילדים', 'הורים', 'אבא', 'אמא', 'אחי',
  'הודעה', 'תמונה', 'סרטון', 'קבוצה', 'שיחה', 'טלפון', 'מספר',
  'נתונים', 'ישראל', 'בישראל', 'בעולם', 'העולם',

  // Conjunctions & Connectors
  'אבל', 'אלא', 'אם', 'אמנם', 'אף', 'אצל', 'אשר', 'את', 'בגלל', 'בין', 'בלי', 'גם', 'דבר', 
  'חזר', 'כאשר', 'כבר', 'כה', 'כולם', 'כולן', 'כפי', 'כש', 
  'למי', 'לעבר', 'לפני', 'מאוד', 'מהם', 'מהן', 'מכיוון', 'מכל', 'מן', 'מפני', 
  'מתחת', 'נגד', 'נו', 'עד', 'עוד', 'עליו', 'עליה', 'עליהם', 'עליהן', 'עם', 
  'עצמו', 'עצמה', 'עצמם', 'עצמן', 'רק', 'שוב', 'שלהם', 'שלהן', 
  'שהוא', 'שאתה', 'שאני', 'שהיא', 'שאנחנו', 'שהם', 'שהן', 'באמת', 'כמה', 
  'הזאת', 'האלה', 'הלו', 'בכל', 'בכלל', 'ולא', 'וגם', 'וזה', 'וכל', 'ואז', 'ואני', 'והוא', 'והיא', 
  'כדי', 'רואים', 'לגבי', 'בי', 'בך', 'בנו', 'שום', 'אחת', 'אחד', 'שני', 'שתי', 'שניים', 'שתיים',
  'הזו', 'הזה', 'הזאת', 'האלו', 'אלו', 'אלה', 'לפי', 'לזה', 'בזה', 'מזה', 'כזה', 'כזאת', 'כאלה',

  // WhatsApp System / Export Artifacts (Hebrew)
  'הושמטה', 'נמחקה', 'סטיקר', 'מסמך', 'צורף', 'שלא', 'נענתה', 'הוסיף', 'הוסיפה', 'הסיר', 'הסירה', 
  'עזב', 'עזבה', 'שינה', 'שינתה', 'קוד', 'אבטחה', 'נושא', 'תיאור', 'הגדרות', 'מנהל', 'יצר', 'יצרה', 
  'ממתין', 'הזמנה', 'הצטרף', 'הצטרפה', 'הוצא', 'הוצאה'
]);

// A simulated group chat for demonstration purposes
export const DEMO_CHAT_CONTENT = `[10/01/24, 09:30:00 AM] System: ‎Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
[10/01/24, 09:30:05 AM] Alex 'Admin': ‎Alex 'Admin' created group "The Weekend Planners 🏖️"
[10/01/24, 09:30:15 AM] Alex 'Admin': ‎Alex 'Admin' added Sarah, Mike, and Emily
[10/01/24, 09:31:00 AM] Alex 'Admin': Welcome everyone! This group is strictly for planning the summer trip. No memes please (looking at you Mike).
[10/01/24, 09:32:45 AM] Mike (The Jokester): You know that's impossible Alex 😂
[10/01/24, 09:32:50 AM] Mike (The Jokester): <attached: 00000012-PHOTO-2024-01-10-09-32.jpg>
[10/01/24, 09:33:10 AM] Sarah: Ugh Mike, we literally just started.
[10/01/24, 09:33:15 AM] Sarah: Anyway, I found this great Airbnb in Spain! 
[10/01/24, 09:33:20 AM] Sarah: https://www.airbnb.com/rooms/12345678
[10/01/24, 09:35:00 AM] Emily: That looks amazing! 😍 Does it have a pool?
[10/01/24, 09:35:10 AM] Sarah: Yes! And it's near the beach.
[10/01/24, 09:40:00 AM] Alex 'Admin': I'm checking flights. Prices are kinda high right now.
[10/01/24, 09:40:05 AM] Alex 'Admin': https://www.skyscanner.com/transport/flights/
[10/01/24, 11:15:00 AM] Mike (The Jokester): Guys check this out
[10/01/24, 11:15:05 AM] Mike (The Jokester): https://www.youtube.com/watch?v=dQw4w9WgXcQ
[10/01/24, 11:15:10 AM] Mike (The Jokester): wait
[10/01/24, 11:15:12 AM] Mike (The Jokester): wrong link
[10/01/24, 11:15:15 AM] Mike (The Jokester): lol
[10/01/24, 12:00:00 PM] Emily: Does anyone know if GhostUser3000 is coming? They haven't said a word.
[10/01/24, 12:01:00 PM] Alex 'Admin': I added them but no response yet.
[11/01/24, 08:00:00 PM] Sarah: Okay, serious question. Pizza or Tacos for dinner tonight?
[11/01/24, 08:00:05 PM] Mike (The Jokester): Tacos 🌮
[11/01/24, 08:00:10 PM] Mike (The Jokester): Tacos 🌮
[11/01/24, 08:00:12 PM] Mike (The Jokester): Tacos 🌮
[11/01/24, 08:00:15 PM] Mike (The Jokester): Tacos 🌮
[11/01/24, 08:01:00 PM] Alex 'Admin': Mike stop spamming. Tacos sounds good though.
[11/01/24, 08:05:00 PM] Emily: I'm down for tacos!
[14/02/24, 10:00:00 AM] Alex 'Admin': Happy Valentines day team! ❤️
[14/02/24, 10:30:00 AM] Sarah: Aww thanks Alex!
[15/03/24, 09:00:00 PM] Mike (The Jokester): Did you see the game last night?
[15/03/24, 09:00:05 PM] Mike (The Jokester): Absolutely insane finish.
[16/03/24, 08:00:00 AM] Sarah: Mike, nobody replied because it was 3 AM.
[16/03/24, 08:05:00 AM] Mike (The Jokester): Worth it.
[20/04/24, 04:20:00 PM] Emily: I found a cheaper flight option!
[20/04/24, 04:20:05 PM] Emily: https://www.expedia.com/flights
[20/04/24, 04:25:00 PM] Emily: It saves us about $200 each.
[20/04/24, 04:30:00 PM] Alex 'Admin': Nice find Emily! Let's book it.
[01/05/24, 10:00:00 AM] Sarah: <attached: 00000013-VIDEO-2024-05-01-10-00.mp4>
[01/05/24, 10:00:10 AM] Sarah: Look at this cat video I found on TikTok
[01/05/24, 10:00:15 AM] Sarah: https://www.tiktok.com/@cute_cats/video/123
[01/05/24, 10:05:00 AM] Mike (The Jokester): 🤣
[01/05/24, 10:06:00 AM] Emily: So cute!!
[15/06/24, 02:00:00 PM] The Storyteller: Guys, I have to tell you about the wildest dream I had last night. So I was riding a giant hamster through the streets of Paris, but the hamster was actually made of cheese. And then it started raining baguettes. It was profound. It really made me think about the fragility of our existence and our dependence on dairy products.
[15/06/24, 02:01:00 PM] Mike (The Jokester): ...
[15/06/24, 02:02:00 PM] Alex 'Admin': ...
[15/06/24, 02:03:00 PM] Sarah: That is certainly... something.
[20/07/24, 09:00:00 AM] Alex 'Admin': Trip is next week! Everyone packed?
[20/07/24, 09:01:00 AM] Mike (The Jokester): I haven't even started.
[20/07/24, 09:02:00 AM] Sarah: 🤦‍♀️
[20/07/24, 09:03:00 AM] Emily: I'm all ready! ✈️
[20/07/24, 09:04:00 AM] GhostUser3000: 👍
[20/07/24, 09:05:00 AM] Mike (The Jokester): HE SPEAKS!
[30/11/24, 10:00:00 AM] Alex 'Admin': That was the best trip ever.
[30/11/24, 10:01:00 AM] Sarah: Agree! We need to do it again next year.
[31/12/24, 11:59:00 PM] Mike (The Jokester): Happy New Year everyone! 🎆
[31/12/24, 11:59:59 PM] All: Happy New Year!
`;
