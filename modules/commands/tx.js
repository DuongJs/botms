var axios = require("axios")
module.exports.config = {
    name: "tx",
    version: "1.1.1",
    hasPermssion: 0,
    credits: "DC-Nam",
    description: "Chơi tài xỉu ngay trên message",
    commandCategory: "Game",
    usages: "[xỉu/xiu/x || tai/tài/t] + [tiền cược/all/50%]",
    cooldowns: 0,
    envConfig: {
        timeout: 3000, // thời gian kết thục tung xí ngầu, 1000 = 1s
        core: 10, // số tiền cược nhân cho 3
        api_key: "keytest" // key dùng để dùng api
    }
}
module.exports.languages = {
    "vi": {
    	"noOption1": "Bạn phải cược Tài hoặc Xỉu + tiền cược",
        "InvalidSelection": "Lựa chọn của bạn không hợp lệ\n- Các lựa chọn hợp lệ ↓↓💦\n • %5: %4, %5, %6\n • %1: %1, %2, %3",
        "noOption2": "Bạn phải nhập số tiền cược hoặc all, 50%\n - all sẽ cược toàn bộ số tiền hiện có trong túi\n - 50% sẽ cược 50% số tiền hiện có",
        "InvalidBets": "Tiền cược không hợp lệ hoặc nhỏ hơn %1$",
        "notEnoughMoney": "Không đủ %1$ để bắt đầu cược, Bạn còn %2$ trong túi",
        "rollTheDice": "🎲 Tung xí ngầu...\n => Chúc bạn may mắn :))",
        "win": "Nhà cái ra %1, bạn cược %2 => win\n - Thu về %3$, nâng số tiền trong túi lên %4$",
        "lose": "Nhà cái ra %1, bạn cược %2 => lose\n - Mất %3$, số tiền trong túi giảm đi còn %4$",
        "error": "%1, Đã xảy ra lỗi, vui lòng thử lại sau giây lát!"
    },
    "en": {
    	"noOption1": "You must bet Over or Under + stake",
        "InvalidSelection": "Your selections are invalid\n- Valid choices ↓↓💦\n • %5: %4, %5, %6\n • %1: %1, %2, %3",
        "noOption2": "You must enter the bet amount or all, 50%\n - 50% will bet 50% of the available money",
        "InvalidBets": "Invalid bet or less than %1$",
        "notEnoughMoney": "Not enough %1$ to start betting, You have %2$ left in your pocket",
        "rollTheDice": "🎲 Roll the dice... Wish you luck :))",
        "win": "The house makes %1, you bet %2 => win\n - Collected %3$, raise the amount in your pocket to %4$",
        "lose": "%1 %2 %3 %4",
        "error": "%1, An error occurred, please try again in a moment!"
    }
}
module.exports.run = async ({ api, event, args, Currencies, getText }) => {
    try {
    	if (!args[0]) return api.sendMessage(getText("noOption1"), event.threadID, event.messageID)
        const { name, envConfig } = this.config
        const { timeout, core, api_key } = global.config[name]
        var get = (await axios.get("https://6821df2e-d4cb-44c6-abb3-185e21d7d2fb.id.repl.co/taixiu?api_key="  + (api_key || envConfig.api_key))).data
        var moneyUsers = (await Currencies.getData(event.senderID)).money
        var choose = args[0].toLowerCase()
        var bets = parseInt(args[1])
        var typeTai = ["tai", "tài", "t"]
        var typeXiu = ["xiu", "xỉu", "x"]
        var other = ["all", "50%"]
        var arrayNew = []
        if (!arrayNew.concat(typeTai, typeXiu).includes(choose)) return api.sendMessage(getText("InvalidSelection", typeXiu[0], typeXiu[1], typeXiu[2], typeTai[0], typeTai[1], typeTai[2]), event.threadID, event.messageID)
        if (!args[1]) return api.sendMessage(getText("noOption2"), event.threadID, event.messageID)
        if ((isNaN(bets) || bets < 100) && !other.includes(args[1])) return api.sendMessage(getText("InvalidBets", 100), event.threadID, event.messageID)
        if (bets > moneyUsers && !other.includes(args[1])) return api.sendMessage(getText("notEnoughMoney", ChangeCurrency(bets), ChangeCurrency(moneyUsers)), event.threadID, event.messageID)
        return api.sendMessage({
            body: getText("rollTheDice"),
            attachment: await DownLoad(get.start)
        }, event.threadID, (error, info) => {
            return setTimeout(CheckResult, (timeout || envConfig.timeout))
            async function CheckResult() {
            	bets = args[1] == "all"? moneyUsers: args[1] == "50%"? moneyUsers / 2: bets
                api.unsendMessage(info.messageID)
                if (typeTai.includes(choose)) {
                    choose = "tài"
                } else choose = "xỉu"
                if (choose == get.result.substr(0, 3)) {
                    msg = "win", as = "increaseMoney", bets = bets * (core || envConfig.core), moneyUser = moneyUsers + parseInt(bets)
                } else msg = "lose", as = "decreaseMoney", bets = bets, moneyUser = moneyUsers - parseInt(bets)
                return api.sendMessage({
                    body: getText(msg, get.result, choose, ChangeCurrency(bets), ChangeCurrency(moneyUser)),
                    attachment: await DownLoad(get.url)
                }, event.threadID, () => Currencies[as](event.senderID, bets), event.messageID)
            }
        }, event.messageID)
    } catch (e) {
        api.sendMessage(get.msg || getText("error", e), event.threadID)
    }
}
function ChangeCurrency(number) {
	return number.toLocaleString("en-US")
	}
async function DownLoad(url) {
    return (await axios.get(url, {
        responseType: "stream"
    })).data
}