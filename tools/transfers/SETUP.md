# Mutual Transfers for English, Mathematics and Science Teachers: setting it up

About 20 minutes, once. Everything runs in your own Google account: a Form
that teachers fill in, a private Sheet that holds the answers, and a small
script that finds matches and emails the teachers concerned. Nothing is added
to the website except one ordinary page with a link to the form.

---

## 1. Create the form

Go to forms.google.com and start a blank form.

**Title:** Mutual Transfers for English, Mathematics and Science Teachers - RCF English

**Description** (paste as it is):

> For English, Mathematics and Science teachers in Sri Lankan government
> schools who are looking for a teacher of the same subject to exchange
> places with. When another teacher's request matches
> yours, RCF English emails you both each other's contact details. Your
> details are sent only to a teacher whose request matches yours, and are
> never published.
>
> This is not a transfer application. If you find a partner, each of you
> still applies through the Ministry of Education or your Provincial
> Department of Education in the usual way.

**Settings** (the gear icon, then Responses):

- **Collect email addresses: Verified.** Teachers sign in with Google, so
  nobody can enter someone else's email address.
- **Allow response editing: On.** This is how a teacher renews or closes a
  request.
- **Send responders a copy of their response: Always.** The copy contains
  the link to edit it later.
- **Limit to 1 response: On.**

### The questions

The script finds each answer by its question title, so type the titles
**exactly** as below, including capitals and brackets.

| # | Question title (exactly) | Type | Required | Options |
|---|---|---|---|---|
| 1 | `Full name` | Short answer | Yes | |
| 2 | `WhatsApp number (optional)` | Short answer | No | |
| 3 | `Subject you teach` | Multiple choice | Yes | `English` / `Mathematics` / `Science` |
| 4 | `District you teach in now` | Dropdown | Yes | the 25 districts, list below |
| 5 | `Type of school you teach in now` | Multiple choice | Yes | `National school` / `Provincial school` |
| 6 | `Level you teach` | Multiple choice | Yes | `Primary (Grades 1 to 5)` / `Secondary (Grades 6 to 13)` |
| 7 | `Medium of your school` | Multiple choice | Yes | `Sinhala` / `Tamil` / `English` / `Bilingual` |
| 8 | `Your service and grade (optional)` | Short answer | No | |
| 9 | `Districts you would accept` | Checkboxes | Yes | the 25 districts, list below |
| 10 | `Anything a matching teacher should know (optional)` | Paragraph | No | |
| 11 | `Is your request still open?` | Multiple choice | Yes | `Yes - keep looking` / `No - remove my request` |
| 12 | `Consent` | Checkboxes | Yes | one box, text below |

**The subject** (question 3) offers exactly three choices, spelled as shown:
`English`, `Mathematics`, `Science`. Teachers are matched only with a teacher
of the same subject. The script accepts only these three, so if you ever add
a subject to the form, add it to `SUBJECTS` near the top of the script too.

**The 25 districts**, for questions 4 and 9. Paste them in one go - Google
Forms makes one option per line:

```
Ampara
Anuradhapura
Badulla
Batticaloa
Colombo
Galle
Gampaha
Hambantota
Jaffna
Kalutara
Kandy
Kegalle
Kilinochchi
Kurunegala
Mannar
Matale
Matara
Monaragala
Mullaitivu
Nuwara Eliya
Polonnaruwa
Puttalam
Ratnapura
Trincomalee
Vavuniya
```

**The consent box** (question 12), one option:

> I agree that RCF English may send my name, email address, WhatsApp number,
> subject, district, school type, level, medium, service and note to a teacher whose
> request matches mine, and send theirs to me. I understand this is not a
> transfer application.

---

## 2. Connect it to a sheet

In the form, open the **Responses** tab and choose **Link to Sheets**, then
**Create a new spreadsheet**. Keep this sheet private: do not share it or
publish it.

Submit the form once yourself as a test, so the sheet has its column
headings. You can delete that row afterwards.

---

## 3. Add the matching script

1. In the sheet, choose **Extensions > Apps Script**.
2. Delete everything in the editor, and paste in the whole of `Code.gs` from
   this folder.
3. Click **Save**.
4. In the function list at the top, choose **installTrigger**, then click
   **Run**.
5. Google asks for permission. Choose your account, then **Advanced > Go to
   (project name) > Allow**. The script asks to read the sheet and to send
   email as you; that is all it does.

The script now runs by itself each time a teacher submits or edits the form.

---

## 4. Check it works

Submit the form twice more with made-up answers that match - for example one
entry teaching in Kandy that accepts Galle, and one in Galle that accepts
Kandy, both "English", "Provincial school" and "Secondary", using two email addresses you
can read. Both addresses should receive "A possible mutual transfer for you"
within a minute, and a new tab called **Matches sent** appears in the sheet.
Then delete the test rows.

---

## 5. Send RCF English the form's link

In the form, click **Send**, then the link icon, and copy the link. Send it
to RCF English; it goes on the website page.

---

## Good to know

- **Who can see the answers:** only you, in the sheet. Teachers see only the
  contact details of a teacher they are matched with.
- **How strict the matching is.** Only the **subject** must be the same: an
  English post is never offered as a swap for a Mathematics one. Everything
  else is weighed, because demanding a perfect fit across 25 districts, two
  school types and two levels means almost nobody is ever introduced. Each
  introduction is graded, and the email says which it is and what differs:
  - **exact** - same school type and level, and each teacher named the
    other's district;
  - **close** - each named the other's district, but the school type or the
    level differs;
  - **possible** - one of them asked for another district in the same
    province, such as Galle when the post is in Matara.

  The grade is recorded in the **Matches sent** tab. To go back to strict
  matching, put `Q.schoolType` and `Q.level` back into `MUST_MATCH` near the
  top of the script; to stop province-level suggestions, make
  `wantsPlaceOf` return `""` instead of `"province"`.
- **Three-way swaps** are found too: A to B's district, B to C's, C to A's.
- **Requests expire after 180 days.** A teacher renews by editing and
  resubmitting their response. Change `EXPIRY_DAYS` to alter this.
- **Closing a request:** the teacher edits their response and chooses "No -
  remove my request". To delete an entry completely, delete its row in the
  sheet.
- **Email limit:** a personal Gmail account can send to about 100 people a
  day from a script. That is ample for this; if it is ever reached, the
  remaining emails go out the next time the script runs.
- **Data protection:** Sri Lanka's Personal Data Protection Act (2022)
  applies to this information. Collect nothing beyond these questions, keep
  the sheet private, and delete a teacher's row if they ask.
