This is a template which allows you to create a Google Forms powered inbox. This is best if you are running a static site or cannot host an inbox on your end. `inboxbare.html` only uses `<input>` elements, while `inboxdraw.html` comes prepackaged with [Tecknar](https://github.com/aadenboy/tecknar) to allow respondants to send drawings.

## Setup
1. [Create a new form](https://docs.google.com/forms/u/0/create). Set a title if you wish.
2. Take the URL for your form and replace `[GOOGLE FORM URL]` in the `<form>` tag with the ID of the form.
3. Create "Short answer" or "Paragraph" questions for each of the `<input>` elements in the form. All questions must be optional.
    * If you are using `inboxdraw.html`, the drawing pad will send data through as text, so use the same question type.
4. Once your form is set up, go to settings and verify that your settings match:
    * "Make this a quiz" should be off.
    * "Collect email addresses" should be "Do not collect".
    * "Allow response editing" should be off.
    * "Limit to 1 response" should be off.
    * "Show progress bar" should be off.
    * "Shuffle question order" should be off.
    * "Show link to submit another response" should be off.
    * "View results summary" should be off.
    * "Disable autosave for all respondents" should be off.
    * "Collect email addresses by default" should be off.
    * "Make questions required by default" should be off.
5. Click the three dots in the top right, then click "Pre-fill form".
6. Fill out each question in the form. Make sure to add text that will distinguish each question.
7. Once finished, click "Get link", and click "Copy link".
8. With the URL, note the names of each parameter. They should be in the format of `entry.[ID]`.
9. Go into each `<input>` tag and replace the name with the name of the parameter it corresponds to.
10. Fill out the form through your website to verify that it is working properly. You should be done.

If you wish to be notified whenever an email comes through, go to your form, navigate to the "Responses" tab, then enable "Get email notifications for new responses" in the "More options for responses" dropdown.
