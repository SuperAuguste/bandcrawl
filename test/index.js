const bandcrawl = require("../src");

// let wait = (ms) => new Promise(_ => setTimeout(_, ms));

let bcc = ["https://pacificplaza.bandcamp.com/album/o-come-all-ye-vapeful", "https://halcyontapes.bandcamp.com/album/the-beautiful-world", "https://fotoshoppe.bandcamp.com/album/christmas-special", "https://futurefunkmonthly.bandcamp.com/track/future-funk-monthly-mix-december-2019", "https://alternateskies.bandcamp.com/album/christmas-forecast"];

(async () => {
	
	let o = {};

	let i = 1;

	for (const b of bcc) {
		
		console.log(`${i} / ${bcc.length} (${b})`)
		o[b] = await bandcrawl.getEmbedURL(b);
		// await wait(100);

		i++;

	}

	console.log();
	console.log(JSON.stringify(o));

})();
