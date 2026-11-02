// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>

import { load } from 'js-yaml';

export const loadYaml = async filePath => {
	const response = await fetch(filePath);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const config = load(await response.text());
	// A missing file can be answered with index.html by the SPA fallback,
	// which parses as a plain string rather than a mapping.
	if (config === null || typeof config !== 'object') {
		throw new Error('file is missing or is not a YAML mapping');
	}
	return config;
};

const externalRefPath = () => {
	const subdirectory = import.meta.env.VITE_DOMAIN_SUBDIRECTORY;
	return `${subdirectory ? `/${subdirectory}` : ''}/externalRef.yaml`;
};

// Returns the custom external_ref fields configured for `entity`
// ('license' or 'obligation'), or an empty list if the config can't be used.
export const loadExternalRefFields = async entity => {
	try {
		const config = await loadYaml(externalRefPath());
		const fields = config[entity]?.fields;
		if (!Array.isArray(fields)) {
			throw new Error(`no "${entity}.fields" list found`);
		}
		return fields;
	} catch (err) {
		// externalRef.yaml is optional, so this is a developer hint, not a user-facing error.
		// eslint-disable-next-line no-console
		console.warn(
			`Could not load external reference fields from externalRef.yaml (${err.message}). ` +
				'Copy public/externalRef.example.yaml to public/externalRef.yaml to add custom fields.',
		);
		return [];
	}
};
