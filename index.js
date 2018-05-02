// Required libs
const querystring = require('querystring')
const {app, BrowserWindow} = require('electron')
const path = require('path')
const {URL} = require('url')

//Env vars
const VK_CLIENT_ID = 6464011

// Start app
app.once('ready', login)

let window = null

/**
 * Login as use and get token
 */
function login () {
    // Init browser window
    window = new BrowserWindow({
        title: 'Attachments Saver',
        icon: path.resolve('assets/icon.png'),
        frame: true,
        show: false,
    })

    // Show window on page load
    window.once('ready-to-show', window.show)

    window.webContents.on('did-get-redirect-request', redirectHandler)

    // Construct url for oauth2 user authorizing
    let url ="https://oauth.vk.com/authorize"
    const params = {
        client_id: VK_CLIENT_ID,
        redirect_uri: "https://oauth.vk.com/blank.html",
        display: "page",
        scope: "messages",
        response_type: "token",
        v: "5.74",
        revoke: 1,
        state:"test"
    }
    url += "?" + querystring.stringify(params)

    // Load url in window
    window.loadURL(url)
}

/**
 * Function for getting user access token and redirect on main page
 *
 * @param  object event Eventobject
 * @param  string oldUrl Old url string
 * @param  string newUrl New url string
 */
function redirectHandler(event, oldUrl, newUrl) {
    newUrl = new URL(newUrl)

    if (newUrl.pathname !== "/blank.html") return

    let hash = newUrl.hash
    let {access_token} = querystring.parse(hash.substr(1))

    main(access_token)
}

/**
 * Open main window
 *
 * @param  string token User acces token
 */
function main(token) {
    let url = path.resolve('assets/window.html')
    window.token = token
    window.setTitle("Attachments Saver")
    window.loadURL(url)
}

/**
 * Exit function
 */
function exit() {
    process.exit()
}