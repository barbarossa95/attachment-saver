$(() => {
    const electron = require('electron')
    const currentWindow = electron.remote.getCurrentWindow()
    const VkApi = require('node-vkapi')
    const dateformat = require('dateformat')
    const path = require('path')
    const fs = require('fs')
    const mkdirp = require('mkdirp')
    const https = require('https')

    // API INIT
    const api = new VkApi({
        accessToken: currentWindow.token,
        apiVersion: 5.74,
        baseDelay: 500
    })

    let $loader = $('#loader')
        $button = $('#get-button')

    // Add event listener to "get images" button
    $button.click(getHistoryAttachments)

    /**
     * Get button event handler
     *
     * @param  string offset Request offset value
     */
    function getHistoryAttachments (offset = null) {
        const peer_id = document.getElementById('peer_id').value

        // exit if empty field
        if (!peer_id) return

        $button.attr("disabled", true);
        $loader.show()

        api.call('messages.getHistoryAttachments', {
            peer_id,
            media_type: 'photo',
            start_from: offset || 0,
            count: 200,
            photo_sizes: 0,
        }).then(response => {
            let images = response.items.map(item => {
                return {
                    href: getBestQuality(item.attachment.photo),
                    date: new Date(item.attachment.photo.date * 1000)
                }
            })
            saveImages(images, peer_id)
            if (response.next_from) getHistoryAttachments(response.next_from)
            else downloaded(peer_id)

        }).catch(e => console.error(e))
    }

    /**
     * Get image with best quality
     *
     * @param  object attachment Message attachment object
     * @return string            Href of the best quality image
     */
     function getBestQuality (photo) {
        if (photo.hasOwnProperty("photo_2560")) return photo.photo_2560
        if (photo.hasOwnProperty("photo_1280")) return photo.photo_1280
        if (photo.hasOwnProperty("photo_807")) return photo.photo_807
        if (photo.hasOwnProperty("photo_604")) return photo.photo_604
        if (photo.hasOwnProperty("photo_130")) return photo.photo_130
        if (photo.hasOwnProperty("photo_75")) return photo.photo_75
    }

    /**
     * Save images from api response
     *
     * @param  array images Array of images
     * @param  string peer_id Dialog Id
     */
    function saveImages (images, peer_id) {
        // Create dir
        const pathToDownloads = path.resolve(`downloads/${peer_id}`)
        if (!fs.existsSync(pathToDownloads)) mkdirp(pathToDownloads)

        images.forEach(image => {
            let imageName = dateformat(image.date, 'yyyymmdd_HHMMss.jpg')
            let file = fs.createWriteStream(`${pathToDownloads}/${imageName}`);
            https.get(image.href, response => response.pipe(file));
        })
    }

    /**
     * Open explorer on downloadcomplete
     *
     * @param  string peer_id
     */
    function downloaded (peer_id) {
        $loader.hide()
        $button.attr("disabled", false);
        const pathToDownloads = path.resolve(`downloads/${peer_id}`)

        require('child_process').exec(`start "" "${pathToDownloads}"`);
    }
})