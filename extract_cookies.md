# 🍪 How to Extract YouTube Cookies

To bypass YouTube's bot detection and download protected content, you need to provide your browser cookies.

## Method 1: Using Browser Extensions

### Firefox
1. Install "Cookie Quick Manager" extension
2. Go to https://youtube.com and sign in
3. Click the extension icon
4. Click "Export" → "Export to Netscape format"
5. Save as `cookies.txt` in the project directory

### Chrome/Edge
1. Install "EditThisCookie" extension
2. Go to https://youtube.com and sign in
3. Click the extension icon
4. Click the export button (📋)
5. Copy the JSON content
6. Use a converter tool to convert to Netscape format
7. Save as `cookies.txt` in the project directory

## Method 2: Manual Extraction

### Using curl (Advanced)
```bash
# First, get cookies from your browser
curl -c cookies.txt -b cookies.txt "https://www.youtube.com"
```

### Using Python script
```python
import browser_cookie3
import http.cookiejar

# Extract cookies from Chrome
cookies = browser_cookie3.chrome(domain_name='.youtube.com')

# Save in Netscape format
with open('cookies.txt', 'w') as f:
    f.write('# Netscape HTTP Cookie File\n')
    for cookie in cookies:
        f.write(f'{cookie.domain}\tTRUE\t{cookie.path}\t{"TRUE" if cookie.secure else "FALSE"}\t{cookie.expires}\t{cookie.name}\t{cookie.value}\n')
```

## Method 3: Quick Setup Script

Run this command to install the required Python package and extract cookies:

```bash
pip install browser-cookie3
python3 -c "
import browser_cookie3
import http.cookiejar
cookies = browser_cookie3.chrome(domain_name='.youtube.com')
with open('cookies.txt', 'w') as f:
    f.write('# Netscape HTTP Cookie File\n')
    for cookie in cookies:
        f.write(f'{cookie.domain}\tTRUE\t{cookie.path}\t{\"TRUE\" if cookie.secure else \"FALSE\"}\t{cookie.expires}\t{cookie.name}\t{cookie.value}\n')
print('Cookies extracted to cookies.txt')
"
```

## Important Notes

- Make sure you're signed into YouTube in your browser
- The cookies file should be in the same directory as the application
- Cookies expire, so you may need to update them periodically
- Never share your cookies file as it contains your authentication data

## Troubleshooting

If you still get authentication errors:
1. Make sure you're signed into YouTube in your browser
2. Try clearing your browser cookies and signing in again
3. Check that the cookies.txt file is in the correct format
4. Ensure the file is readable by the application 