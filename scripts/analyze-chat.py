"""Anonymous keyword analysis of a WhatsApp group export (_chat.txt): how often students ask
where a class is, about room changes, cancellations, etc. Prints counts and example messages
WITHOUT sender names. The export itself is private and gitignored.
usage: python -X utf8 scripts/analyze-chat.py "<export folder>/_chat.txt"
"""
import re, sys, collections
txt = open(sys.argv[1], encoding='utf-8').read().replace('\u200e', '')
msgs = []
for m in re.finditer(r'^\[(\d+/\d+/\d+), [\d:]+\] ([^:]+): (.*?)(?=^\[\d+/\d+/\d+, |\Z)', txt, re.M | re.S):
    msgs.append((m.group(1), m.group(3).strip().replace('\n', ' ')))
cats = {
  'איפה הכיתה / איזה בניין': r'איפה (ה)?(כיתה|שיעור|תרגול|הרצאה|בוחן|מבחן)|באיזה (בניין|בנין|כיתה|חדר)|איזה (בניין|בנין|חדר|כיתה)|מה (ה)?(חדר|כיתה|בניין)',
  'שינוי / העברת חדר': r'(הועבר|עבר|עוברים|הוחלף|שונה|שינוי)\S* ?(ל)?(חדר|כיתה|בניין|בנין|אולם)|חדר חדש|כיתה חדשה|בניין אחר|במקום ב',
  'ביטול / דחייה': r'מבוטל|בוטל|ביטול|לא יתקיים|נדחה|אין (שיעור|תרגול|הרצאה)',
  'מספרי בניינים': r'(בניין|בנין) ?\d{3,4}|\b\d{3,4} ?-? ?(חדר|כיתה)|חדר \d+',
  'מבחנים - מיקום': r'(מבחן|בוחן|מועד)[^.?]{0,40}(איפה|חדר|בניין|בנין|כיתה)',
  'זמן / איחור': r'מאחר|מאחרת|מתחיל(ה|ים)? (ב|עוד)|באיזה שעה|מתי (מתחיל|השיעור|התרגול)',
  'זום / פרונטלי': r'זום|zoom|פרונטלי|מקוון|מוקלט',
  'חניה / הגעה': r'חני(י)?ה|חנות|שער|רכבת|אוטובוס|תחבורה|פקק',
}
counts = collections.Counter(); ex = collections.defaultdict(list)
for d, t in msgs:
    for c, rx in cats.items():
        if re.search(rx, t, re.I):
            counts[c] += 1
            if len(ex[c]) < 8 and 6 < len(t) < 140: ex[c].append(f'{d} | {t}')
print('total messages:', len(msgs), '| date range:', msgs[0][0], '-', msgs[-1][0])
for c, n in counts.most_common():
    print(f'\n## {c}: {n}')
    for e in ex[c]: print('  ', e)
bld = collections.Counter(re.findall(r'(?:בניין|בנין) ?(\d{3,4})', ' '.join(t for _, t in msgs)))
print('\nmost mentioned buildings:', bld.most_common(15))
