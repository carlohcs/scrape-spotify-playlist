const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")
const onlyLetters = (str) => {
  let regExp = /[^a-z]/g
  let letters = str.toLowerCase().replace(regExp, "")

  return letters
}

;(async () => {
  const playlistsFile = fs.readFileSync(
    path.resolve(__dirname, "playlists.txt")
  )
  const playlistsLines = playlistsFile.toString().split(/\n/gim)

  const getData = async () =>
    new Promise(async (resolve, reject) => {
      const playlists = playlistsLines.map((playlist) => {
        let info = playlist.split(" --- ")

        return {
          name: info[0],
          link: info[1]
        }
      })
      const infos = []
      const browser = await puppeteer.launch({
        // headless: false // uncomment if you want to see Chrome in action
      })
      const page = await browser.newPage()
      await page.setViewport({
        width: 1024,
        height: 768,
        deviceScaleFactor: 1
      })

      for (let index = 0; index < playlists.length; index++) {
        const { name, link } = playlists[index]
        const screenShotFile = `./screenshots/${onlyLetters(name)}.png`

        try {

          console.log("Going to:", link)

          await page.goto(link, {
            waitUntil: ["networkidle2"]
          })

          console.log("Saving screenshot file:", screenShotFile)

          await page.screenshot({ path: screenShotFile })

          const { description, owner, ownerProfile } = await page.evaluate(
            () => {
              const { body } = document
              // Note: this selector of course will change
              const owner = body.querySelector(".RANLXG3qKB61Bh33I0r2")

              // Note: this selector of course will change - too
              return {
                description: body.querySelector(".fUYMR7LuRXv0KJWFvRZA")
                  .textContent,
                owner: owner.textContent,
                ownerProfile: `https://open.spotify.com${owner
                  .querySelector("a")
                  .getAttribute("href")}`
              }
            }
          )

          infos.push({
            name,
            link,
            description,
            owner,
            ownerProfile,
            screenShotFile
          })

          console.log("Information obtained:", infos[index])
        } catch (error) {
          console.error('ERROR: ', error)
        }
      }

      await browser.close()
      resolve(infos)
    })

  const playlistsInfos = await getData()

  console.log('Saving playlists.json file...')

  fs.writeFileSync("./playlists.json", JSON.stringify(playlistsInfos))

  console.log("Done.")
})()
