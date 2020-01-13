(() => {
let proxy = "";
if (typeof fetch === "undefined") fetch = require("node-fetch");

function standardizeAlbum (album) {

	return {

		title: album.primary_text,

		id: album.id,
		url: `https://${album.url_hints.subdomain}.${"bandcamp.com"}/album/${album.url_hints.slug}`,
		genre: album.genre_text,
		artist: album.secondary_text,
		location: album.location_text || "Unknown",
		publish_date: new Date(album.publish_date),

		featured_track: album.featured_track,

		album_cover (size = 16) {return `https://f4.bcbits.com/img/${album.type}${album.art_id}_${size}.jpg`},
		bio_image (size = 16) {return `https://f4.bcbits.com/img/${album.bio_image.id}_${size}.jpg`}

	}

}

async function getLocations (options = {
	
	proxy,
	location: "Los Angeles",
	amount: 10
	
}) {

	return (await (await fetch(`${proxy}https://bandcamp.com/api/location/1/geoname_search?q=${options.location}&n=${options.amount}`)).json()).results;

}

async function getAlbums (options = {

	proxy,
	raw: false,

	amount: 10,
	pages: 0,

	sortBy: "new",
	location: 0,

	genre: "electronic",
	subgenre: "vaporwave"

}) {

	async function getPage (page) {

		return await (await fetch(`${proxy}https://bandcamp.com/api/discover/3/get_web?g=${options.genre}&s=${options.sortBy}&p=${page}&gn=${options.location}&f=all&t=${options.subgenre}&lo=true&lo_action_url=https%3A%2F%2Fbandcamp.com`)).json();

	}

	let page = 0;
	let promises = [];
	while (page !== (options.pages || Math.ceil(options.amount / 48))) {

		promises.push(getPage(page));
		page++;

	}

	promises = await Promise.all(promises);
	let final = [];

	for (const resolved of promises) {
		
		final.push(...resolved.items);

	}

	if (!options.pages) final = final.slice(0, options.amount);
	if (!options.raw) final = final.map(_ => standardizeAlbum(_));

	return final;
	
}

/**
 * Gets the page type
 * 
 * @param {string} url Bandcamp album/releases URL
 * @returns {"album"|"releases"}
 */
async function getPageType (url) {

	let pageSrc = await (await fetch(`${proxy}${url}`)).text();

	if (pageSrc.indexOf("var TralbumData =") !== -1) return "album";
	else if (pageSrc.indexOf("TralbumData =")) return "releases";

}

function getReleaseListURL (url) {

	return `${(new URL(url)).origin}/music`;

}

async function getReleases (url) {

	url = getReleaseListURL(url);

}

/**
 * Gets album data
 * 
 * @param {string} url URL of album
 */
async function getAlbum (url) {

	let pageSrc = await (await fetch(`${proxy}${url}`)).text();

	let raw = (new Function("return " + pageSrc.slice(pageSrc.indexOf("var TralbumData =") + "var TralbumData =".length, pageSrc.indexOf("if ( window.FacebookData )") - 1).trim().slice(0, -1)))();

	var album = {

		url,
		id: raw.id,
		title: raw.current.title,
		artist: raw.artist,
		
		description: raw.current.about,
		publish_date: new Date(raw.current.publish_date),
		minimum_price: raw.current.minimum_price

	}

	let i = 0;

	album.tracks = raw.trackinfo.map(_ => {

		return {

			album,

			position: i++,
			title: _.title,
			file: _.file,
			isFeatured: _.id === album.featured_track_id,
			duration: _.duration

		}

	});

	return album;

}

/**
 * Gets embed data from track or album
 * 
 * @param {string} url URL of Album/Track
 */
async function getEmbedData (url) {

	let pageSrc = await (await fetch(`${proxy}${url}`)).text();

	let raw = (new Function("return " + pageSrc.slice(pageSrc.indexOf("var EmbedData =") + "var EmbedData =".length, (pageSrc.indexOf("var FanData") < pageSrc.indexOf("var EmbedData =") ? pageSrc.indexOf("var TralbumData") : pageSrc.indexOf("var FanData")) - 1).trim().slice(0, -1)))();

	return raw.tralbum_param.name === "track" ? (raw.album_embed_data ? {

		albumId: raw.album_embed_data.tralbum_param.value,
		trackId: raw.tralbum_param.value

	} : {

		trackId: raw.tralbum_param.value

	}) : {

		albumId: raw.tralbum_param.value

	}

}

/**
 * Generates embed URL
 * 
 * @param {string|object} urlOrObject URL of Album/Track or EmbedData object
 * @param {object} options Options for embed
 * @param {"large"|"medium"|"small"} options.type Size of embed
 */
async function getEmbedURL (urlOrObject, options = {

	type: "large",
	tracklist: false,

	linkColor: "0687f5",
	backgroundColor: "ffffff",

	tracklist: false,
	transparent: true

}) {

	if (typeof urlOrObject === "string") urlOrObject = await getEmbedData(urlOrObject);

	return `https://bandcamp.com/EmbeddedPlayer/${urlOrObject.albumId ? `album=${urlOrObject.albumId}/` : ""}size=${options.type === "large" || options.type === "medium" ? "large" : "slim"}/bgcol=${options.backgroundColor}/linkcol=${options.linkColor}${urlOrObject.trackId ? `/track=${urlOrObject.trackId}` : ""}/transparent=${options.transparent}/tracklist=${options.tracklist}`;

}

const _ = {

	setProxy (_proxy) {

		proxy = _proxy;

	},

	standardizeAlbum,
	getLocations,
	getAlbums,

	getPageType,
	getReleaseListURL,

	getAlbum,

	getEmbedData,
	getEmbedURL

}

if (typeof module !== "undefined") module.exports = _;
else window.bandcrawl = _;

})();
