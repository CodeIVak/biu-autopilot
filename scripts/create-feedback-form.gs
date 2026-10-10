/**
 * Creates the "אוטו-פיילוט בר-אילן – סקר איפיון צרכים" Google Form in your Google account.
 *
 * How to run (one time, ~1 minute):
 *   1. Open https://script.google.com → "פרויקט חדש".
 *   2. Replace the editor contents with this file and click ▶ Run (function: createFeedbackForm).
 *   3. Approve the permission prompt (it only creates a form in your Drive).
 *   4. Copy the "Responder link" from the execution log into FEEDBACK_FORM_URL in src/app/config.ts.
 *
 * Privacy by design: no email collection, no ID numbers, and the only contact field is optional.
 */
function createFeedbackForm() {
  var form = FormApp.create('אוטו-פיילוט בר-אילן – סקר איפיון צרכים');
  form
    .setDescription(
      'אוטו-פיילוט בר-אילן הוא כלי שמנווט סטודנטים אוטומטית לכיתה הבאה, לפי מערכת השעות ב-Inbar.\n' +
        'הסקר אנונימי ואורך כ-2 דקות. התשובות ישמשו לתעדוף הפיתוח בגרסאות הבאות.'
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    // Link-only: the form is unlisted by default (reachable only via its URL); respondents
    // never see other people's answers, and only the owner can edit.
    .setPublishingSummary(false)
    .setAllowResponseEdits(false)
    .setProgressBar(true)
    .setConfirmationMessage('תודה על המשוב. לשאלות ובירורים: idan.vaknin1@live.biu.ac.il');

  // --- 1. About you ---
  form.addPageBreakItem().setTitle('קצת עליך').setHelpText('כדי להבין מי משתמש בכלי ומה הוא צריך.');

  form
    .addMultipleChoiceItem()
    .setTitle('באיזו פקולטה את/ה לומד/ת?')
    .setChoiceValues([
      'מדעים מדויקים',
      'הנדסה',
      'מדעי החיים',
      'רפואה',
      'מדעי החברה',
      'משפטים',
      'מדעי הרוח',
      'מדעי היהדות',
      'ניהול / כלכלה',
      'חינוך',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('שנת לימודים')
    .setChoiceValues(["שנה א'", "שנה ב'", "שנה ג'", "שנה ד' ומעלה", 'תואר שני / שלישי'])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle('איזה טלפון יש לך?')
    .setChoiceValues(['אייפון', 'אנדרואיד'])
    .showOtherOption(true)
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('איך את/ה בדרך כלל מגיע/ה לקמפוס?')
    .setChoiceValues(['רכב', 'תחבורה ציבורית', 'ברגל / גר/ה במעונות', 'אופניים / קורקינט'])
    .showOtherOption(true);

  form
    .addMultipleChoiceItem()
    .setTitle('באיזו אפליקציית ניווט את/ה משתמש/ת?')
    .setChoiceValues(['Waze', 'Google Maps', 'Moovit', 'Apple Maps', 'לא משתמש/ת'])
    .showOtherOption(true);

  // --- 2. The problem ---
  form.addPageBreakItem().setTitle('הבעיה').setHelpText('עד כמה התמצאות בקמפוס היא באמת בעיה?');

  form
    .addScaleItem()
    .setTitle('כמה פעמים בסמסטר קורה לך שאת/ה לא בטוח/ה איפה הכיתה או הבניין?')
    .setBounds(1, 5)
    .setLabels('אף פעם', 'כל שבוע')
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('מה הכי מאתגר אותך בהגעה לשיעורים?')
    .setChoiceValues([
      'למצוא את הבניין',
      'למצוא את הכיתה בתוך הבניין (קומה / אגף)',
      'לזכור מה יש לי ומתי',
      'לדעת כמה זמן לוקח להגיע משיעור לשיעור',
      'חניה',
      'שינויי חדרים או ביטולים של הרגע האחרון',
      'מבחנים במקומות שאני לא מכיר/ה',
    ])
    .showOtherOption(true);

  // --- 3. First impressions (only for people who tried it) ---
  form.addPageBreakItem().setTitle('רושם ראשוני').setHelpText('אם עוד לא ניסית את הכלי, אפשר לדלג לעמוד הבא.');

  form
    .addScaleItem()
    .setTitle('בסך הכל, מה דעתך על הכלי?')
    .setBounds(1, 5)
    .setLabels('לא שימושי', 'מעולה');

  form
    .addScaleItem()
    .setTitle('כמה קל היה להתקין ולהפעיל (סימנייה, ייבוא מ-Inbar, יומן)?')
    .setBounds(1, 5)
    .setLabels('מסובך מאוד', 'קל מאוד');

  form
    .addCheckboxItem()
    .setTitle('במה השתמשת?')
    .setChoiceValues([
      'כפתור "ניווט" לשיעור הבא',
      'מערכת שבועית',
      'ייבוא ליומן (.ics)',
      'קיצור Shortcuts / Tasker',
      'עוד לא ניסיתי',
    ]);

  form.addParagraphTextItem().setTitle('מה הכי אהבת?');
  form.addParagraphTextItem().setTitle('מה בלבל אותך, לא עבד או עצבן?');

  // --- 4. Ideas ---
  form.addPageBreakItem().setTitle('רעיונות לעתיד').setHelpText('אילו יכולות כדאי לפתח בהמשך?');

  form
    .addGridItem()
    .setTitle('כמה היית רוצה כל אחד מהפיצ\'רים האלה?')
    .setRows([
      'ניווט בתוך הבניין (קומה וכיתה)',
      'התראה על שינוי חדר / ביטול שיעור',
      'זמן הליכה משוער בין שיעורים',
      'שיבוץ מבחנים (מועד א\'/ב\') ליומן',
      'קישור לחומרי הקורס ב-Moodle מהשיעור',
      'תחבורה ציבורית לקמפוס (Moovit)',
      'חניה פנויה קרובה',
      'ווידג\'ט למסך הבית',
      'מצב כהה',
      'ממשק באנגלית / ערבית',
    ])
    .setColumns(['לא נחוץ', 'נחמד שיהיה', 'חשוב', 'חיוני']);

  form.addParagraphTextItem().setTitle('הצעות נוספות: אילו יכולות היו הופכות את הכלי לחיוני עבורך?');

  form
    .addScaleItem()
    .setTitle('כמה סביר שתמליץ/י על הכלי לחבר/ה?')
    .setBounds(0, 10)
    .setLabels('בכלל לא', 'בטוח');

  form
    .addTextItem()
    .setTitle('רוצה שאחזור אליך או לבדוק גרסאות חדשות ראשון/ה? (לא חובה)')
    .setHelpText('אימייל או טלפון. ישמש רק לפרויקט הזה ולא יועבר לאף אחד.');

  Logger.log('Responder link (put this in FEEDBACK_FORM_URL): ' + form.getPublishedUrl());
  Logger.log('Edit link: ' + form.getEditUrl());
}
