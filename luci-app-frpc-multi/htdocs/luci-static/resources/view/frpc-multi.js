'use strict';
'require view';
'require form';
'require fs';
'require poll';
'require rpc';
'require uci';

const CONFIG_DIR = '/etc/frp/frpc.d/';
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function configPath(name) {
	return CONFIG_DIR + name + '.toml';
}

function verifyConfig(name, content) {
	if (!content.trim())
		return Promise.reject(new Error(_('Configuration must not be empty.')));
	const temporary = CONFIG_DIR + '.verify-' + name + '-' + Date.now() + '-' +
		Math.random().toString(36).slice(2) + '.toml';
	return fs.write(temporary, content, 384).then(function() {
		return fs.exec('/usr/bin/frpc-multi', ['verify', '-c', temporary]);
	}).then(function(result) {
		if (result.code !== 0)
			throw new Error(_('Configuration validation failed:') + '\n' +
				(result.stderr || result.stdout || _('Unknown error')));
	}).finally(function() {
		return L.resolveDefault(fs.remove(temporary), null);
	});
}

function readConfig(name) {
	return fs.read(configPath(name)).catch(function(error) {
		throw new Error(_('Unable to read configuration file:') + ' ' + configPath(name) +
			'\n' + error.message);
	});
}

function writeConfig(sectionId, name, content, oldName) {
	const path = configPath(name);
	return fs.read(path).catch(function(error) {
		if (error.name === 'NotFoundError')
			return null;
		throw error;
	}).then(function(previous) {
		if (name !== oldName && previous !== null)
			throw new Error(_('The target configuration file already exists:') + ' ' + path);
		if (previous === content)
			return;
		return verifyConfig(name, content).then(function() {
			return fs.write(path, content, 384);
		}).then(function() {
			// Include TOML-only edits in LuCI's normal UCI apply/reload flow.
			const revision = Number(uci.get('frpc-multi', sectionId, 'config_revision')) || 0;
			uci.set('frpc-multi', sectionId, 'config_revision',
				String(Math.max(Date.now(), revision + 1)));
		});
	});
}

function instanceRunning(serviceData, name) {
	return !!(serviceData && serviceData['frpc-multi'] &&
		serviceData['frpc-multi'].instances &&
		serviceData['frpc-multi'].instances[name] &&
		serviceData['frpc-multi'].instances[name].running);
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('frpc-multi'),
			L.resolveDefault(callServiceList('frpc-multi'), {}),
			L.resolveDefault(fs.exec('/usr/bin/frpc-multi', ['-v']), {})
		]);
	},

	render: function(data) {
		let serviceData = data[1];
		const version = (data[2].stdout || data[2].stderr || 'unknown').trim();
		const originalNames = {};
		let m, s, o;

		uci.sections('frpc-multi', 'instance', function(section) {
			originalNames[section['.name']] = section.name || '';
		});

		m = new form.Map('frpc-multi', _('FRP Client'),
			_('Run multiple independent frpc processes using TOML files in %s. frpc version: %s')
				.format(CONFIG_DIR, version));

		s = m.section(form.GridSection, 'instance', _('Instances'));
		s.anonymous = true;
		s.addremove = true;
		s.addbtntitle = _('Add instance');
		s.nodescriptions = true;

		s.handleRemove = function(section_id, ev) {
			const oldName = originalNames[section_id] || uci.get('frpc-multi', section_id, 'name');
			const removeFile = NAME_RE.test(oldName || '')
				? L.resolveDefault(fs.remove(configPath(oldName)), 0)
				: Promise.resolve();

			return removeFile.then(L.bind(function() {
				return this.super('handleRemove', [section_id, ev]);
			}, this));
		};

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '0';
		o.rmempty = false;
		o.editable = true;
		o.modalonly = false;

		o = s.option(form.Value, 'name', _('Name'));
		o.description = _('Configuration file path: /etc/frp/frpc.d/<name>.toml').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		o.rmempty = false;
		o.placeholder = 'home';
		o.validate = function(section_id, value) {
			if (!NAME_RE.test(value || ''))
				return _('Use 1-64 letters, numbers, underscores or hyphens, starting with a letter or number.');

			let duplicate = false;
			uci.sections('frpc-multi', 'instance', function(section) {
				if (section['.name'] !== section_id && section.name === value)
					duplicate = true;
			});
			return duplicate ? _('The instance name must be unique.') : true;
		};

		o = s.option(form.DummyValue, '_status', _('Status'));
		o.modalonly = false;
		o.renderWidget = function(section_id) {
			return E('span', { 'data-frpc-status': section_id }, [this.cfgvalue(section_id)]);
		};
		o.cfgvalue = function(section_id) {
			const name = uci.get('frpc-multi', section_id, 'name');
			if (uci.get('frpc-multi', section_id, 'enabled') !== '1')
				return _('Disabled');
			return instanceRunning(serviceData, name) ? _('Running') : _('Stopped');
		};

		o = s.option(form.TextValue, '_config', _('Config'));
		o.description = _('If other files are needed, please add them manually.') + ' ' +
			_('Changes cannot be undone after saving.');
		o.modalonly = true;
		o.rows = 24;
		o.wrap = 'off';
		o.rmempty = true;
		o.cfgvalue = function(section_id) {
			const name = originalNames[section_id];
			if (!NAME_RE.test(name || ''))
				return '';
			return readConfig(name);
		};
		o.write = function(section_id, value) {
			const nameOption = this.map.lookupOption('name', section_id)[0];
			const newName = nameOption.formvalue(section_id);
			const oldName = originalNames[section_id];

			if (!NAME_RE.test(newName || ''))
				return Promise.reject(new Error(_('Invalid instance name')));

			const content = String(value || '').replace(/\r\n/g, '\n');
			const writeFile = writeConfig(section_id, newName, content, oldName);

			if (NAME_RE.test(oldName || '') && oldName !== newName) {
				return writeFile.then(function() {
					return L.resolveDefault(fs.remove(configPath(oldName)), 0);
				}).then(function() {
					originalNames[section_id] = newName;
				});
			}
			return writeFile.then(function() {
				originalNames[section_id] = newName;
			});
		};
		o.remove = function(section_id) {
			const nameOption = this.map.lookupOption('name', section_id)[0];
			const newName = nameOption.formvalue(section_id);
			const oldName = originalNames[section_id];

			// A new instance with an empty editor uses an existing same-name file.
			// If no such file exists, leave it absent instead of creating an empty TOML.
			if (!NAME_RE.test(oldName || ''))
				return Promise.resolve();
			if (!NAME_RE.test(newName || ''))
				return Promise.reject(new Error(_('Invalid instance name')));

			const writeFile = writeConfig(section_id, newName, '', oldName);
			if (oldName !== newName) {
				return writeFile.then(function() {
					return L.resolveDefault(fs.remove(configPath(oldName)), 0);
				});
			}
			return writeFile;
		};

		return m.render().then(function(node) {
			poll.add(function() {
				return callServiceList('frpc-multi').then(function(result) {
					serviceData = result;
					document.querySelectorAll('[data-frpc-status]').forEach(function(status) {
						const sectionId = status.getAttribute('data-frpc-status');
						const name = uci.get('frpc-multi', sectionId, 'name');
						status.textContent = instanceRunning(serviceData, name) ? _('Running') :
							(uci.get('frpc-multi', sectionId, 'enabled') === '1' ? _('Stopped') : _('Disabled'));
					});
				}).catch(function() {
					document.querySelectorAll('[data-frpc-status]').forEach(function(status) {
						status.textContent = _('Unknown error');
					});
				});
			}, 3);
			return node;
		});
	}
});
