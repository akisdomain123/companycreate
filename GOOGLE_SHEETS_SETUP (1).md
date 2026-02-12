# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for the AI Spreadsheet Agent.

## 🔑 Prerequisites

- Google Account
- Google Cloud Project
- React application

## 📋 Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Spreadsheet Agent")
4. Click "Create"

### Step 2: Enable Required APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Spreadsheet Agent"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
   - Add test users (your email)
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Spreadsheet Agent Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Click "Create"

5. **Save your Client ID** - it will look like:
   ```
   123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

### Step 4: Create API Key

1. In "Credentials", click "Create Credentials" → "API key"
2. **Save your API Key** - it will look like:
   ```
   AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
   ```
3. (Optional) Restrict the key:
   - Click on the key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Save

### Step 5: Update Your Code

Open `google-sheets-agent.jsx` and update these lines:

```javascript
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Client ID
const API_KEY = 'YOUR_GOOGLE_API_KEY';     // Replace with your API Key
```

Replace with your actual credentials:

```javascript
const CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz';
```

### Step 6: Test Your Integration

1. Start your React application:
   ```bash
   npm start
   ```

2. Open the application in your browser

3. Click "Sign in with Google"

4. Grant permissions when prompted

5. Create a spreadsheet and click "Save to Google Sheets"

## 🎯 Usage Examples

### Creating and Saving to Google Sheets

```
User: "Create a sales tracker"
Agent: [Creates spreadsheet]

User: "Save this to Google Sheets"
Agent: ✅ Successfully created Google Sheet! You can view it here: [link]
```

### Updating Existing Google Sheets

```
User: "Add a row"
Agent: [Adds row locally]

User: "Update Google Sheets"
Agent: ✅ Google Sheet updated successfully!
```

## 🔧 Configuration Options

### Scopes

The application requests these permissions:
- `https://www.googleapis.com/auth/spreadsheets` - Read/write spreadsheets
- `https://www.googleapis.com/auth/drive.file` - Create files in Drive

### Security Best Practices

1. **Never commit credentials to Git**:
   ```bash
   # Add to .gitignore
   .env
   .env.local
   ```

2. **Use environment variables** (recommended):
   ```javascript
   const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
   ```

   Create `.env.local`:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
   REACT_APP_GOOGLE_API_KEY=your_api_key_here
   ```

3. **Restrict API keys** to specific domains in production

## 🚀 Features

### What the Integration Does

1. **Authentication**
   - OAuth 2.0 flow
   - Sign in with Google button
   - Persistent session management

2. **Create Google Sheets**
   - Generates new spreadsheet in user's Google Drive
   - Copies all data and formulas
   - Formats headers (blue background, white text)
   - Auto-resizes columns
   - Returns shareable link

3. **Update Google Sheets**
   - Syncs local changes back to Google Sheets
   - Preserves formatting
   - Updates all cell values

4. **Features**
   - Direct link to view spreadsheet
   - Update button for syncing changes
   - Works alongside CSV download
   - Visual indicators for connection status

## 🐛 Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution**: Make sure you've configured the OAuth consent screen and added your email as a test user.

### Error: "API key not valid"

**Solution**: 
1. Verify the API key is correct
2. Check that Google Sheets API is enabled
3. If restricted, ensure it allows Sheets API

### Error: "Origin not allowed"

**Solution**: Add your domain to "Authorized JavaScript origins" in OAuth credentials.

### Sign-in popup blocked

**Solution**: Enable popups for your domain in browser settings.

### "Failed to create spreadsheet"

**Solution**:
1. Check browser console for detailed error
2. Verify OAuth scopes include `spreadsheets` and `drive.file`
3. Try signing out and back in

## 📊 API Limits

### Google Sheets API Quotas (Free Tier)

- **Read requests**: 300 per minute per project
- **Write requests**: 60 per minute per project
- **Spreadsheets**: No limit on number created

### Rate Limiting

The application handles rate limits automatically. If you hit limits:
- Wait a few seconds between operations
- Consider batching updates

## 🎨 Customization

### Change Spreadsheet Formatting

In `createGoogleSheet` function, modify the `batchUpdate` request:

```javascript
// Custom header colors
backgroundColor: { red: 0.2, green: 0.8, blue: 0.4 }, // Green header

// Custom text formatting
textFormat: {
  foregroundColor: { red: 0, green: 0, blue: 0 }, // Black text
  bold: true,
  fontSize: 12
}
```

### Add More Formatting Options

```javascript
// Freeze header row
{
  updateSheetProperties: {
    properties: {
      sheetId: 0,
      gridProperties: {
        frozenRowCount: 1
      }
    },
    fields: 'gridProperties.frozenRowCount'
  }
}

// Add borders
{
  updateBorders: {
    range: {
      sheetId: 0,
      startRowIndex: 0,
      endRowIndex: sheet.data.length + 1
    },
    top: { style: 'SOLID', width: 1 }
  }
}
```

## 🔐 Production Deployment

### Checklist

- [ ] Configure OAuth consent screen for production
- [ ] Add production domain to authorized origins
- [ ] Use environment variables for credentials
- [ ] Restrict API key to production domain
- [ ] Test OAuth flow in production
- [ ] Monitor API usage in Google Cloud Console
- [ ] Set up error logging
- [ ] Add user feedback for errors

### Environment Variables

```javascript
// Production configuration
const isProd = process.env.NODE_ENV === 'production';

const CLIENT_ID = isProd 
  ? process.env.REACT_APP_GOOGLE_CLIENT_ID_PROD
  : process.env.REACT_APP_GOOGLE_CLIENT_ID_DEV;
```

## 📚 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Sheets API Node.js Quickstart](https://developers.google.com/sheets/api/quickstart/nodejs)
- [API Usage Limits](https://developers.google.com/sheets/api/limits)

## 💡 Tips

1. **Test with a separate Google account** during development
2. **Use test users** in OAuth consent screen before publishing
3. **Monitor API usage** in Google Cloud Console
4. **Keep credentials secure** - never expose them publicly
5. **Handle errors gracefully** with user-friendly messages

## 🎉 Success!

Once configured, users can:
- ✅ Sign in with Google
- ✅ Create spreadsheets with AI
- ✅ Save directly to Google Sheets
- ✅ Update existing sheets
- ✅ View and edit in Google Sheets
- ✅ Share with team members

Your spreadsheet agent is now fully integrated with Google Sheets! 🚀
