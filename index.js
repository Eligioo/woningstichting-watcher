const fetch = require("node-fetch")
const telegraf = require("telegraf")
const dotenv = require("dotenv")
const fs = require("fs")
const path = require("path")
dotenv.config()

let houseIds = []
let houseInfo = []
let firstBoot = true
let subs = [381669896]

async function fetchInfo() {
	const request = await fetch("https://www.hurennoordveluwe.nl/portal/object/frontend/getallobjects/format/json")
	const json = await request.json()

	let Ids = []
	let Info = []

	json.result.forEach(house => {
		if(house.doelgroepen[0].id !== 4 && house.model.id != 42) {
			Ids.push(house.id)
			Info.push(house)
		}
	})

	return [Ids, Info]
}

(async () => {
	const bot = new telegraf(process.env.telegram_api)
	const info = await fetchInfo()

	setInterval(async () => {
		if(firstBoot) {
			firstBoot = false
			houseIds = [...info[0]]
			houseInfo = [...info[1]]
			return
		}
		else if(info[0].length >= houseIds.length) {
			let mutation = false

			info[0].forEach(id => {
				if(!houseIds.includes(id)) {
					mutation = true
				}
			})

			if(mutation) {
				let response = ``
				response += `De woningstichting lijst is geupdate:\n\n`
				houseInfo.forEach(house => {
					response += `Locatie: ${house.city.name}\n`
					response += `Straat: ${house.street} ${house.houseNumber}\n`
					response += `Type woning: ${house.dwellingType.name}\n`
					response += `Huur: €${house.totalRent}\n`
					response += `Toewijzing: ${house.model.modelCategorie.name}\n`
					response += `Beschikbaar: ${house.availableFrom}\n`
					response += `Link: https://www.hurennoordveluwe.nl/aanbod/te-huur/details/?dwellingID=${house.id}`
					response += `\n\n`
				})
				subs.forEach(sub => {
					bot.telegram.sendMessage(sub, response)
				})
			}

			houseIds = [...info[0]]
			houseInfo = [...info[1]]
		}
	}, 300000)

	bot.startPolling()

})()