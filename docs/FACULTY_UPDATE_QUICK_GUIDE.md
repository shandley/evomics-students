# Faculty Update Request - Quick Guide

## When You Receive an Update Request Email

You'll receive emails with:
- **Subject**: Faculty Profile Update Request - [Faculty Name]
- **Body**: Contains faculty name and ID for verification

## Response Template

Reply with:

```
Subject: Re: Faculty Profile Update Request - [Faculty Name]

Dear [Faculty Name],

Thank you for your interest in updating your Evomics faculty profile.

Please complete the following form to submit your updates:
https://docs.google.com/forms/d/e/1FAIpQLSfgjNj8lJF4Iw4z_oFTUHkAwgcq5_XjcPDmoFUmtpZECthdlw/viewform

The form should take about 5 minutes to complete. Your updates will be reviewed and published within 1-2 weeks.

Best regards,
The Evomics Team
```

## Processing Updates

### 1. Download Responses
- Go to your Google Form
- Click "Responses" tab
- Click spreadsheet icon
- Download as CSV

### 2. Run Processing Script
```bash
cd evomics-faculty/faculty-app
node scripts/processFacultyUpdates.mjs ~/Downloads/faculty-updates.csv
```

### 3. Review Changes
```bash
# Check what changed
git diff src/data/facultyEnriched.json
```

### 4. Deploy Updates
```bash
git add src/data/facultyEnriched.json
git commit -m "feat: Faculty profile updates - [Month Year]"
git push origin main
```

### 5. Notify Faculty (Optional)
Send confirmation email:
```
Subject: Your Evomics Faculty Profile Has Been Updated

Your profile has been successfully updated and is now live at:
https://shandley.github.io/evomics-faculty/

Thank you for keeping your information current!
```

## Tips
- Process updates weekly or bi-weekly
- Keep CSV files for records
- Check for duplicate submissions
- Verify faculty identity if unsure