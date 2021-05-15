# Jewel Thief the Game

**Application (Game) that demonstrates the Canvas and Buffered Graphics**

This is a minimal Electron application to demonstrate the Canvas

The makor files for this application are:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.

You can learn more about each of these components within the [Quick Start Guide](http://electron.atom.io/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on the computer. From the command line:

```bash
# Clone this repository
git clone https://github.com/thesourorange/electron-jewel-thief.git
# Go into the repository
cd electron-quick-start
# Install dependencies
npm install
# Run the app
npm start
# Package Application for windows
npm run package-win
# Create Windows Installer
npm run create-installer-win
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.


## License

[CC0 1.0 (Public Domain)](LICENSE.md)
