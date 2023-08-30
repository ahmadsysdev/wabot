# WhatsApp Automation using Baileys JavaScript

This project automates WhatsApp using Baileys JavaScript library. It enables you to interact with WhatsApp programmatically and perform various automated tasks.

## Prerequisites

Before you start using the project, make sure you have the following prerequisites installed on your system:

- Node.js
- npm

You can install them using the following commands:

```bash
sudo apt update && apt upgrade -y
sudo apt install nodejs npm webp -y
```

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
```bash
git clone https://github.com/ahmadsysdev/wabot.git
cd wabot
```
2. Install dependencies:
```bash
npm install
```
3. Configure the project:
- Inside the `config` directory, create a `dev.json` file with the following content:
```json
[
  {
    "name": "John Smith",
    "jid": "6012xxxxxxx@s.whatsapp.net",
    "number": "6012xxxxxxx",
    "email": "yourmail@gmail.com",
    "type": "developer",
    "instagram": "https://instagram.com/{username}",
    "bio": "Hello world!",
    "self": "6012xxxxxxx@s.whatsapp.net"
  }
]
```
- Create a `config.json` file inside the `config` directory with the following content:
```json
[
  {
    "packInfo": {
      "packname": "Original",
      "author": "John Smith"
    },
    "selfname": "WhatsApp Automation Projects",
    "ignore": {
      "directory": [
        "public"
      ]
    },
    "limit": {
      "limitUser": 30,
      "limitPremium": 40,
      "limitProfessional": 70
    },
    "source": "https://example.com/path"
  }
]
```
4. Start the project:
```bash
npm run start
```
5. Scan the QR code in your WhatsApp app to authenticate and complete the setup.

## Contributing

Contributions to this project are welcome. Fell free to open issues and pull requests for suggestions, enhancements, or bug fixes.

## License

This project is licensed under the [GNU General Public License (GPL)](LICENSE).