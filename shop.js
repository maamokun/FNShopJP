const fs = require("fs");
const {
	createCanvas,
	loadImage,
	registerFont,
} = require("canvas");
const axios = require("axios");
const moment = require("moment");
const date = moment().format("YYYY MMMM Do");
require("colors");

module.exports = {
	/**
	 * 画像を生成します。
	 */
	async generateShop(shop, watermark) {
		const beforeFinish = Date.now();
		
		console.log("FNShopJP - まーもくん作成 (twitter.com/maamo_kun)".rainbow);

		// フォント
		registerFont("./assets/fonts/Boku2-Bold.otf", {
			family: "Boku2",
			style: "Bold",
		});

		// ショップをチェックする
		if (!shop) process.exit(1);

		// 画像の幅を計算する
		const keys = Object.keys(shop);
		let bigwidth = 0;

		for (let i of keys) {
			let curwidth = 250;
			i = shop[i].entries;

			i.forEach(el => {
				if (el.size === "DoubleWide") curwidth += 1060;
				else if (el.size === "Small") curwidth += 250;
				else if (el.size === "Normal") curwidth += 500;
				else curwidth += 500;
				curwidth += 60;
			});

			if (curwidth > bigwidth) bigwidth = curwidth;
		}

		// 画像を生成する
		const canvasHeight = (keys.length * 1200) + 1000;
		const canvasWidth = bigwidth;

		console.log(`[CANVAS] 幅 ${canvasWidth} x 高さ ${canvasHeight}`.green);
		const canvas = createCanvas(canvasWidth, canvasHeight);
		const ctx = canvas.getContext("2d");

		// スタートポイント
		let featuredX = 150;
		let featuredY = 900;
		let rendered = 0;
		let below = false;

		// 背景
		const background = await loadImage("./assets/background.png");
		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

		console.log("[WATERMARK] 日付けと任意文字を書き込み中".yellow);

		// 「アイテムショップ」
		ctx.fillStyle = "#ffffff";
		ctx.font = "italic 300px \"Burbank Big Rg Bk\"";
		ctx.textAlign = "left";
		ctx.fillText("アイテムショップ", 170, 500);

		// 日付
		ctx.font = "italic 125px \"Burbank Big Rg Bk\"";
		ctx.textAlign = "right";
		ctx.fillText(date, canvas.width - 100, 400);

		// 任意文字
		if (watermark) ctx.fillText(watermark, canvas.width - 100, 550);

		// 書き込み開始する
		for (const i of keys) {
			const items = shop[i].entries;

			// ショップセクション名を書き込む
			if (shop[i].name !== null) {
				console.log(`[SECTIONS] 書き込み中... ${shop[i].name} セクション`.magenta);

				ctx.fillStyle = "#ffffff";
				ctx.font = "italic 100px \"Burbank Big Rg Bk\"";
				ctx.textAlign = "left";
				ctx.fillText(shop[i].name, 185, featuredY - 60);
				ctx.drawImage(await loadImage("./assets/clock.png"), ctx.measureText(shop[i].name).width + 200, featuredY - 160, 125, 125);
			}

			// アイテムを書き込む
			for (const item of items) {

				console.log(`[ITEMS] 書き込み中... ${item.name}`.blue);

				let itemImg;
				let ov;
				let imgWidth = 0;
				let imgHeight = 0;
				let wasBelow = false;

				// 画像の幅・高さを計算する
				if (item.size === "DoubleWide") {
					imgWidth = 1060;
					imgHeight = 1000;
					below = false;
					wasBelow = false;
				} else if (item.size === "Small") {
					imgWidth = 500;
					imgHeight = 480;
					if (below === true) {
						featuredX = featuredX - (imgWidth + 60);
						featuredY = featuredY + 520;
						below = false;
						wasBelow = true;
					} else {
						below = true;
						wasBelow = false;
					}
				} else if (item.size === "Normal") {
					imgWidth = 500;
					imgHeight = 1000;
					below = false;
					wasBelow = false;
				} else {
					imgWidth = 500;
					imgHeight = 1000;
					below = false;
					wasBelow = false;
				}

				// オーバーレイを読み込む
				try {
					ov = await loadImage(`./assets/rarities/${item.series ? item.series.name.toLowerCase().replace(/ /g, "").replace("series", "") : item.rarity.name}Down.png`);
				} catch {
					ov = await loadImage("./assets/rarities/UncommonDown.png");
				}

				// 画像を読み込む
				if (item.images.background) {
					try {
						itemImg = await loadImage(item.images.background);
					} catch {
						console.log(`画像を読み込めませんでした。 ${item.name}`.red);
						itemImg = await loadImage("./assets/placeholder.png");
					}
				} else if (item.images.icon) {
					try {
						itemImg = await loadImage(item.images.icon);
					} catch {
						console.log(`画像を読み込めませんでした。 ${item.name}`.red);
						itemImg = await loadImage("./assets/placeholder.png");
					}
				} else {
					console.log(`画像を読み込めませんでした。 ${item.name}`.red);
					itemImg = await loadImage("./assets/placeholder.png");
				}

				// 画像を生成する
				if (item.size === "DoubleWide") {
					ctx.drawImage(itemImg, featuredX, featuredY, imgWidth, imgHeight);
					ctx.drawImage(ov, featuredX, featuredY + (imgHeight - 600), imgWidth, 600);
				} else if (item.size === "Small") {
					ctx.drawImage(itemImg, imgWidth / 4.7, 0, imgWidth + 300, imgHeight + 300, featuredX, featuredY, imgWidth, imgHeight);
					ctx.drawImage(ov, featuredX, featuredY + (imgHeight - 600), imgWidth, 600);
				} else {
					ctx.drawImage(itemImg, imgWidth / 2, 0, imgWidth, imgHeight, featuredX, featuredY, imgWidth, imgHeight);
					ctx.drawImage(ov, featuredX, featuredY + (imgHeight - 600), imgWidth, 600);
				}

				// 名前をロード・書き込み
				ctx.fillStyle = "#ffffff";
				let fontSize = 55;
				ctx.font = "italic " + fontSize + "px \"Burbank Big Rg Bk\"";

				let measure = ctx.measureText(item.name.toUpperCase()).width;
				while (measure > (imgWidth - 40)) {
					fontSize = fontSize - 0.6;
					ctx.font = "italic " + fontSize + "px \"Burbank Big Rg Bk\"";
					measure = ctx.measureText(item.name.toUpperCase()).width;
				}
				ctx.textAlign = "center";
				ctx.fillText(item.name.toUpperCase(), featuredX + (imgWidth / 2), featuredY + (imgHeight - (400 / 7.5)));

				// 価格をロード・書き込む
				ctx.fillStyle = "#d3d3d3";
				ctx.font = "30px \"Burbank Big Rg Bk\"";
				ctx.textAlign = "right";
				ctx.fillText(item.price.finalPrice.toLocaleString(), featuredX + (imgWidth - (500 / 6)), featuredY + (imgHeight - (500 / 45)));

				ctx.drawImage(await loadImage("./assets/vbucks.png"), item.size === "DoubleWide" ? featuredX + 560 : featuredX, featuredY + (imgHeight - 500), 500, 500);

				// ゲームプレイタグ
				if (item.effects && item.effects.length) {
					try {
						if (item.effects[0].split(".").pop() == "BuiltInEmote") {
							ctx.drawImage(await loadImage(`./assets/gptags/BuiltInContentEF.png`), featuredX + (imgWidth - 100), featuredY + (imgHeight - 220), 80, 80);
						} else {
							ctx.drawImage(await loadImage(`./assets/gptags/${item.effects[0].split(".").pop()}EF.png`), featuredX + (imgWidth - 100), featuredY + (imgHeight - 220), 80, 80);
						};
					} catch {
						console.log(`ゲームプレイタグをロードできませんでした。 ${item.effects[0].split(".").pop()}`.red);
					}
				}

				// 初期高さに戻す
				if (wasBelow === true) {
					featuredY = featuredY - 520;
				}

				// 欄
				featuredX = featuredX + imgWidth + 60;
				rendered = rendered + 1;
				if (rendered === items.length) {
					rendered = 0;
					featuredY = featuredY + 1200;
					featuredX = 150;
				}
			}
		}

		// 画像を保存する
		const buf = canvas.toBuffer("image/png");

		fs.writeFileSync("FNshop.png", buf);

		// リターンパス
		console.log(`画像を書き込み完了しました。 総レンダー時間 ${(Date.now() - beforeFinish) / 1000}s`.green.bold);
		return buf;
	},

	/**
	 * アイテムをフォーマットする
	 */
	async getShopItems(apiKey, language) {
		const shop = {};

		const items = await axios.get(`https://fortniteapi.io/v2/shop?lang=${language}&renderData=true`, {
			headers: {
				"Authorization": apiKey,
			},
		}).catch(console.error);

		const store = items.data.shop;
		
		if (!store) return console.error("FortniteAPI.ioのAPIキーを入力してください。".red);

		store.forEach(el => {
			if (!shop[el.section.id]) {
				shop[el.section.id] = {
					name: el.section.name,
					entries: [],
				};
			}
			shop[el.section.id].entries.push({
				name: el.displayName,
				description: el.displayDescription,
				id: el.mainId,
				type: el.displayType,
				mainType: el.mainType,
				offerId: el.offerId,
				giftAllowed: el.giftAllowed,
				price: el.price,
				rarity: el.rarity,
				series: el.series,
				images: {
					icon: el.displayAssets[0].url,
					background: el.displayAssets[0].background,
				},
				banner: el.banner,
				effects: el.granted[0].gameplayTags.filter(kek => kek.includes("UserFacingFlags")),
				priority: el.priority,
				section: el.section,
				size: el.tileSize,
				renderData: el.displayAssets[0].renderData,
			});
		});

		return shop;
	},
};
