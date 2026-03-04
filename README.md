# My QR Generator

A professional, free QR code generator built with React and TypeScript. Generate QR codes for URLs, text, vCards, Wi-Fi networks, and emails with instant preview and logo support.

Live site: https://aduseimedia-eng.github.io/qr-scanner/

## ✨ Features

- **5 QR Formats**: URL, Text, vCard, Wi-Fi, and Email
- **Instant Preview**: See your QR code update in real-time
- **Logo Support**: Embed your company logo (PNG, JPG, SVG)
- **Private & Secure**: All processing happens locally in your browser
- **100% Free**: No sign-up, no watermark, no hidden fees
- **PNG Download**: Save crisp, print-ready QR codes
- **Universal Scanning**: Works with all modern QR code readers
- **TypeScript**: Fully typed for better development experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder.

### Preview Build

```bash
npm run preview
```

## 📋 Tech Stack

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **QRCode.js**: QR code generation library

## 📁 Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## 🎯 How It Works

### URL QR Codes
- Enter your website URL
- Optionally add a company logo (up to 5MB)
- The logo is embedded in the QR code with white backing
- Download as PNG for printing or digital sharing

### Text QR Codes
- Encode any text content
- Perfect for WiFi instructions, contact info, or messages

### vCard (Contact) QR Codes
- Create digital business cards
- Supports name, phone, email, organization, and website
- Scanners can auto-import contacts

### Wi-Fi QR Codes
- Generate scannable Wi-Fi connection codes
- Support for WPA, WEP, and open networks
- Guests can connect without typing passwords

### Email QR Codes
- Create codes that open email client
- Pre-populate recipient, subject, and message body

## 🔒 Privacy & Security

All QR code generation happens **locally in your browser**. No data is sent to any server. No cookies, no tracking, no analytics—just pure QR code generation.

## 🛠️ Development

### Code Quality

The project uses TypeScript strict mode for type safety and better IDE support.

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## 📦 Customization

### Modify Colors

Edit the color scheme in `src/App.tsx`:

```typescript
const C: ColorScheme = {
  navy: "#0f2560",
  blue: "#1565c0",
  // ... more colors
};
```

### Adjust QR Size

Change constants in `src/App.tsx`:

```typescript
const QR_SIZE = 256;        // QR code pixel size
const LOGO_SIZE = 72;       // Embedded logo size
```

### Add More QR Types

1. Add new tab to `TABS` array
2. Add state variables for form inputs
3. Add generation logic in `buildData()` function
4. Add UI in the main component

## 🐛 Troubleshooting

### QR code not generating
- Ensure QRCode.js library loads from CDN
- Check browser console for errors
- Verify you have valid input

### Logo not showing
- Use PNG, JPG, or SVG format (under 5MB)
- Ensure logo has appropriate contrast
- Higher correction level is used with logos

### Build issues
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Clear browser cache

## 📝 License

This project is free to use and modify. Made with ❤️ by Adusei Media.

## 🤝 Contributing

Feel free to fork, improve, and submit pull requests!

## 📧 Support

For issues or suggestions, please open an issue on GitHub:
https://github.com/aduseimedia-eng/qr-scanner/issues

---

**Made by Adusei Media** | [Website](https://adusemedia.com) | [GitHub Repo](https://github.com/aduseimedia-eng/qr-scanner)
