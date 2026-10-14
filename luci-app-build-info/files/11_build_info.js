'use strict';
'require baseclass';
'require fs';
'require uci';

function renderBuildInfo(info) {
	if (!info || typeof info.timestamp != 'number' || info.timestamp <= 0 ||
	    !Number.isFinite(new Date(info.timestamp * 1000).getTime()))
		return '?';
	var zone = (uci.get('system', '@system[0]', 'zonename') || 'UTC').replaceAll(' ', '_'),
	    options = {
		dateStyle: 'medium',
		timeStyle: (uci.get('system', '@system[0]', 'clock_timestyle') || 0) == 0 ? 'long' : 'full',
		hourCycle: (uci.get('system', '@system[0]', 'clock_hourcycle') || 0) == 0 ? undefined : uci.get('system', '@system[0]', 'clock_hourcycle'),
		timeZone: zone
	    }, date;
	try {
		date = new Intl.DateTimeFormat(undefined, options).format(new Date(info.timestamp * 1000));
	} catch (e) {
		options.timeZone = 'UTC';
		date = new Intl.DateTimeFormat(undefined, options).format(new Date(info.timestamp * 1000));
	}
	function link(url, text) {
		return typeof url == 'string' && /^https?:\/\//.test(url)
			? E('a', { 'href': url, 'target': '_blank', 'rel': 'noopener noreferrer' }, [ text ])
			: E('span', {}, [ text ]);
	}
	var run = typeof info.run_id == 'string' && /^\d+$/.test(info.run_id)
		? 'https://github.com/codebotdev/build/actions/runs/' + info.run_id : null;
	var nodes = [ link(run, 'Built'), ' by ', link(typeof info.author_url == 'string' && /^https:\/\/u\.kamino\.eu\.org(?:\/[A-Za-z0-9_]+)?$/.test(info.author_url) ? info.author_url.toLowerCase() : 'https://u.kamino.eu.org', 'kamino'), ' at ', date ],
	    repo = typeof info.source_url == 'string' ? info.source_url.replace(/\/$/, '') : '';
	if (typeof info.branch == 'string' && info.branch.length)
		nodes.push(' · branch: ', link(repo ? repo + '/tree/' + encodeURIComponent(info.branch) : null, info.branch));
	if (typeof info.commit == 'string' && info.commit.length)
		nodes.push(' · commit: ', link(repo ? repo + '/commit/' + encodeURIComponent(info.commit) : null,
			typeof info.short_commit == 'string' && info.short_commit.length ? info.short_commit : info.commit.substring(0, 10)));
	return E('span', {}, nodes);
}

return baseclass.extend({
	title: _('Build information'),

	load: function() {
		return Promise.all([
			L.resolveDefault(fs.read('/usr/share/build-info/build-info.json'), null).then(function(raw) {
				try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
			}),
			L.resolveDefault(uci.load('system'), null)
		]);
	},

	render: function(data) {
		// This include has no section heading or hide toggle; always show its row.
		this.hide = false;
		if (this.id)
			localStorage.removeItem(this.id);
		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, [ _('Build information') ]),
				E('td', { 'class': 'td left' }, [ renderBuildInfo(data[0]) ])
			])
		]);
		// Overview creates the section heading outside the include. Hide only
		// this heading after the returned table has been attached to the DOM.
		requestAnimationFrame(function() {
			var section = table.closest('.cbi-section'),
			    heading = section && section.querySelector('.cbi-title');
			if (heading)
				heading.hidden = true;
		});
		return table;
	}
});
