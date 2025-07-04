# Faculty Self-Service Update Workflow

## Overview
A secure, email-based system for faculty to update their own information with verification.

## Workflow

### 1. Request Update Link
Faculty member clicks "Update My Info" button in modal, which:
- Opens email client with pre-filled message
- Subject: "Faculty Profile Update Request - [Name]"
- To: evomics-faculty-updates@example.edu
- Body: Pre-filled with faculty ID and name

### 2. Receive Secure Update Link
Admin receives email and:
1. Verifies faculty identity
2. Generates unique update token (expires in 48 hours)
3. Sends personalized update link

### 3. Update via Secure Form
Faculty clicks link and sees pre-filled form with:
- Current information displayed
- Editable fields for updates
- Change tracking (shows what's being modified)
- Submit with confirmation

### 4. Review & Approval
Updates go to staging area where admin can:
- Review all changes
- See diff of old vs new data
- Approve/reject with one click
- Batch approve multiple updates

### 5. Automatic Integration
Approved updates:
- Merge into facultyEnriched.json
- Trigger rebuild and deployment
- Email confirmation to faculty

## Implementation Components

### Backend Requirements
```javascript
// Minimal backend endpoints needed
POST /api/update-request   // Generate update token
GET  /api/update/:token    // Retrieve current data
POST /api/update/:token    // Submit updates
GET  /api/admin/pending    // View pending updates
POST /api/admin/approve    // Approve updates
```

### Security Features
- Tokens expire after 48 hours
- One-time use tokens
- Email verification required
- Admin approval workflow
- Audit trail of all changes

### Email Templates

#### Update Request Confirmation
```
Subject: Update Your Evomics Faculty Profile

Dear Dr. [Name],

Click the secure link below to update your faculty profile:
[SECURE_UPDATE_LINK]

This link will expire in 48 hours.

Best regards,
The Evomics Team
```

#### Update Confirmation
```
Subject: Your Faculty Profile Has Been Updated

Dear Dr. [Name],

Your faculty profile has been successfully updated.
View your updated profile at: [PROFILE_LINK]

Changes made:
- [LIST_OF_CHANGES]

Best regards,
The Evomics Team
```

## Alternative: GitHub-Based Updates

For a developer-friendly approach:

1. **Fork & Edit**
   - Faculty fork the repository
   - Edit their entry in facultyEnriched.json
   - Submit pull request

2. **GitHub Actions Validation**
   - Automatically validate JSON structure
   - Check that only their entry was modified
   - Run tests to ensure no breaking changes

3. **Easy Merge**
   - Admin reviews PR
   - One-click merge
   - Auto-deploy on merge

## Recommended Approach

## ✅ IMPLEMENTED: Google Forms Workflow

**Form URL**: https://docs.google.com/forms/d/e/1FAIpQLSfgjNj8lJF4Iw4z_oFTUHkAwgcq5_XjcPDmoFUmtpZECthdlw/viewform

**Email**: fourthculture@gmail.com

### Why Google Forms:
- No backend development needed
- Faculty familiar with Google Forms
- Easy to implement validation
- CSV export is straightforward
- Can process updates in batches

**Upgrade to Option 2/3** when:
- Volume of updates increases
- Need real-time updates
- Want to reduce manual processing
- Have backend infrastructure

## Quick Implementation Plan

### Week 1: Google Form Setup
1. Create form with all fields
2. Add validation rules
3. Test with 2-3 faculty
4. Create processing script

### Week 2: Process First Batch
1. Email form to 10-20 faculty
2. Process responses
3. Update JSON files
4. Deploy changes

### Week 3: Scale Up
1. Email all faculty
2. Set up weekly processing
3. Document workflow
4. Train backup admin

## Metrics to Track
- Response rate
- Time to process updates
- Accuracy of submissions
- Faculty satisfaction
- Update frequency