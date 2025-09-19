# Google Services Configuration

This project uses Firebase/Google Services for Android builds. To set up the configuration:

## Setup Instructions

1. **Create a Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.

2. **Add Android App**: In your Firebase project, add an Android app with the package name:
   - Development: `com.slopus.happy.dev`
   - Preview: `com.slopus.happy.preview`  
   - Production: `com.ex3ndr.happy`

3. **Download Config**: Download the `google-services.json` file from Firebase.

4. **Setup Local Config**: Copy `google-services.json.template` to `google-services.json` and replace the placeholder values:

```bash
cp google-services.json.template google-services.json
```

5. **Update Values**: Replace the following in `google-services.json`:
   - `YOUR_PROJECT_NUMBER` → Your Firebase project number
   - `YOUR_PROJECT_ID` → Your Firebase project ID  
   - `YOUR_MOBILE_SDK_APP_ID` → Your Firebase mobile SDK app ID
   - `YOUR_GOOGLE_API_KEY_HERE` → Your Google API key from Firebase
   - `com.yourapp.package` → Your actual package name

## Security Note

The `google-services.json` file contains sensitive configuration data and is excluded from version control via `.gitignore`. Never commit the actual file to the repository.

## Build Requirements

The Android build requires this file to be present. The build will fail if `google-services.json` is missing or contains placeholder values.